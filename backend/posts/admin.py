from django.contrib import admin

from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("author", "school", "content", "created_at")
    list_filter = ("school", "created_at")
    search_fields = ("content", "author__username")
