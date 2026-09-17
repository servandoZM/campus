from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "school", "role", "is_school_email_verified", "is_active")
    list_filter = ("school", "role", "is_school_email_verified", "is_active")
    search_fields = ("username", "email")

    # Add our custom fields to the existing Django UserAdmin field layout
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("CAMPUS profile", {"fields": ("school", "role", "is_school_email_verified", "avatar_url", "bio")}),
    )
