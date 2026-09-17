from django.conf import settings
from django.db import models


class Report(models.Model):
    """Un reporte de un estudiante sobre una publicación o sobre otro usuario."""

    class Reason(models.TextChoices):
        SPAM = "spam", "Spam o publicidad"
        HARASSMENT = "harassment", "Acoso o insultos"
        HATE = "hate", "Discurso de odio"
        SEXUAL = "sexual", "Contenido sexual"
        VIOLENCE = "violence", "Violencia"
        FAKE = "fake", "Cuenta falsa o suplantación"
        OTHER = "other", "Otro"

    class Status(models.TextChoices):
        OPEN = "open", "Pendiente"
        RESOLVED = "resolved", "Resuelto"
        DISMISSED = "dismissed", "Descartado"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_made"
    )
    school = models.ForeignKey("schools.School", on_delete=models.CASCADE, related_name="reports")

    # Exactamente uno de los dos: o se reporta un post, o se reporta un usuario.
    post = models.ForeignKey(
        "posts.Post", on_delete=models.CASCADE, null=True, blank=True, related_name="reports"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
        related_name="reports_received",
    )

    reason = models.CharField(max_length=20, choices=Reason.choices)
    detail = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reports_reviewed",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["school", "status"])]
        constraints = [
            # No puedes reportar dos veces el mismo post.
            models.UniqueConstraint(
                fields=["reporter", "post"], condition=models.Q(post__isnull=False),
                name="unique_report_post",
            ),
            models.UniqueConstraint(
                fields=["reporter", "reported_user"], condition=models.Q(reported_user__isnull=False),
                name="unique_report_user",
            ),
            # Exactamente un objetivo, nunca los dos ni ninguno.
            models.CheckConstraint(
                condition=(
                    models.Q(post__isnull=False, reported_user__isnull=True)
                    | models.Q(post__isnull=True, reported_user__isnull=False)
                ),
                name="report_tiene_un_objetivo",
            ),
        ]

    def __str__(self):
        objetivo = f"post {self.post_id}" if self.post_id else f"@{self.reported_user}"
        return f"{self.reporter} reportó {objetivo} ({self.reason})"
