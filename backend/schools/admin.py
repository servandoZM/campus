from django.contrib import admin

from .models import School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("name", "email_domain", "slug", "is_active", "created_at")
    search_fields = ("name", "email_domain", "slug")
    list_filter = ("is_active",)
