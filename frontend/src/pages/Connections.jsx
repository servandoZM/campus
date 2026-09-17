import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Skeleton from "../components/Skeleton";

export default function Connections() {
  const [tab, setTab] = useState("following");
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/connections/").then(setData).catch(() => setData({ following: [], followers: [] }));
  }, []);

  const lista = data?.[tab] ?? [];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Conexiones</h1>
        <div className="tabs" role="tablist">
          <button
            role="tab" aria-selected={tab === "following"}
            className={`tab ${tab === "following" ? "on" : ""}`}
            onClick={() => setTab("following")}
          >Sigues</button>
          <button
            role="tab" aria-selected={tab === "followers"}
            className={`tab ${tab === "followers" ? "on" : ""}`}
            onClick={() => setTab("followers")}
          >Te siguen</button>
        </div>
      </div>

      {data === null && <Skeleton rows={3} />}
      {data && lista.length === 0 && (
        <div className="empty">
          <p className="empty-title">
            {tab === "following" ? "No sigues a nadie todavía" : "Nadie te sigue todavía"}
          </p>
          <p className="muted">
            {tab === "following"
              ? "Busca estudiantes en Explorar."
              : "Publica algo y empieza a conectar."}
          </p>
        </div>
      )}

      {lista.map((p) => (
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
        </div>
      ))}
    </>
  );
}
