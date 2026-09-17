from rest_framework import serializers

from .models import Report


class ReportCreateSerializer(serializers.Serializer):
    """El estudiante solo manda el motivo y el detalle; el objetivo va en la URL."""

    reason = serializers.ChoiceField(choices=Report.Reason.choices)
    detail = serializers.CharField(max_length=300, allow_blank=True, required=False)


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source="reporter.username", read_only=True)
    reported_username = serializers.SerializerMethodField()
    post_preview = serializers.SerializerMethodField()
    reason_label = serializers.CharField(source="get_reason_display", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id", "reason", "reason_label", "detail", "status", "created_at",
            "reporter_username", "reported_username", "post", "post_preview",
        ]

    def get_reported_username(self, obj):
        if obj.reported_user:
            return obj.reported_user.username
        return obj.post.author.username if obj.post else None

    def get_post_preview(self, obj):
        return obj.post.content[:80] if obj.post else None
