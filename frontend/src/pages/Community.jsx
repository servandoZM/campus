import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "../components/Avatar";
import CommunityForm from "../components/CommunityForm";
import CommunityMark from "../components/CommunityMark";
import Composer from "../components/Composer";
import ConfirmDialog from "../components/ConfirmDialog";
import Post from "../components/Post";
import Skeleton from "../components/Skeleton";
import { Lock } from "../components/icons";
import usePagedPosts from "../usePagedPosts";

// Avisa al rail lateral que la lista de "Tus comunidades" cambió.
export const avisarCambio = () => window.dispatchEvent(new Event("campus:communities"));

// ── Publicaciones ────────────────────────────────────────────────
function Publicaciones({ c }) {
  const { posts, error, hayMas, cargandoMas, cargarMas, agregar, quitar } =
    usePagedPosts(`/posts/?community=${c.slug}`);
  const miembro = c.my_status === "active";

  return (
    <>
      {miembro && <Composer community={c} onCreated={agregar} />}
      {error && <p className="error pad">{error}</p>}
      {posts === null && <Skeleton />}
      {posts?.length === 0 && (
        <div className="empty">
          <p className="empty-title">Nadie ha publicado aquí todavía</p>
          <p className="muted">
            {miembro ? "Rompe el hielo con la primera publicación." : "Únete para publicar en esta comunidad."}
          </p>
        </div>
      )}
      {posts?.map((p) => <Post key={p.id} post={p} onDeleted={quitar} enComunidad />)}
      {hayMas && (
        <div className="load-more">
          <button className="btn-outline" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}
    </>
  );
}

// ── Miembros y solicitudes ───────────────────────────────────────
function Miembros({ c, pendientes, onChange }) {
  const { user } = useAuth();
  const [gente, setGente] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(null);          // username en proceso
  const [porExpulsar, setPorExpulsar] = useState(null);  // miembro a expulsar

  // "can_delete" solo lo tienen el dueño y la moderación de la escuela:
  // son quienes pueden nombrar moderadores y expulsar moderadores.
  const soyDueno = c.can_delete;
  const ruta = `/communities/${c.slug}/members/${pendientes ? "?status=pending" : ""}`;

  useEffect(() => {
    setGente(null);
    setError("");
    api(ruta).then(setGente).catch((e) => { setError(e.message); setGente([]); });
  }, [ruta]);

  async function hacer(m, method, body) {
    setOcupado(m.username);
    setError("");
    try {
      const r = await api(`/communities/${c.slug}/members/${m.username}/`, { method, body });
      if (method === "DELETE" || pendientes) {
        setGente((g) => g.filter((x) => x.username !== m.username));
      } else {
        setGente((g) => g.map((x) => (x.username === m.username ? r : x)));
      }
      onChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
      setPorExpulsar(null);
    }
  }

  if (gente === null) return <Skeleton rows={3} />;

  return (
    <>
      {error && <p className="error pad">{error}</p>}
      {gente.length === 0 && (
        <div className="empty">
          <p className="empty-title">{pendientes ? "No hay solicitudes" : "Sin miembros"}</p>
          {pendientes && <p className="muted">Cuando alguien pida entrar, aparecerá aquí.</p>}
        </div>
      )}

      {gente.map((m) => {
        const yo = m.username === user.username;
        const puedoExpulsar = c.can_manage && !yo && m.role !== "owner" && (m.role === "member" || soyDueno);
        const puedoNombrar = soyDueno && !yo && m.role !== "owner" && !pendientes;
        const espera = ocupado === m.username;
        return (
          <div className="person" key={m.username}>
            <Link to={`/u/${m.username}`}><Avatar user={m} /></Link>
            <div className="person-text">
              <Link to={`/u/${m.username}`} className="person-name">{m.full_name || m.username}</Link>
              <div className="person-meta">
                @{m.username}
                {m.major ? ` · ${m.major}` : ""}
                {m.semester ? ` · ${m.semester}°` : ""}
              </div>
            </div>

            {pendientes ? (
              <div className="row-actions">
                <button className="btn btn-sm" disabled={espera}
                  onClick={() => hacer(m, "PATCH", { status: "active" })}>Aceptar</button>
                <button className="btn-outline btn-sm" disabled={espera}
                  onClick={() => hacer(m, "DELETE")}>Rechazar</button>
              </div>
            ) : (
              <div className="row-actions">
                {m.role !== "member" && <span className={`role-tag ${m.role}`}>{m.role_label}</span>}
                {puedoNombrar && (
                  <button className="btn-outline btn-sm" disabled={espera}
                    onClick={() => hacer(m, "PATCH", { role: m.role === "moderator" ? "member" : "moderator" })}>
                    {m.role === "moderator" ? "Quitar moderador" : "Hacer moderador"}
                  </button>
                )}
                {puedoExpulsar && (
                  <button className="btn-outline btn-sm danger-outline" disabled={espera}
                    onClick={() => setPorExpulsar(m)}>Expulsar</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {porExpulsar && (
        <ConfirmDialog
          titulo={`¿Expulsar a ${porExpulsar.full_name || porExpulsar.username}?`}
          detalle={c.is_private
            ? "Dejará de ver las publicaciones. Para volver tendrá que pedir acceso."
            : "Saldrá de la comunidad. Podrá volver a unirse cuando quiera."}
          confirmar="Expulsar"
          peligro
          ocupado={ocupado === porExpulsar.username}
          onConfirm={() => hacer(porExpulsar, "DELETE")}
          onCancel={() => setPorExpulsar(null)}
        />
      )}
    </>
  );
}

// ── Página ───────────────────────────────────────────────────────
export default function Community() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("posts");
  const [editando, setEditando] = useState(false);
  const [dialogo, setDialogo] = useState(null);     // "salir" | "eliminar"
  const [ocupado, setOcupado] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  function recargar() {
    return api(`/communities/${slug}/`).then(setC).catch((e) => setError(e.message));
  }

  useEffect(() => {
    setC(null); setError(""); setVista("posts"); setEditando(false);
    recargar();
  }, [slug]);

  async function accion(ruta) {
    setOcupado(true);
    setErrorAccion("");
    try {
      setC(await api(`/communities/${slug}/${ruta}/`, { body: {} }));
      avisarCambio();
      setDialogo(null);
    } catch (e) {
      setErrorAccion(e.message);
      setDialogo(null);
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    setOcupado(true);
    try {
      await api(`/communities/${slug}/`, { method: "DELETE" });
      avisarCambio();
      navigate("/comunidades", { replace: true });
    } catch (e) {
      setErrorAccion(e.message);
      setDialogo(null);
      setOcupado(false);
    }
  }

  if (error) {
    return (
      <div className="empty">
        <p className="empty-title">Esta comunidad no existe</p>
        <p className="muted">Puede que la hayan eliminado.</p>
        <Link to="/comunidades" className="btn-outline" style={{ display: "inline-block", marginTop: 14 }}>
          Ver comunidades
        </Link>
      </div>
    );
  }
  if (!c) return <Skeleton rows={2} />;

  const miembro = c.my_status === "active";
  const pendiente = c.my_status === "pending";

  let boton;
  if (c.my_role === "owner") boton = null;
  else if (miembro) boton = (
    <button className="btn-outline following" onClick={() => setDialogo("salir")}>Miembro</button>
  );
  else if (pendiente) boton = (
    <button className="btn-outline following" disabled={ocupado} onClick={() => accion("leave")}
      title="Cancelar solicitud">Solicitud enviada</button>
  );
  else boton = (
    <button className="btn" disabled={ocupado} onClick={() => accion("join")}>
      {c.is_private ? "Solicitar acceso" : "Unirme"}
    </button>
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{c.name}</h1>
      </div>

      {editando ? (
        <CommunityForm
          inicial={c}
          onSaved={(nueva) => { setC(nueva); setEditando(false); avisarCambio(); }}
          onCancel={() => setEditando(false)}
          extra={c.can_delete && (
            <button type="button" className="btn-outline danger-outline" onClick={() => setDialogo("eliminar")}>
              Eliminar
            </button>
          )}
        />
      ) : (
        <section className="identity">
          <div className="identity-top">
            <CommunityMark name={c.name} size={78} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="identity-name">{c.name}</h2>
              <p className="identity-handle">
                {c.category_label} · {c.is_private
                  ? <span className="privacy-label"><Lock /> Privada</span>
                  : "Pública"}
              </p>
            </div>
            {(boton || c.can_manage) && (
              <div className="identity-actions">
                {boton}
                {c.can_manage && (
                  <button className="btn-outline" onClick={() => setEditando(true)}>Editar</button>
                )}
              </div>
            )}
          </div>

          {c.description && <p className="identity-bio">{c.description}</p>}

          <div className="stats">
            <span>
              <span className="stat-n">{c.member_count}</span>
              <span className="stat-l">{c.member_count === 1 ? "miembro" : "miembros"}</span>
            </span>
            {c.my_role && c.my_role !== "member" && miembro && (
              <span className={`role-tag ${c.my_role}`}>
                {c.my_role === "owner" ? "Eres el dueño" : "Eres moderador"}
              </span>
            )}
          </div>
          {errorAccion && <p className="error" style={{ marginTop: 12 }}>{errorAccion}</p>}
        </section>
      )}

      {c.can_view ? (
        <>
          <div className="subtabs" role="tablist">
            {[
              ["posts", "Publicaciones"],
              ["miembros", "Miembros"],
              ...(c.can_manage && c.is_private ? [["solicitudes", "Solicitudes"]] : []),
            ].map(([v, l]) => (
              <button key={v} role="tab" aria-selected={vista === v}
                className={`tab ${vista === v ? "on" : ""}`} onClick={() => setVista(v)}>
                {l}
                {v === "solicitudes" && c.pending_count > 0 && (
                  <span className="tab-count">{c.pending_count}</span>
                )}
              </button>
            ))}
          </div>

          {vista === "posts" && <Publicaciones key={c.slug + c.my_status} c={c} />}
          {vista === "miembros" && <Miembros c={c} onChange={recargar} />}
          {vista === "solicitudes" && <Miembros c={c} pendientes onChange={recargar} />}
        </>
      ) : (
        <div className="locked">
          <span className="locked-icon"><Lock width={22} height={22} /></span>
          <p className="empty-title">Comunidad privada</p>
          <p className="muted">
            {pendiente
              ? "Tu solicitud está en revisión. Cuando te acepten verás las publicaciones."
              : "Solo sus miembros ven lo que se publica aquí. Pide acceso para unirte."}
          </p>
        </div>
      )}

      {dialogo === "salir" && (
        <ConfirmDialog
          titulo={`¿Salir de ${c.name}?`}
          detalle={c.is_private
            ? "Dejarás de ver sus publicaciones. Para volver tendrás que pedir acceso."
            : "Sus publicaciones dejarán de aparecer en tu inicio."}
          confirmar="Salir"
          peligro
          ocupado={ocupado}
          onConfirm={() => accion("leave")}
          onCancel={() => setDialogo(null)}
        />
      )}
      {dialogo === "eliminar" && (
        <ConfirmDialog
          titulo={`¿Eliminar ${c.name}?`}
          detalle="Se borrarán la comunidad y todas sus publicaciones. No se puede deshacer."
          confirmar="Eliminar"
          peligro
          ocupado={ocupado}
          onConfirm={eliminar}
          onCancel={() => setDialogo(null)}
        />
      )}
    </>
  );
}
