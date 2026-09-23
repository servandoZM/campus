from django.conf import settings
from django.db import models
from django.db.models import Q


class Community(models.Model):
    """Un espacio dentro de una escuela: carrera, club, deporte, grupo de estudio..."""

    class Category(models.TextChoices):
        MAJOR = "major", "Carrera"
        COURSE = "course", "Materia"
        CLUB = "club", "Club"
        SPORTS = "sports", "Deporte"
        STUDY = "study", "Grupo de estudio"
        INTEREST = "interest", "Interés"
        OTHER = "other", "Otro"

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="communities"
    )
    name = models.CharField(max_length=60)
    # El slug se genera una sola vez al crearla. Si cambia el nombre, la URL
    # se queda igual para no romper enlaces ya compartidos.
    slug = models.SlugField(max_length=70)
    description = models.CharField(max_length=280, blank=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.INTEREST)
    is_private = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="communities_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            # La misma URL puede existir en dos escuelas, nunca dos veces en una.
            models.UniqueConstraint(fields=["school", "slug"], name="community_slug_por_escuela"),
        ]

    def __str__(self):
        return f"{self.name} ({self.school.slug})"


class Membership(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Dueño"
        MODERATOR = "moderator", "Moderador"
        MEMBER = "member", "Miembro"

    class Status(models.TextChoices):
        ACTIVE = "active", "Activo"
        PENDING = "pending", "Solicitud pendiente"

    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["user", "status"])]
        constraints = [
            models.UniqueConstraint(fields=["community", "user"], name="una_membresia_por_persona"),
            # Exactamente un dueño: un índice único parcial sobre las filas de dueño.
            models.UniqueConstraint(
                fields=["community"], condition=Q(role="owner"), name="un_solo_dueno",
            ),
            # Un dueño o moderador nunca puede estar "pendiente".
            models.CheckConstraint(
                condition=Q(status="active") | Q(role="member"),
                name="staff_siempre_activo",
            ),
        ]

    def __str__(self):
        return f"{self.user} en {self.community.name} ({self.role}, {self.status})"
