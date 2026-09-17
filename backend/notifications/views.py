from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET"])
def notification_list(request):
    qs = Notification.objects.filter(recipient=request.user).select_related("actor", "post")[:50]
    return Response(NotificationSerializer(qs, many=True).data)


@api_view(["GET"])
def unread_count(request):
    n = Notification.objects.filter(recipient=request.user, read=False).count()
    return Response({"unread": n})


@api_view(["POST"])
def mark_all_read(request):
    Notification.objects.filter(recipient=request.user, read=False).update(read=True)
    return Response({"unread": 0})
