from django.urls import path

from .views import mark_all_read, notification_list, unread_count

urlpatterns = [
    path("notifications/", notification_list, name="notifications"),
    path("notifications/unread/", unread_count, name="notifications-unread"),
    path("notifications/read/", mark_all_read, name="notifications-read"),
]
