import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import CommunityMark from "../components/CommunityMark";
import Skeleton from "../components/Skeleton";
import { Lock, Plus } from "../components/icons";

// Texto del botón según la relación del usuario con la comunidad.
export function estadoBoton(c) {
  if (c.my_status === "active") return c.my_role === "member" ? "Miembro" : c.my_role === "owner" ? "Dueño" : "Moderador";
  if (c.my_status === "pending") return "Solicitud enviada";
  return c.is_private ? "Solicitar acceso" : "Unirme";
}

export function CommunityRow({ c, onJoin }) {
  const dentro = c.my_status !== null;
  return (
    <div className="community-row">
      <Link to={`/c/${c.slug}`}><CommunityMark name={c.name} /></Link>
      <div className="person-text">
        <Link to={`/c/${c.slug}`} className="person-name">
          {c.name}
          {c.is_private && <Lock className="inline-lock" aria-label="Privada" />}
        </Link>
        <div className="person-meta">
          {c.category_label} · {c.member_count} {c.member_count === 1 ? "miembro" : "miembros"}
          {c.pending_count > 0 && <span className="pending-pill">{c.pending_count} por aprobar</span>}
        </div>
        {c.description && <p className="community-desc">{c.description}</p>}
      </div>
      {dentro ? (
        <span className={`role-tag ${c.my_status === "pending" ? "pending" : c.my_role}`}>
          {estadoBoton(c)}
        </span>
      ) : (
        <button className="btn-outline btn-sm" onClick={() => onJoin(c)}>
          {estadoBoton(c)}
        </button>
      )}
    </div>
  );
}

export default function Communities() {
  const [vista, setVista] = useState("mias");
  const [q, setQ] = useState("");
  const [lista, setLista] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (vista === "mias") params.set("mine", "1");
      if (q.trim()) params.set("q", q.trim());
      api(`/communities/?${params}`)
        .then((d) => setLista(d ?? []))
        .catch((e) => { setError(e.message); setLista([]); });
    }, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [vista, q]);

  function cambiar(v) {
    if (v === vista) return;
    setLista(null);
    setVista(v);
  }

  async function unirme(c) {
    try {
      const nueva = await api(`/communities/${c.slug}/join/`, { body: {} });
      setLista((l) => l.map((x) => (x.id === nueva.id ? nueva : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="page-head-row">
          <h1 className="page-title">Comunidades</h1>
          <Link to="/comunidades/nueva" className="btn btn-sm btn-icon">
            <Plus /> Crear
          </Link>
        </div>
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={vista === "mias"}
            className={`tab ${vista === "mias" ? "on" : ""}`} onClick={() => cambiar("mias")}>
            Tus comunidades
          </button>
          <button role="tab" aria-selected={vista === "todas"}
            className={`tab ${vista === "todas" ? "on" : ""}`} onClick={() => cambiar("todas")}>
            Descubrir
          </button>
        </div>
      </div>

      <div className="search-wrap">
        <input
          className="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Busca clubes, materias, carreras…" aria-label="Buscar comunidades"
        />
      </div>

      {error && <p className="error pad">{error}</p>}
      {lista === null && <Skeleton rows={4} />}

      {lista?.length === 0 && (
        <div className="empty">
          {q ? (
            <>
              <p className="empty-title">Sin resultados</p>
              <p className="muted">Prueba con otra palabra, o crea la comunidad que falta.</p>
            </>
          ) : vista === "mias" ? (
            <>
              <p className="empty-title">Aún no estás en ninguna comunidad</p>
              <p className="muted">Únete a la de tu carrera o a un club, o crea una nueva.</p>
              <button className="btn-outline" style={{ marginTop: 14 }} onClick={() => cambiar("todas")}>
                Descubrir comunidades
              </button>
            </>
          ) : (
            <>
              <p className="empty-title">Tu escuela aún no tiene comunidades</p>
              <p className="muted">Crea la primera: un club, una materia o tu carrera.</p>
            </>
          )}
        </div>
      )}

      {lista?.map((c) => <CommunityRow key={c.id} c={c} onJoin={unirme} />)}
    </>
  );
}
