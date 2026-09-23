"""
Pruebas de comunidades: permisos, visibilidad y reglas de base de datos.

    python manage.py test communities
"""
from django.db import IntegrityError, transaction
from rest_framework.test import APITestCase

from moderation.models import Report
from posts.models import Post
from schools.models import School
from users.models import User

from .models import Community, Membership


class ComunidadesTest(APITestCase):
    def setUp(self):
        self.escuela = School.objects.create(name="UVY", email_domain="uvy.edu.mx", slug="uvy")
        self.otra = School.objects.create(name="Otra", email_domain="otra.edu.mx", slug="otra")

        def u(nombre, escuela=None, **extra):
            x = User.objects.create_user(nombre, f"{nombre}@x.mx", "Clave12345!",
                                         school=escuela or self.escuela, **extra)
            x.is_school_email_verified = True
            x.save()
            return x

        self.dueno = u("dueno")
        self.mod = u("mod")
        self.miembro = u("miembro")
        self.extrano = u("extrano")
        self.escuela_mod = u("escmod", role="admin")
        self.foraneo = u("foraneo", escuela=self.otra)

    def como(self, user):
        self.client.force_authenticate(user)
        return self.client

    def crear(self, nombre="Club de Robótica", privada=False):
        r = self.como(self.dueno).post("/api/communities/", {
            "name": nombre, "description": "Robots", "category": "club", "is_private": privada,
        }, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        return r.data["slug"]

    def poblar(self, slug):
        """Crea moderador y miembro activos."""
        c = Community.objects.get(slug=slug)
        Membership.objects.create(community=c, user=self.mod, role="moderator")
        Membership.objects.create(community=c, user=self.miembro)
        return c

    # ── creación ─────────────────────────────────────────────

    def test_crear_hace_dueno_y_genera_slug(self):
        slug = self.crear()
        self.assertEqual(slug, "club-de-robotica")
        m = Membership.objects.get(community__slug=slug, user=self.dueno)
        self.assertEqual((m.role, m.status), ("owner", "active"))
        # mismo nombre en la misma escuela -> slug distinto
        self.assertEqual(self.crear(), "club-de-robotica-2")

    def test_nombre_muy_corto(self):
        r = self.como(self.dueno).post("/api/communities/", {"name": "ab"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_otra_escuela_no_la_ve(self):
        slug = self.crear()
        self.assertEqual(self.como(self.foraneo).get(f"/api/communities/{slug}/").status_code, 404)
        self.assertEqual(self.como(self.foraneo).get("/api/communities/").data, [])

    # ── unirse ───────────────────────────────────────────────

    def test_publica_entra_directo(self):
        slug = self.crear()
        r = self.como(self.extrano).post(f"/api/communities/{slug}/join/")
        self.assertEqual((r.data["my_status"], r.data["member_count"]), ("active", 2))

    def test_privada_queda_pendiente_y_se_acepta(self):
        slug = self.crear(privada=True)
        self.poblar(slug)
        r = self.como(self.extrano).post(f"/api/communities/{slug}/join/")
        self.assertEqual(r.data["my_status"], "pending")
        self.assertIsNone(r.data["pending_count"])              # no administra: no ve el conteo
        # un miembro normal no puede aceptar
        self.assertEqual(self.como(self.miembro).patch(
            f"/api/communities/{slug}/members/extrano/", {"status": "active"}, format="json").status_code, 403)
        # un moderador sí
        self.assertEqual(self.como(self.mod).patch(
            f"/api/communities/{slug}/members/extrano/", {"status": "active"}, format="json").status_code, 200)
        self.assertEqual(Membership.objects.get(user=self.extrano).status, "active")

    def test_hacerla_publica_acepta_pendientes(self):
        slug = self.crear(privada=True)
        self.como(self.extrano).post(f"/api/communities/{slug}/join/")
        self.como(self.dueno).patch(f"/api/communities/{slug}/", {"is_private": False}, format="json")
        self.assertEqual(Membership.objects.get(user=self.extrano).status, "active")

    def test_dueno_no_puede_salir(self):
        slug = self.crear()
        self.assertEqual(self.como(self.dueno).post(f"/api/communities/{slug}/leave/").status_code, 400)

    # ── visibilidad de publicaciones ─────────────────────────

    def test_privada_invisible_para_no_miembros(self):
        slug = self.crear(privada=True)
        c = self.poblar(slug)
        p = Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="secreto")

        ext = self.como(self.extrano)
        self.assertEqual(ext.get(f"/api/posts/?community={slug}").data["count"], 0)
        self.assertEqual(ext.get(f"/api/posts/{p.id}/").status_code, 404)
        self.assertEqual(ext.post(f"/api/posts/{p.id}/like/").status_code, 404)
        self.assertEqual(ext.get(f"/api/posts/{p.id}/comments/").status_code, 404)
        self.assertEqual(ext.post(f"/api/posts/{p.id}/report/", {"reason": "spam"}, format="json").status_code, 404)
        self.assertEqual(ext.get("/api/posts/?author=miembro").data["count"], 0)
        self.assertEqual(ext.get(f"/api/communities/{slug}/members/").status_code, 403)
        # los miembros sí la ven
        self.assertEqual(self.como(self.mod).get(f"/api/posts/?community={slug}").data["count"], 1)
        # la moderación de la escuela también
        self.assertEqual(self.como(self.escuela_mod).get(f"/api/posts/{p.id}/").status_code, 200)

    def test_feed_solo_muestra_comunidades_propias(self):
        slug = self.crear()                                    # pública
        c = self.poblar(slug)
        Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="del club")
        Post.objects.create(author=self.miembro, school=self.escuela, content="general")

        textos = lambda r: [p["content"] for p in r.data["results"]]
        # no miembro: el feed solo trae lo general...
        self.assertEqual(textos(self.como(self.extrano).get("/api/posts/")), ["general"])
        # ...pero la comunidad pública sí se puede visitar y aparece en el perfil del autor
        self.assertEqual(textos(self.como(self.extrano).get(f"/api/posts/?community={slug}")), ["del club"])
        self.assertEqual(len(textos(self.como(self.extrano).get("/api/posts/?author=miembro"))), 2)
        # miembro: ambas en su feed
        self.assertEqual(sorted(textos(self.como(self.mod).get("/api/posts/"))), ["del club", "general"])

    # ── publicar ─────────────────────────────────────────────

    def test_solo_miembros_publican(self):
        slug = self.crear()
        c = self.poblar(slug)
        ok = self.como(self.miembro).post("/api/posts/", {"content": "hola", "community": c.id}, format="json")
        self.assertEqual((ok.status_code, ok.data["community_slug"]), (201, slug))
        no = self.como(self.extrano).post("/api/posts/", {"content": "hola", "community": c.id}, format="json")
        self.assertEqual(no.status_code, 403)
        # pendiente tampoco puede
        priv = self.crear("Privada", privada=True)
        cp = Community.objects.get(slug=priv)
        self.como(self.extrano).post(f"/api/communities/{priv}/join/")
        self.assertEqual(self.como(self.extrano).post(
            "/api/posts/", {"content": "x", "community": cp.id}, format="json").status_code, 403)

    def test_no_se_puede_mover_de_comunidad_al_editar(self):
        slug = self.crear()
        c = self.poblar(slug)
        p = Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="a")
        self.como(self.miembro).patch(f"/api/posts/{p.id}/", {"content": "b", "community": None}, format="json")
        p.refresh_from_db()
        self.assertEqual((p.content, p.community_id), ("b", c.id))

    # ── moderación dentro de la comunidad ───────────────────

    def test_quien_puede_borrar_publicaciones(self):
        slug = self.crear()
        c = self.poblar(slug)
        mk = lambda: Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="x")

        p = mk()
        r = self.como(self.mod).get(f"/api/posts/{p.id}/")
        self.assertTrue(r.data["can_delete"])
        self.assertFalse(self.como(self.extrano).get(f"/api/posts/{p.id}/").data["can_delete"])
        self.assertEqual(self.como(self.extrano).delete(f"/api/posts/{p.id}/").status_code, 403)
        self.assertEqual(self.como(self.mod).delete(f"/api/posts/{p.id}/").status_code, 204)
        self.assertEqual(self.como(self.dueno).delete(f"/api/posts/{mk().id}/").status_code, 204)
        self.assertEqual(self.como(self.escuela_mod).delete(f"/api/posts/{mk().id}/").status_code, 204)
        # un moderador de comunidad NO puede borrar publicaciones generales
        g = Post.objects.create(author=self.miembro, school=self.escuela, content="general")
        self.assertEqual(self.como(self.mod).delete(f"/api/posts/{g.id}/").status_code, 403)

    def test_jerarquia_de_expulsiones_y_roles(self):
        slug = self.crear()
        self.poblar(slug)
        # (como() reautentica el cliente compartido: se llama antes de cada petición)
        # moderador no nombra moderadores
        self.assertEqual(self.como(self.mod).patch(f"/api/communities/{slug}/members/miembro/", {"role": "moderator"}, format="json").status_code, 403)
        # dueño sí
        self.assertEqual(self.como(self.dueno).patch(f"/api/communities/{slug}/members/miembro/", {"role": "moderator"}, format="json").status_code, 200)
        # moderador no expulsa a otro moderador
        self.assertEqual(self.como(self.mod).delete(f"/api/communities/{slug}/members/miembro/").status_code, 403)
        # nadie toca al dueño, ni la escuela
        self.assertEqual(self.como(self.escuela_mod).delete(f"/api/communities/{slug}/members/dueno/").status_code, 403)
        # el dueño expulsa a un moderador
        self.assertEqual(self.como(self.dueno).delete(f"/api/communities/{slug}/members/miembro/").status_code, 204)

    def test_solo_dueno_o_escuela_eliminan(self):
        slug = self.crear()
        self.poblar(slug)
        self.assertEqual(self.como(self.mod).delete(f"/api/communities/{slug}/").status_code, 403)
        self.assertEqual(self.como(self.escuela_mod).delete(f"/api/communities/{slug}/").status_code, 204)

    def test_eliminar_comunidad_conserva_reportes(self):
        slug = self.crear()
        c = self.poblar(slug)
        p1 = Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="uno")
        p2 = Post.objects.create(author=self.miembro, school=self.escuela, community=c, content="dos")
        # el mismo estudiante reporta dos publicaciones del mismo autor y al autor mismo:
        # la conversión ingenua violaba el índice unique_report_user
        for p in (p1, p2):
            Report.objects.create(reporter=self.extrano, school=self.escuela, post=p, reason="spam")
        Report.objects.create(reporter=self.extrano, school=self.escuela, reported_user=self.miembro, reason="fake")
        Report.objects.create(reporter=self.mod, school=self.escuela, post=p1, reason="hate")

        self.assertEqual(self.como(self.dueno).delete(f"/api/communities/{slug}/").status_code, 204)
        self.assertFalse(Post.objects.filter(community_id=c.id).exists())
        # quedan: el reporte directo de extrano y el de mod convertido en reporte de usuario
        self.assertEqual(
            sorted(Report.objects.values_list("reporter__username", "reported_user__username", "post")),
            [("extrano", "miembro", None), ("mod", "miembro", None)],
        )

    # ── reglas de la base de datos ──────────────────────────

    def test_base_de_datos_impide_dos_duenos_y_staff_pendiente(self):
        slug = self.crear()
        c = Community.objects.get(slug=slug)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Membership.objects.create(community=c, user=self.mod, role="owner")
        with self.assertRaises(IntegrityError), transaction.atomic():
            Membership.objects.create(community=c, user=self.miembro, role="moderator", status="pending")
