from django.urls import path

from .views import upload_image

urlpatterns = [
    path("uploads/image/", upload_image, name="upload-image"),
]
