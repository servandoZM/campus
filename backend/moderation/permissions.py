from rest_framework.permissions import BasePermission


class IsModerator(BasePermission):
    """Solo staff de Django o usuarios con rol admin pueden moderar."""

    message = "No tienes permisos de moderación."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_staff or u.role == "admin"))
