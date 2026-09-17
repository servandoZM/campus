from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source="actor.username", read_only=True)
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)
    actor_avatar = serializers.URLField(source="actor.avatar_url", read_only=True)
    post_preview = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id", "verb", "read", "created_at",
            "actor_username", "actor_name", "actor_avatar",
            "post", "post_preview",
        ]

    def get_post_preview(self, obj):
        return obj.post.content[:60] if obj.post else None
