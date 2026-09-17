import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Skeleton from "../components/Skeleton";

export default function Explore() {
  const [q, setQ] = useState("");
  const [gente, setGente] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/users/?q=${encodeURIComponent(q)}`)
        .then((d) => setGente(d ?? []))
        .catch(() => setGente([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function seguir(username) {
    setGente((g) =>
      g.map((p) => (p.username === username ? { ...p, followed_by_me: !p.followed_by_me } : p))
    );
    try { await api(`/users/${username}/follow/`, { body: {} }); } catch {}
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Explorar</h1>
      </div>

      <div className="search-wrap">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca por nombre, usuario o carrera"
          aria-label="Buscar estudiantes"
        />
      </div>

      {gente === null && <Skeleton rows={4} />}
      {gente?.length === 0 && (
        <div className="empty">
          <p className="empty-title">Sin resultados</p>
          <p className="muted">Prueba con otro nombre o carrera.</p>
        </div>
      )}

      {gente?.map((p) => (
        <div className="person" key={p.username}>
          <Link to={`/u/${p.username}`}><Avatar user={p} /></Link>
          <div className="person-text">
            <Link to={`/u/${p.username}`} className="person-name">
              {p.full_name || p.username}
            </Link>
            <div className="person-meta">
              @{p.username}
              {p.major ? ` · ${p.major}` : ""}
              {p.semester ? ` · ${p.semester}°` : ""}
            </div>
          </div>
          <button
            className={`btn-outline btn-sm ${p.followed_by_me ? "following" : ""}`}
            onClick={() => seguir(p.username)}
          >
            {p.followed_by_me ? "Siguiendo" : "Seguir"}
          </button>
        </div>
      ))}
    </>
  );
}
