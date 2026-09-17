import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";

export default function Rail() {
  const { user } = useAuth();
  const [gente, setGente] = useState([]);

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
