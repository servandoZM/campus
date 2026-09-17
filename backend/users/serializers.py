from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from schools.models import School

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo.")

        # El dominio del correo decide a que escuela pertenece el usuario.
        domain = email.split("@")[-1]
        try:
            self.school = School.objects.get(email_domain__iexact=domain, is_active=True)
        except School.DoesNotExist:
            if settings.ALLOW_ANY_EMAIL_DOMAIN:
                self.school = School.objects.filter(is_active=True).first()
                if not self.school:
                    raise serializers.ValidationError("No hay ninguna escuela registrada.")
            else:
                raise serializers.ValidationError(
                    f"El dominio '{domain}' no pertenece a ninguna escuela registrada."
                )
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data, school=self.school, role=User.Role.STUDENT)
        user.set_password(password)
        user.is_active = False
        user.save()
        return user


class CampusTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_school_email_verified and not self.user.is_staff:
            raise serializers.ValidationError(
                "Debes verificar tu correo escolar antes de iniciar sesion."
            )
        data["username"] = self.user.username
        data["school"] = self.user.school.slug if self.user.school else None
        return data
