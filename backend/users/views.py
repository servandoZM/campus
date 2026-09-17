from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import send_verification_email
from .models import User
from .serializers import CampusTokenObtainPairSerializer, RegisterSerializer


class CampusTokenObtainPairView(TokenObtainPairView):
    serializer_class = CampusTokenObtainPairSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    if settings.SKIP_EMAIL_VERIFICATION:
        user.is_active = True
        user.is_school_email_verified = True
        user.save(update_fields=["is_active", "is_school_email_verified"])
        return Response(
            {
                "detail": "Cuenta creada y activada (modo pruebas).",
                "username": user.username,
                "school": user.school.slug,
                "verified": True,
            },
            status=status.HTTP_201_CREATED,
        )

    send_verification_email(user, request)
    return Response(
        {
            "detail": "Cuenta creada. Revisa tu correo escolar para verificarla.",
            "username": user.username,
            "school": user.school.slug,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email(request, uidb64, token):
    try:
        user = User.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
    except (User.DoesNotExist, ValueError, TypeError, OverflowError):
        return Response({"detail": "Enlace invalido."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response(
            {"detail": "Enlace invalido o expirado."}, status=status.HTTP_400_BAD_REQUEST
        )

    user.is_school_email_verified = True
    user.is_active = True
    user.save(update_fields=["is_school_email_verified", "is_active"])
    return Response({"detail": "Correo verificado. Ya puedes iniciar sesion."})
