from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reason", "status", "reporter", "reported_user", "post", "school", "created_at")
    list_filter = ("status", "reason", "school")
    search_fields = ("detail", "reporter__username")
