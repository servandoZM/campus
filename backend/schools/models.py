from django.db import models


class School(models.Model):
    """
    A single school/university on the platform.

    This is the multi-tenant anchor: every user, post, community, and event
    eventually foreign-keys back to a School, instead of the app being built
    for one hardcoded university. That's what lets CAMPUS answer "can this
    work for 50 universities?" without a rebuild.
    """

    name = models.CharField(max_length=255)

    # The email domain used to auto-verify students on signup,
    # e.g. "itson.edu.mx" -> anyone@itson.edu.mx can register as that school.
    email_domain = models.CharField(max_length=255, unique=True)

    slug = models.SlugField(unique=True, help_text="Used in URLs, e.g. campus.app/s/itson")

    logo_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
