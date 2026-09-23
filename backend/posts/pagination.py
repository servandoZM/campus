from rest_framework.pagination import PageNumberPagination


class CampusPagination(PageNumberPagination):
    """
    Pagina las listas largas (el feed, sobre todo).

    Sin esto, /api/posts/ devuelve TODAS las publicaciones de la escuela
    en una sola respuesta: con 5,000 posts eso es una respuesta enorme y
    una consulta lenta. Con paginacion el cliente pide de 15 en 15.

    La respuesta cambia de forma:
        antes:  [ {...}, {...} ]
        ahora:  { "count": 120, "next": "...?page=2", "previous": null,
                  "results": [ {...}, {...} ] }
    """

    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 50
