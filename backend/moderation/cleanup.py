from django.utils import timezone

from .models import Report


def detach_reports(posts, reviewer=None):
    """
    Antes de borrar publicaciones, convierte sus reportes en reportes sobre
    el autor, para que el historial de moderación sobreviva al borrado.

    Si quien reportó ya había reportado también al autor directamente, el
    reporte de la publicación se borra en lugar de convertirse: la base de
    datos solo admite un reporte por persona reportada y por quien reporta
    (índice unique_report_user). Sin esta revisión, borrar la publicación
    fallaba con un IntegrityError.
    """
    now = timezone.now()
    for r in Report.objects.filter(post__in=posts).select_related("post"):
        autor_id = r.post.author_id
        ya_existe = Report.objects.filter(
            reporter_id=r.reporter_id, reported_user_id=autor_id
        ).exists()
        if ya_existe:
            r.delete()
            continue
        r.post = None
        r.reported_user_id = autor_id
        if reviewer is not None:
            r.status = Report.Status.RESOLVED
            r.reviewed_at = now
            r.reviewed_by = reviewer
        r.save()
