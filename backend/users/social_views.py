from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from notifications.models import Notification, notify
from posts.models import Follow

from .models import User


def perfil(u, request):
    return {
        "username": u.username,
        "full_name": u.full_name,
        "bio": u.bio,
        "avatar_url": u.avatar_url,
        "major": u.major,
        "semester": u.semester,
        "interests": u.interests or [],
        "role": u.role,
        "posts_count": u.posts.count(),
        "followers_count": u.followers.count(),
        "following_count": u.following.count(),
        "is_me": u == request.user,
        "followed_by_me": Follow.objects.filter(follower=request.user, following=u).exists(),
    }


@api_view(["POST"])
def toggle_follow(request, username):
    objetivo = User.objects.filter(username=username, school=request.user.school).first()
    if not objetivo:
        return Response({"detail": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)
    if objetivo == request.user:
        return Response(
            {"detail": "No puedes seguirte a ti mismo."}, status=status.HTTP_400_BAD_REQUEST
        )

    follow, creado = Follow.objects.get_or_create(follower=request.user, following=objetivo)
    if creado:
        notify(objetivo, request.user, Notification.Verb.FOLLOW)
    else:
        follow.delete()
    return Response({"following": creado, "followers_count": objetivo.followers.count()})


@api_view(["GET", "PATCH"])
def user_detail(request, username):
    u = User.objects.filter(username=username, school=request.user.school).first()
    if not u:
        return Response({"detail": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "PATCH":
        if u != request.user:
            return Response(
                {"detail": "Solo puedes editar tu propio perfil."},
                status=status.HTTP_403_FORBIDDEN,
            )
        for campo in ["full_name", "bio", "major", "avatar_url"]:
            if campo in request.data:
                setattr(u, campo, request.data[campo])
        if "semester" in request.data:
            u.semester = request.data["semester"] or None
        if "interests" in request.data:
            u.interests = [str(i)[:40] for i in request.data["interests"]][:10]
        u.save()

    return Response(perfil(u, request))


@api_view(["GET"])
def me(request):
    return Response(perfil(request.user, request))


@api_view(["GET"])
def search_users(request):
    q = request.query_params.get("q", "").strip()
    qs = User.objects.filter(school=request.user.school, is_active=True).exclude(
        id=request.user.id
    )
    if q:
        qs = qs.filter(
            Q(username__icontains=q) | Q(full_name__icontains=q) | Q(major__icontains=q)
        )
    siguiendo = set(
        Follow.objects.filter(follower=request.user).values_list("following_id", flat=True)
    )
    return Response(
        [
            {
                "username": u.username,
                "full_name": u.full_name,
                "major": u.major,
                "semester": u.semester,
                "avatar_url": u.avatar_url,
                "followed_by_me": u.id in siguiendo,
            }
            for u in qs[:30]
        ]
    )


@api_view(["GET"])
def connections(request):
    siguiendo = User.objects.filter(followers__follower=request.user)
    seguidores = User.objects.filter(following__following=request.user)

    def breve(u):
        return {
            "username": u.username,
            "full_name": u.full_name,
            "major": u.major,
            "semester": u.semester,
            "avatar_url": u.avatar_url,
        }

    return Response(
        {
            "following": [breve(u) for u in siguiendo],
            "followers": [breve(u) for u in seguidores],
        }
    )
