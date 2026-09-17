from django.db.models import Count
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.models import Notification, notify
from rest_framework.exceptions import PermissionDenied

from .models import Comment, Follow, Like, Post
from .serializers import CommentSerializer, PostSerializer


class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            Post.objects.filter(school=user.school)
            .select_related("author")
            .annotate(likes_count=Count("likes", distinct=True))
            .annotate(comments_count=Count("comments", distinct=True))
        )
        # /api/posts/?feed=1 -> solo posts de la gente que sigo (y los mios)
        autor = self.request.query_params.get("author")
        if autor:
            qs = qs.filter(author__username=autor)
        if self.request.query_params.get("feed"):
            siguiendo = Follow.objects.filter(follower=user).values_list("following", flat=True)
            qs = qs.filter(author__in=list(siguiendo) + [user.id])
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user, school=self.request.user.school)

    def perform_destroy(self, instance):
        # Solo el autor (o un admin) puede borrar un post.
        if instance.author != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("Solo puedes borrar tus propios posts.")
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
