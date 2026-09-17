import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Avatar from "../components/Avatar";
import Skeleton from "../components/Skeleton";

const TEXTO = {
  like: "le dio me gusta a tu publicación",
  comment: "comentó tu publicación",
  follow: "empezó a seguirte",
};

function cuando(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 604800) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function Notifications({ onRead }) {
  const [lista, setLista] = useState(null);

  useEffect(() => {
    api("/notifications/")
      .then((d) => {
        setLista(d ?? []);
        if ((d ?? []).some((n) => !n.read)) {
          api("/notifications/read/", { body: {} }).then(() => onRead?.());
        }
      })
      .catch(() => setLista([]));
  }, []);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Actividad</h1>
      </div>

      {lista === null && <Skeleton rows={4} />}
      {lista?.length === 0 && (
        <div className="empty">
          <p className="empty-title">Nada por aquí todavía</p>
          <p className="muted">Los me gusta, comentarios y seguidores aparecerán aquí.</p>
        </div>
      )}

      {lista?.map((n) => (
        <article className={`notif ${n.read ? "" : "unread"}`} key={n.id}>
          <Link to={`/u/${n.actor_username}`}>
            <Avatar user={{ username: n.actor_username, full_name: n.actor_name, avatar_url: n.actor_avatar }} size={38} />
          </Link>
          <div className="notif-body">
            <p className="notif-text">
              <Link to={`/u/${n.actor_username}`} className="notif-actor">
                {n.actor_name || n.actor_username}
              </Link>{" "}
              {TEXTO[n.verb]}
              <span className="notif-time"> · {cuando(n.created_at)}</span>
            </p>
            {n.post_preview && <p className="notif-preview">{n.post_preview}</p>}
          </div>
          {!n.read && <span className="notif-dot" aria-label="Sin leer" />}
        </article>
      ))}
    </>
  );
}
