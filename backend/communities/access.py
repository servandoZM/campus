"""
Reglas de acceso a comunidades, en un solo lugar.

Las usan tanto las vistas de comunidades como las de publicaciones, para que
"quién puede ver" y "quién puede moderar" se decidan igual en toda la API.
"""
from .models import Membership

STAFF_ROLES = (Membership.Role.OWNER, Membership.Role.MODERATOR)


def is_school_mod(user):
    """Moderador de la escuela: puede actuar sobre cualquier comunidad de su escuela."""
    return bool(user.is_staff or getattr(user, "role", "") == "admin")


def active_ids(user):
    """Comunidades donde el usuario es miembro activo."""
    return set(
        Membership.objects.filter(user=user, status=Membership.Status.ACTIVE)
        .values_list("community_id", flat=True)
    )


def managed_ids(user):
    """Comunidades donde el usuario es dueño o moderador."""
    return set(
        Membership.objects.filter(
            user=user, status=Membership.Status.ACTIVE, role__in=STAFF_ROLES
        ).values_list("community_id", flat=True)
    )


def my_membership(user, community):
    return Membership.objects.filter(user=user, community=community).first()


def can_view(user, community):
    if not community.is_private or is_school_mod(user):
        return True
    m = my_membership(user, community)
    return bool(m and m.status == Membership.Status.ACTIVE)


def can_manage(user, community):
    if is_school_mod(user):
        return True
    m = my_membership(user, community)
    return bool(m and m.status == Membership.Status.ACTIVE and m.role in STAFF_ROLES)


def is_owner(user, community):
    m = my_membership(user, community)
    return bool(m and m.role == Membership.Role.OWNER)
