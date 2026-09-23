from rest_framework import serializers

from .access import is_school_mod
from .models import Community, Membership


class CommunitySerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    member_count = serializers.IntegerField(read_only=True, default=0)
    my_role = serializers.SerializerMethodField()
    my_status = serializers.SerializerMethodField()
    can_view = serializers.SerializerMethodField()
    can_manage = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = [
            "id", "slug", "name", "description", "category", "category_label",
            "is_private", "member_count", "created_at",
            "my_role", "my_status", "can_view", "can_manage", "pending_count", "can_delete",
        ]
        read_only_fields = ["id", "slug", "created_at"]

    # El ViewSet pasa en el contexto un diccionario {community_id: (rol, estado)}
    # con TODAS las membresías del usuario, obtenido en una sola consulta.
    def _mine(self, obj):
        return self.context.get("mine", {}).get(obj.id)

    def get_my_role(self, obj):
        m = self._mine(obj)
        return m[0] if m else None

    def get_my_status(self, obj):
        m = self._mine(obj)
        return m[1] if m else None

    def get_can_view(self, obj):
        m = self._mine(obj)
        return (not obj.is_private) or bool(m and m[1] == Membership.Status.ACTIVE) \
            or is_school_mod(self.context["request"].user)

    def get_can_manage(self, obj):
        m = self._mine(obj)
        staff = m and m[1] == Membership.Status.ACTIVE and m[0] in ("owner", "moderator")
        return bool(staff) or is_school_mod(self.context["request"].user)

    def get_can_delete(self, obj):
        # Eliminar la comunidad: solo el dueño o la moderación de la escuela.
        return self.get_my_role(obj) == "owner" or is_school_mod(self.context["request"].user)

    def get_pending_count(self, obj):
        # Solo quien administra ve cuántas solicitudes hay.
        if not self.get_can_manage(obj):
            return None
        return getattr(obj, "pending_count", None)

    def validate_name(self, value):
        value = " ".join(value.split())
        if len(value) < 3:
            raise serializers.ValidationError("El nombre debe tener al menos 3 caracteres.")
        return value


class MemberSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)
    avatar_url = serializers.URLField(source="user.avatar_url", read_only=True)
    major = serializers.CharField(source="user.major", read_only=True)
    semester = serializers.IntegerField(source="user.semester", read_only=True)
    role_label = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = Membership
        fields = ["username", "full_name", "avatar_url", "major", "semester",
                  "role", "role_label", "status", "created_at"]
