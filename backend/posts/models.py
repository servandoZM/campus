from django.conf import settings
from django.db import models

from schools.models import School


class Post(models.Model):
    """Una publicacion en el feed de CAMPUS."""

    # settings.AUTH_USER_MODEL apunta a users.User sin importarlo directo.
    # Asi el codigo sigue funcionando si algun dia mueves el modelo de usuario.
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="posts",
    )

    # Guardamos la escuela en el post tambien (aunque el autor ya tiene una).
    # Es denormalizacion a proposito: permite traer el feed de una escuela
    # completa sin tener que hacer JOIN pasando por la tabla de usuarios.
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="posts",
    )

    content = models.TextField(max_length=500)

    # blank=True  -> el admin y los formularios permiten dejarlo vacio
    # null=True   -> la columna en MySQL acepta NULL
    image_url = models.URLField(blank=True, null=True)

    # auto_now_add: Django pone la fecha solo al CREAR el registro.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # El guion significa descendente: lo mas nuevo primero.
        ordering = ["-created_at"]

    def __str__(self):
        # [:30] corta el texto a los primeros 30 caracteres.
        return f"{self.author.username}: {self.content[:30]}"


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    content = models.TextField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"


class Like(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="likes"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un usuario solo puede dar like una vez por post.
        constraints = [
            models.UniqueConstraint(fields=["post", "user"], name="unique_like_por_usuario")
        ]

    def __str__(self):
        return f"{self.user.username} -> post {self.post_id}"


class Follow(models.Model):
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following"
    )
    following = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["follower", "following"], name="unique_follow"),
            # Nadie puede seguirse a si mismo.
            models.CheckConstraint(
                condition=~models.Q(follower=models.F("following")), name="no_auto_follow"
            ),
        ]

    def __str__(self):
        return f"{self.follower.username} sigue a {self.following.username}"
