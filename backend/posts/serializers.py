from rest_framework import serializers

from communities.models import Community

from .models import Comment, Like, Post


class CommentSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    author_avatar = serializers.URLField(source="author.avatar_url", read_only=True)

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "author",
            "author_username",
            "author_name",
            "author_avatar",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "post", "author", "created_at"]


class PostSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(source="author.username", read_only=True)
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    author_avatar = serializers.URLField(source="author.avatar_url", read_only=True)
    author_major = serializers.CharField(source="author.major", read_only=True)
    author_semester = serializers.IntegerField(source="author.semester", read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(), required=False, allow_null=True
    )
    community_name = serializers.CharField(source="community.name", read_only=True, allow_null=True)
    community_slug = serializers.CharField(source="community.slug", read_only=True, allow_null=True)
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author",
            "author_username",
            "author_name",
            "author_avatar",
            "author_major",
            "author_semester",
            "school",
            "content",
            "image_url",
            "created_at",
            "likes_count",
            "comments_count",
            "liked_by_me",
            "community",
            "community_name",
            "community_slug",
            "can_delete",
        ]
        read_only_fields = ["id", "author", "school", "created_at"]

    # Los tres campos vienen anotados por la query del ViewSet (una sola
    # consulta para toda la lista). Al CREAR un post el objeto recien
    # guardado no trae anotaciones, por eso el fallback con getattr.
    def get_likes_count(self, obj):
        anotado = getattr(obj, "likes_count", None)
        return anotado if anotado is not None else obj.likes.count()

    def get_comments_count(self, obj):
        anotado = getattr(obj, "comments_count", None)
        return anotado if anotado is not None else obj.comments.count()

    def get_liked_by_me(self, obj):
        anotado = getattr(obj, "liked_by_me", None)
        if anotado is not None:
            return anotado
        user = self.context["request"].user
        return Like.objects.filter(post=obj, user=user).exists()

    def get_can_delete(self, obj):
        user = self.context["request"].user
        if obj.author_id == user.id or self.context.get("school_mod"):
            return True
        managed = self.context.get("managed")
        if managed is None:
            from communities.access import managed_ids
            managed = managed_ids(user)
        return bool(obj.community_id and obj.community_id in managed)
