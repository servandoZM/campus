from django.urls import path

from .social_views import connections, me, search_users, toggle_follow, user_detail
from .views import CampusTokenObtainPairView, register, verify_email

urlpatterns = [
    path("auth/register/", register, name="register"),
    path("auth/verify/<str:uidb64>/<str:token>/", verify_email, name="verify-email"),
    path("auth/login/", CampusTokenObtainPairView.as_view(), name="login"),
    path("me/", me, name="me"),
    path("users/", search_users, name="search-users"),
    path("connections/", connections, name="connections"),
    path("users/<str:username>/", user_detail, name="user-detail"),
    path("users/<str:username>/follow/", toggle_follow, name="toggle-follow"),
]
