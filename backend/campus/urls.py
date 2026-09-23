from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("users.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("moderation.urls")),
    path("api/", include("uploads.urls")),
    path("api/", include("communities.urls")),
    path("api/", include("posts.urls")),
    path("api-auth/", include("rest_framework.urls")),
]

# Solo en desarrollo: Django sirve las imagenes subidas.
# En produccion las sirve el almacenamiento de objetos / el CDN.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
