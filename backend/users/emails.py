from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode


def send_verification_email(user, request):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = request.build_absolute_uri(f"/api/auth/verify/{uid}/{token}/")

    send_mail(
        subject="Verifica tu cuenta de CAMPUS",
        message=(
            f"Hola {user.username},\n\n"
            f"Confirma tu correo escolar aqui:\n{link}\n\n"
            "Si no creaste esta cuenta, ignora este mensaje."
        ),
        from_email=None,
        recipient_list=[user.email],
    )
