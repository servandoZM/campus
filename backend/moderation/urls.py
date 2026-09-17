from django.urls import path

from .views import moderation_summary, report_post, report_queue, report_user, resolve_report

urlpatterns = [
    path("posts/<int:pk>/report/", report_post, name="report-post"),
    path("users/<str:username>/report/", report_user, name="report-user"),
    path("moderation/reports/", report_queue, name="report-queue"),
    path("moderation/reports/<int:pk>/resolve/", resolve_report, name="resolve-report"),
    path("moderation/summary/", moderation_summary, name="moderation-summary"),
]
