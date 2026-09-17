from django.conf import settings
from django.db import models


class Notification(models.Model):
    """Algo que alguien hizo y que le interesa al destinatario."""

    class Verb(models.TextChoices):
        LIKE = "like", "Le dio me gusta a tu publicación"
        COMMENT = "comment", "Comentó tu publicación"
        FOLLOW = "follow", "Empezó a seguirte"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="actions"
    )
    verb = models.CharField(max_length=20, choices=Verb.choices)

    # Nulo para "follow": esa notificación no apunta a ninguna publicación.
    post = models.ForeignKey(
        "posts.Post", on_delete=models.CASCADE, null=True, blank=True,
        related_name="notifications",
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "read"])]

    def __str__(self):
        return f"{self.actor.username} -> {self.recipient.username} ({self.verb})"


def notify(recipient, actor, verb, post=None):
    """Crea una notificación, salvo que sea para ti mismo."""
    if recipient == actor:
        return None
    return Notification.objects.create(
        recipient=recipient, actor=actor, verb=verb, post=post
    )
