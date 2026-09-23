from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from communities.access import active_ids, is_school_mod, managed_ids
from moderation.cleanup import detach_reports
from notifications.models import Notification, notify

from .models import Comment, Follow, Like, Post
from .serializers import CommentSerializer, PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer

    def get_queryset(self):
        user = self.request.user
        mias = active_ids(user)

        # Lo que este usuario PUEDE ver: publicaciones generales, las de
        # comunidades públicas y las de comunidades privadas donde es miembro.
        visibles = Q(community__isnull=True) | Q(community__is_private=False) | Q(community_id__in=mias)
        base = Post.objects.filter(school=user.school)
        if not is_school_mod(user):
            base = base.filter(visibles)

        qs = (
            base
            .select_related("author", "community")
            .annotate(likes_count=Count("likes", distinct=True))
            .annotate(comments_count=Count("comments", distinct=True))
            # Exists() resuelve "¿yo le di like?" DENTRO de la misma consulta.
            # Antes el serializer hacia una consulta extra POR CADA post:
            # 35 posts = 46 consultas de mas. Ahora son 0.
            .annotate(
                liked_by_me=Exists(
                    Like.objects.filter(post=OuterRef("pk"), user=user)
                )
            )
            # annotate() BORRA el ordering del Meta del modelo, asi que hay
            # que repetirlo aqui. Sin esto el feed sale en orden arbitrario
            # y la paginacion puede repetir un post en dos paginas.
            # El "-id" desempata los posts creados en el mismo segundo.
            .order_by("-created_at", "-id")
        )

        autor = self.request.query_params.get("author")
        comunidad = self.request.query_params.get("community")
        if autor:
            qs = qs.filter(author__username=autor)
        if comunidad:
            qs = qs.filter(community__slug=comunidad)

        # El feed principal (sin autor ni comunidad) muestra publicaciones
        # generales y SOLO las de comunidades donde el usuario es miembro.
        if self.action == "list" and not autor and not comunidad:
            qs = qs.filter(Q(community__isnull=True) | Q(community_id__in=mias))

        # /api/posts/?feed=1 -> solo posts de la gente que sigo (y los mios)
        if self.request.query_params.get("feed"):
            siguiendo = Follow.objects.filter(follower=user).values_list("following", flat=True)
            qs = qs.filter(author__in=list(siguiendo) + [user.id])
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        if self.request.user.is_authenticated:
            # Una sola consulta para saber qué comunidades modera el usuario;
            # el serializer la usa para calcular can_delete de cada post.
            ctx["managed"] = managed_ids(self.request.user)
            ctx["school_mod"] = is_school_mod(self.request.user)
        return ctx

    def perform_create(self, serializer):
        user = self.request.user
        comunidad = serializer.validated_data.get("community")
        if comunidad is not None:
            if comunidad.school_id != user.school_id or comunidad.id not in active_ids(user):
                raise PermissionDenied("Únete a la comunidad para publicar en ella.")
        serializer.save(author=user, school=user.school)

    def perform_update(self, serializer):
        # Solo el autor puede editar su publicacion, y no puede moverla de comunidad.
        if serializer.instance.author != self.request.user:
            raise PermissionDenied("Solo puedes editar tus propias publicaciones.")
        serializer.save(community=serializer.instance.community)

    def perform_destroy(self, instance):
        # Puede borrar: el autor, la moderación de la escuela, o el dueño o
        # un moderador de la comunidad donde vive la publicación.
        user = self.request.user
        puede = (
            instance.author == user
            or is_school_mod(user)
            or (instance.community_id and instance.community_id in managed_ids(user))
        )
        if not puede:
            raise PermissionDenied("Solo puedes borrar tus propios posts.")
        detach_reports([instance])
        instance.delete()

    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        like, creado = Like.objects.get_or_create(post=post, user=request.user)
        if creado:
            notify(post.author, request.user, Notification.Verb.LIKE, post)
        else:
            like.delete()
        return Response(
            {"liked": creado, "likes_count": post.likes.count()}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, pk=None):
        post = self.get_object()
        if request.method == "POST":
            serializer = CommentSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(post=post, author=request.user)
            notify(post.author, request.user, Notification.Verb.COMMENT, post)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        serializer = CommentSerializer(post.comments.select_related("author"), many=True)
        return Response(serializer.data)

    # DELETE /api/posts/<pk>/comments/<comment_id>/
    @action(
        detail=True,
        methods=["delete"],
        url_path=r"comments/(?P<comment_id>[0-9]+)",
    )
    def delete_comment(self, request, pk=None, comment_id=None):
        post = self.get_object()
        comentario = Comment.objects.filter(pk=comment_id, post=post).first()
        if not comentario:
            return Response(
                {"detail": "Comentario no encontrado."}, status=status.HTTP_404_NOT_FOUND
            )

        # Puede borrar: quien lo escribio, el dueño del post, o un moderador.
        # El dueño del post importa: es tu publicacion, decides que queda en ella.
        puede = (
            comentario.author == request.user
            or post.author == request.user
            or is_school_mod(request.user)
            or (post.community_id and post.community_id in managed_ids(request.user))
        )
        if not puede:
            raise PermissionDenied("No puedes borrar este comentario.")

        comentario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
