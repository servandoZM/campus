from django.db import transaction
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from moderation.cleanup import detach_reports
from users.models import User

from .access import can_manage, can_view, is_owner, is_school_mod
from .models import Community, Membership
from .serializers import CommunitySerializer, MemberSerializer

ACTIVE, PENDING = Membership.Status.ACTIVE, Membership.Status.PENDING
OWNER, MOD, MEMBER = Membership.Role.OWNER, Membership.Role.MODERATOR, Membership.Role.MEMBER


class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    lookup_field = "slug"
    lookup_value_regex = "[-a-z0-9]+"
    pagination_class = None          # a escala de una escuela, la lista completa basta
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        user = self.request.user
        qs = Community.objects.filter(school=user.school).annotate(
            member_count=Count("memberships", filter=Q(memberships__status=ACTIVE), distinct=True),
            pending_count=Count("memberships", filter=Q(memberships__status=PENDING), distinct=True),
        )
        q = self.request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(description__icontains=q))
        if self.request.query_params.get("mine"):
            qs = qs.filter(id__in=Membership.objects.filter(user=user).values("community_id"))
        return qs.order_by("-member_count", "name")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        if self.request.user.is_authenticated:
            ctx["mine"] = {
                m.community_id: (m.role, m.status)
                for m in Membership.objects.filter(user=self.request.user)
            }
        return ctx

    def _fresh(self, community):
        """Vuelve a leer la comunidad con sus contadores y la serializa."""
        obj = self.get_queryset().get(pk=community.pk)
        return self.get_serializer(obj).data

    # ── crear, editar, borrar ──────────────────────────────────────

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.school:
            raise PermissionDenied("Tu cuenta no pertenece a ninguna escuela.")
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)

        base = slugify(s.validated_data["name"])[:60] or "comunidad"
        slug, n = base, 2
        while Community.objects.filter(school=user.school, slug=slug).exists():
            slug, n = f"{base}-{n}", n + 1

        with transaction.atomic():
            c = s.save(school=user.school, slug=slug, created_by=user)
            Membership.objects.create(community=c, user=user, role=OWNER, status=ACTIVE)
        return Response(self._fresh(c), status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        c = self.get_object()
        if not can_manage(request.user, c):
            raise PermissionDenied("Solo quien administra la comunidad puede editarla.")
        era_privada = c.is_private
        s = self.get_serializer(c, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        with transaction.atomic():
            c = s.save()
            # Al volverla pública, las solicitudes pendientes ya no tienen sentido:
            # se aceptan todas.
            if era_privada and not c.is_private:
                c.memberships.filter(status=PENDING).update(status=ACTIVE)
        return Response(self._fresh(c))

    def update(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        c = self.get_object()
        if not (is_owner(request.user, c) or is_school_mod(request.user)):
            raise PermissionDenied("Solo el dueño o la moderación de la escuela pueden eliminarla.")
        with transaction.atomic():
            # Borrar la comunidad borra sus publicaciones en cascada; antes se
            # rescatan los reportes para no perder el historial de moderación.
            detach_reports(c.posts.all())
            c.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── unirse y salir ─────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def join(self, request, slug=None):
        c = self.get_object()
        m, creada = Membership.objects.get_or_create(
            community=c, user=request.user,
            defaults={"status": PENDING if c.is_private else ACTIVE},
        )
        return Response(self._fresh(c), status=status.HTTP_201_CREATED if creada else status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def leave(self, request, slug=None):
        """Salir de la comunidad o cancelar una solicitud pendiente."""
        c = self.get_object()
        m = Membership.objects.filter(community=c, user=request.user).first()
        if m and m.role == OWNER:
            raise ValidationError({"detail": "Eres el dueño: para salir, elimina la comunidad."})
        if m:
            m.delete()
        return Response(self._fresh(c))

    # ── miembros y solicitudes ────────────────────────────────────

    @action(detail=True, methods=["get"])
    def members(self, request, slug=None):
        c = self.get_object()
        estado = request.query_params.get("status", ACTIVE)
        if estado == PENDING:
            if not can_manage(request.user, c):
                raise PermissionDenied("Solo quien administra la comunidad ve las solicitudes.")
        elif not can_view(request.user, c):
            raise PermissionDenied("Esta comunidad es privada.")
        qs = (
            c.memberships.filter(status=estado).select_related("user")
            .annotate(orden=Case(When(role=OWNER, then=Value(0)), When(role=MOD, then=Value(1)),
                                 default=Value(2), output_field=IntegerField()))
            .order_by("orden", "created_at")
        )
        return Response(MemberSerializer(qs, many=True).data)

    @action(detail=True, methods=["patch", "delete"], url_path=r"members/(?P<username>[^/]+)")
    def member(self, request, slug=None, username=None):
        """
        PATCH  {"status": "active"}        aceptar una solicitud
        PATCH  {"role": "moderator"|"member"}  nombrar o quitar moderador (solo el dueño)
        DELETE                             expulsar a un miembro o rechazar una solicitud
        """
        c = self.get_object()
        actor = request.user
        if not can_manage(actor, c):
            raise PermissionDenied("Solo quien administra la comunidad puede hacer esto.")

        objetivo = User.objects.filter(username=username).first()
        m = Membership.objects.filter(community=c, user=objetivo).first() if objetivo else None
        if not m:
            return Response({"detail": "Esa persona no es miembro."}, status=status.HTTP_404_NOT_FOUND)
        if m.role == OWNER:
            raise PermissionDenied("Nadie puede modificar al dueño de la comunidad.")
        if objetivo == actor:
            raise ValidationError({"detail": "Para salir usa «Salir de la comunidad»."})

        actor_es_dueno = is_owner(actor, c) or is_school_mod(actor)

        if request.method == "DELETE":
            # Un moderador no puede expulsar a otro moderador; el dueño sí.
            if m.role == MOD and not actor_es_dueno:
                raise PermissionDenied("Solo el dueño puede expulsar a un moderador.")
            m.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        nuevo_estado = request.data.get("status")
        nuevo_rol = request.data.get("role")

        if nuevo_estado == ACTIVE and m.status == PENDING:
            m.status = ACTIVE
            m.save(update_fields=["status"])
        elif nuevo_rol in (MOD, MEMBER):
            if not actor_es_dueno:
                raise PermissionDenied("Solo el dueño puede nombrar moderadores.")
            if m.status != ACTIVE:
                raise ValidationError({"detail": "Primero acepta su solicitud."})
            m.role = nuevo_rol
            m.save(update_fields=["role"])
        else:
            raise ValidationError({"detail": "Cambio no válido."})
        return Response(MemberSerializer(m).data)
