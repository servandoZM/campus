from django.contrib import admin

from .models import Community, Membership


class MembershipInline(admin.TabularInline):
    model = Membership
    extra = 0
    raw_id_fields = ("user",)


@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "category", "is_private", "created_at")
    list_filter = ("school", "category", "is_private")
    search_fields = ("name", "description")
    inlines = [MembershipInline]


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "community", "role", "status", "created_at")
    list_filter = ("role", "status")
