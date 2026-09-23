"""
Django settings for the CAMPUS project.
"""

from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# --- Core ---------------------------------------------------------------

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-change-me-in-.env")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# --- Apps -----------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",

    # CAMPUS apps
    "schools",
    "users",
    "posts",
    "notifications",
    "moderation",
    "uploads",
    "communities",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # must sit above CommonMiddleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "campus.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "campus.wsgi.application"

# --- Custom user model ------------------------------------------------------
# Must be set before the first migration ever runs against this database.
AUTH_USER_MODEL = "users.User"

# --- Database ---------------------------------------------------------------
# Points at MySQL via env vars. Locally this can be the same MySQL instance
# XAMPP already runs on your machine — just create a "campus" database in it
# and match the credentials in .env.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", "campus"),
        "USER": os.getenv("DB_USER", "campus_user"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}

# --- Password validation ------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- REST Framework + JWT -------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        # Permite iniciar sesion en la API navegable del browser.
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    # Solo afecta a las vistas de lista de DRF (el feed). Las vistas
    # escritas con @api_view devuelven su lista completa como antes.
    "DEFAULT_PAGINATION_CLASS": "posts.pagination.CampusPagination",
    "PAGE_SIZE": 15,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
}

# --- CORS -------------------------------------------------------------------
# Allows the React dev server (Vite's default port) to call this API locally.

CORS_ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

# --- I18N / TZ ----------------------------------------------------------
# Set to Sonora's timezone (no DST) since that's where the first real users
# will be. Change this once CAMPUS expands beyond one region.

LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Hermosillo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

# Archivos subidos por los usuarios. En local se guardan en backend/media/.
# Al desplegar se cambia por almacenamiento de objetos (Cloudflare R2/S3)
# sin tocar nada del codigo que sube imagenes.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Email (console backend for local dev; swap for real SMTP later) -----

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Solo para pruebas: permite registrarse con cualquier correo (gmail, etc).
# En produccion debe quedar en False para exigir correo escolar.
ALLOW_ANY_EMAIL_DOMAIN = os.getenv("ALLOW_ANY_EMAIL_DOMAIN", "False") == "True"

# Solo para pruebas: activa la cuenta al instante, sin correo de verificacion.
SKIP_EMAIL_VERIFICATION = os.getenv("SKIP_EMAIL_VERIFICATION", "False") == "True"
