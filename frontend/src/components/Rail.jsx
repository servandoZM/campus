import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";
import CommunityMark from "./CommunityMark";

export default function Rail() {
  const { user } = useAuth();
  const [gente, setGente] = useState([]);
  const [comunidades, setComunidades] = useState([]);

  useEffect(() => {
    const cargar = () =>
      api("/communities/?mine=1")
        .then((d) => setComunidades((d ?? []).filter((c) => c.my_status === "active").slice(0, 5)))
        .catch(() => {});
    cargar();
    // Community.jsx avisa cuando te unes, sales, creas o eliminas una.
    window.addEventListener("campus:communities", cargar);
    return () => window.removeEventListener("campus:communities", cargar);
  }, []);

  useEffect(() => {
    api("/users/")
      .then((d) => setGente((d ?? []).filter((p) => !p.followed_by_me).slice(0, 4)))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="rail-block">
        <div className="school-line">{user.school || "Tu escuela"}</div>
        <div className="school-meta">Red privada de estudiantes</div>
      </div>

      <div className="rail-block">
        <h2 className="rail-title">Tus comunidades</h2>
        {comunidades.map((c) => (
          <Link key={c.id} to={`/c/${c.slug}`} className="sugg">
            <CommunityMark name={c.name} size={36} />
            <div className="sugg-text">
              <div className="sugg-name">{c.name}</div>
              <div className="sugg-meta">
                {c.member_count} {c.member_count === 1 ? "miembro" : "miembros"}
                {c.pending_count > 0 && ` · ${c.pending_count} por aprobar`}
              </div>
            </div>
          </Link>
        ))}
        <Link to="/comunidades" className="rail-more">
          {comunidades.length ? "Ver todas" : "Descubre las de tu escuela"}
        </Link>
      </div>

      {gente.length > 0 && (
        <div className="rail-block">
          <h2 className="rail-title">Estudiantes que no sigues</h2>
          {gente.map((p) => (
            <Link key={p.username} to={`/u/${p.username}`} className="sugg">
              <Avatar user={p} size={36} />
              <div className="sugg-text">
                <div className="sugg-name">{p.full_name || p.username}</div>
                <div className="sugg-meta">
                  {p.major || `@${p.username}`}
                  {p.semester ? ` · ${p.semester}°` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
