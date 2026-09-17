from django.contrib.auth.models import AbstractUser
from django.db import models

from schools.models import School


class User(AbstractUser):
    """
    Custom user model. We define this from day one (instead of Django's
    default User) because swapping the user model later, after migrations
    exist, is genuinely painful. Every user belongs to exactly one School.
    """

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        TEACHER = "teacher", "Teacher"
        ADMIN = "admin", "Admin"

    # Nullable on purpose: a platform-level superuser/staff account does not
    # belong to any one school. Every real student and teacher WILL have one.
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    # Set True only after the user clicks the link in their verification email.
    is_school_email_verified = models.BooleanField(default=False)

    avatar_url = models.URLField(blank=True, null=True)
    bio = models.CharField(max_length=280, blank=True)

    # Identidad academica: el corazon del perfil de CAMPUS.
    full_name = models.CharField(max_length=120, blank=True)
    major = models.CharField(max_length=120, blank=True)
    semester = models.PositiveSmallIntegerField(null=True, blank=True)
    interests = models.JSONField(default=list, blank=True)

    def __str__(self):
        # school puede ser None (cuentas de admin de la plataforma).
        if self.school:
            return f"{self.username} ({self.school.slug})"
        return self.username
