from rest_framework import serializers

from .models import Comment, Like, Post


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "author_username", "content", "created_at"]
        read_only_fields = ["id", "post", "author", "created_at"]


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_avatar = serializers.URLField(source="author.avatar_url", read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "author_username",
            "author_avatar",
            "school",
            "content",
            "image_url",
            "created_at",
            "likes_count",
            "comments_count",
            "liked_by_me",
        ]
        read_only_fields = ["id", "author", "school", "created_at"]

    # getattr con fallback: en la lista vienen anotados por la query,
    # pero al crear un post recien guardado no traen la anotacion.
    def get_likes_count(self, obj):
        return getattr(obj, "likes_count", None) or obj.likes.count()

    def get_comments_count(self, obj):
        return getattr(obj, "comments_count", None) or obj.comments.count()

    def get_liked_by_me(self, obj):
        user = self.context["request"].user
        return Like.objects.filter(post=obj, user=user).exists()
