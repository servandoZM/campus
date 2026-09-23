import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "../components/Avatar";
import EditProfile from "../components/EditProfile";
import Post from "../components/Post";
import ReportDialog from "../components/ReportDialog";
import Skeleton from "../components/Skeleton";
import usePagedPosts from "../usePagedPosts";

export default function Profile() {
  const { username } = useParams();
  const { user, setProfile } = useAuth();
  const quien = username ?? user.username;

  const [p, setP] = useState(null);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState("");
  const [reportando, setReportando] = useState(false);

  const { posts, hayMas, cargandoMas, cargarMas, quitar } = usePagedPosts(
    `/posts/?author=${quien}`
  );

  useEffect(() => {
    setP(null); setEditando(false); setError("");
    api(`/users/${quien}/`).then(setP).catch((e) => setError(e.message));
  }, [quien]);

  async function seguir() {
    setP({
      ...p,
      followed_by_me: !p.followed_by_me,
      followers_count: p.followers_count + (p.followed_by_me ? -1 : 1),
    });
    try { await api(`/users/${quien}/follow/`, { body: {} }); }
    catch { setP(p); }
  }

  if (error) return <p className="error pad">{error}</p>;
  if (!p) return <Skeleton rows={2} />;

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">{p.full_name || p.username}</h1>
      </div>

      {editando ? (
        <EditProfile
          perfil={p}
          onCancel={() => setEditando(false)}
          onSaved={(nuevo) => { setP(nuevo); setProfile(nuevo); setEditando(false); }}
        />
      ) : (
        <section className="identity">
          <div className="identity-top">
            <Avatar user={p} size={78} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="identity-name">{p.full_name || p.username}</h2>
              <p className="identity-handle">@{p.username}</p>
            </div>
            {p.is_me ? (
              <div className="identity-actions">
                <button className="btn-outline" onClick={() => setEditando(true)}>
                  Editar perfil
                </button>
              </div>
            ) : (
              <div className="identity-actions">
                <button
                  className={`btn${p.followed_by_me ? "-outline following" : ""}`}
                  onClick={seguir}
                >
                  {p.followed_by_me ? "Siguiendo" : "Seguir"}
                </button>
                <button className="btn-outline" onClick={() => setReportando(true)}>
                  Reportar
                </button>
              </div>
            )}
          </div>

          {(p.major || p.semester) && (
            <p className="identity-academic">
              {p.major}
              {p.major && p.semester ? " · " : ""}
              {p.semester && (
                <>
                  <span className="identity-sem">{p.semester}°</span> semestre
                </>
              )}
            </p>
          )}

          {p.bio && <p className="identity-bio">{p.bio}</p>}

          {p.interests?.length > 0 && (
            <ul className="tags" aria-label="Intereses">
              {p.interests.map((i) => <li className="tag" key={i}>{i}</li>)}
            </ul>
          )}

          <div className="stats">
            <span><span className="stat-n">{p.posts_count}</span><span className="stat-l">publicaciones</span></span>
            <span><span className="stat-n">{p.followers_count}</span><span className="stat-l">seguidores</span></span>
            <span><span className="stat-n">{p.following_count}</span><span className="stat-l">siguiendo</span></span>
          </div>
        </section>
      )}

      {reportando && (
        <ReportDialog
          endpoint={`/users/${quien}/report/`}
          titulo={`Reportar a @${quien}`}
          onClose={() => setReportando(false)}
        />
      )}

      {posts === null && <Skeleton rows={2} />}
      {posts?.length === 0 && (
        <div className="empty">
          <p className="empty-title">Sin publicaciones</p>
          <p className="muted">
            {p.is_me ? "Lo que publiques aparecerá aquí." : `${p.username} aún no publica nada.`}
          </p>
        </div>
      )}
      {posts?.map((post) => (
        <Post key={post.id} post={post} onDeleted={quitar} />
      ))}

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
