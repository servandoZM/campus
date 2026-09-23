import uuid
from pathlib import Path

from django.conf import settings
from django.core.files.storage import default_storage
from PIL import Image, UnidentifiedImageError
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

FORMATOS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp", "GIF": ".gif"}
MAX_BYTES = 5 * 1024 * 1024        # 5 MB
MAX_LADO = 1600                    # px: redimensionamos lo que exceda


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_image(request):
    archivo = request.FILES.get("file")
    if not archivo:
        return Response({"detail": "No se envió ningún archivo."}, status=status.HTTP_400_BAD_REQUEST)

    if archivo.size > MAX_BYTES:
        return Response(
            {"detail": "La imagen no puede pesar más de 5 MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Pillow abre el archivo de verdad: si no es una imagen, falla aquí.
    # No confiamos en la extensión ni en el content-type que manda el cliente.
    try:
        img = Image.open(archivo)
        img.verify()
        archivo.seek(0)
        img = Image.open(archivo)
    except (UnidentifiedImageError, OSError):
        return Response({"detail": "El archivo no es una imagen válida."},
                        status=status.HTTP_400_BAD_REQUEST)

    if img.format not in FORMATOS:
        return Response(
            {"detail": "Formato no permitido. Usa JPG, PNG, WEBP o GIF."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    formato = img.format
    ext = FORMATOS[formato]

    # Reencodamos la imagen: esto elimina metadatos EXIF (incluida la
    # ubicación GPS del teléfono) y cualquier payload escondido en el archivo.
    if formato != "GIF":
        img = img.convert("RGBA" if formato == "PNG" else "RGB")
        img.thumbnail((MAX_LADO, MAX_LADO))

    nombre = f"{request.user.school.slug}/{uuid.uuid4().hex}{ext}"
    ruta = Path(settings.MEDIA_ROOT) / nombre
    ruta.parent.mkdir(parents=True, exist_ok=True)

    if formato == "GIF":
        archivo.seek(0)
        default_storage.save(nombre, archivo)
    else:
        img.save(ruta, format=formato, quality=85, optimize=True)

    url = request.build_absolute_uri(settings.MEDIA_URL + nombre)
    return Response({"url": url}, status=status.HTTP_201_CREATED)
