from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from communities.access import can_view
from posts.models import Post
from users.models import User

from .cleanup import detach_reports
from .models import Report
from .permissions import IsModerator
from .serializers import ReportCreateSerializer, ReportSerializer


def _crear(request, **objetivo):
    s = ReportCreateSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    reporte, creado = Report.objects.get_or_create(
        reporter=request.user,
        school=request.user.school,
        defaults={"reason": s.validated_data["reason"],
                  "detail": s.validated_data.get("detail", "")},
        **objetivo,
    )
    if not creado:
        return Response({"detail": "Ya reportaste esto."}, status=status.HTTP_200_OK)
    return Response({"detail": "Gracias. Lo revisaremos."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def report_post(request, pk):
    post = Post.objects.filter(pk=pk, school=request.user.school).select_related("community").first()
    # Una publicación de una comunidad privada no existe para quien no la puede ver.
    if post and post.community and not can_view(request.user, post.community):
        post = None
    if not post:
        return Response({"detail": "No encontrado."}, status=status.HTTP_404_NOT_FOUND)
    if post.author == request.user:
        return Response(
            {"detail": "No puedes reportar tu propia publicación."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return _crear(request, post=post)


@api_view(["POST"])
def report_user(request, username):
    objetivo = User.objects.filter(username=username, school=request.user.school).first()
    if not objetivo:
        return Response({"detail": "No encontrado."}, status=status.HTTP_404_NOT_FOUND)
    if objetivo == request.user:
        return Response(
            {"detail": "No puedes reportarte a ti mismo."}, status=status.HTTP_400_BAD_REQUEST
        )
    return _crear(request, reported_user=objetivo)


# ── Moderación ────────────────────────────────────────────────────


@api_view(["GET"])
@permission_classes([IsModerator])
def report_queue(request):
    estado = request.query_params.get("status", Report.Status.OPEN)
    qs = Report.objects.filter(school=request.user.school, status=estado).select_related(
        "reporter", "reported_user", "post", "post__author"
    )
    return Response(ReportSerializer(qs[:100], many=True).data)


@api_view(["POST"])
@permission_classes([IsModerator])
def resolve_report(request, pk):
    """accion: dismiss | delete_post | disable_user"""
    r = Report.objects.filter(pk=pk, school=request.user.school).first()
    if not r:
        return Response({"detail": "No encontrado."}, status=status.HTTP_404_NOT_FOUND)

    accion = request.data.get("action")

    if accion == "delete_post":
        if not r.post:
            return Response(
                {"detail": "Este reporte no es sobre una publicación."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        post = r.post
        # Desligamos los reportes ANTES de borrar el post: si no, el borrado
        # en cascada se llevaría también el historial de moderación.
        detach_reports([post], reviewer=request.user)
        post.delete()
        return Response({"detail": "Publicación eliminada.", "status": Report.Status.RESOLVED})

    elif accion == "disable_user":
        objetivo = r.reported_user or (r.post.author if r.post else None)
        if not objetivo:
            return Response({"detail": "Sin usuario objetivo."}, status=status.HTTP_400_BAD_REQUEST)
        if objetivo.is_staff:
            return Response(
                {"detail": "No puedes desactivar a un administrador."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        objetivo.is_active = False
        objetivo.save(update_fields=["is_active"])
        r.status = Report.Status.RESOLVED

    elif accion == "dismiss":
        r.status = Report.Status.DISMISSED

    else:
        return Response({"detail": "Acción inválida."}, status=status.HTTP_400_BAD_REQUEST)

    r.reviewed_at = timezone.now()
    r.reviewed_by = request.user
    r.save(update_fields=["status", "reviewed_at", "reviewed_by"])
    return Response({"detail": "Listo.", "status": r.status})


@api_view(["GET"])
@permission_classes([IsModerator])
def moderation_summary(request):
    base = Report.objects.filter(school=request.user.school)
    return Response(
        {
            "open": base.filter(status=Report.Status.OPEN).count(),
            "resolved": base.filter(status=Report.Status.RESOLVED).count(),
            "dismissed": base.filter(status=Report.Status.DISMISSED).count(),
            "students": User.objects.filter(school=request.user.school, is_active=True).count(),
            "disabled": User.objects.filter(school=request.user.school, is_active=False).count(),
            "posts": Post.objects.filter(school=request.user.school).count(),
        }
    )
