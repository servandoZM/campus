import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";
import ReportDialog from "./ReportDialog";
import { Bubble, Flag, Heart, Trash } from "./icons";

function cuando(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 604800) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function Post({ post, onDeleted }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [beat, setBeat] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState(null);
  const [nuevo, setNuevo] = useState("");
  const [total, setTotal] = useState(post.comments_count);
  const [reportando, setReportando] = useState(false);

  const autor = {
    username: post.author_username,
    full_name: post.author_username,
    avatar_url: post.author_avatar,
  };

  async function like() {
    const antesL = liked, antesN = likes;
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    if (!liked) { setBeat(true); setTimeout(() => setBeat(false), 300); }
    try {
      const d = await api(`/posts/${post.id}/like/`, { body: {} });
      setLiked(d.liked);
      setLikes(d.likes_count);
    } catch {
      setLiked(antesL);
      setLikes(antesN);
    }
  }

  async function abrir() {
    setAbierto(!abierto);
    if (!abierto && comentarios === null) {
      try { setComentarios(await api(`/posts/${post.id}/comments/`)); }
      catch { setComentarios([]); }
    }
  }

  async function comentar(e) {
    e.preventDefault();
    if (!nuevo.trim()) return;
    const c = await api(`/posts/${post.id}/comments/`, { body: { content: nuevo } });
    setComentarios([...(comentarios ?? []), c]);
    setTotal(total + 1);
    setNuevo("");
  }

  async function borrar() {
    if (!confirm("¿Borrar esta publicación?")) return;
    await api(`/posts/${post.id}/`, { method: "DELETE" });
    onDeleted?.(post.id);
  }

  return (
    <article className="post">
      <Link to={`/u/${post.author_username}`}><Avatar user={autor} /></Link>
      <div className="post-main">
        <div className="post-head">
          <Link to={`/u/${post.author_username}`} className="post-name">
            {post.author_username}
          </Link>
          <span className="post-time">· {cuando(post.created_at)}</span>
        </div>

        <p className="post-body">{post.content}</p>
        {post.image_url && <img className="post-img" src={post.image_url} alt="" />}

        <div className="post-actions">
          <button
            className={`act ${liked ? "on" : ""} ${beat ? "beat" : ""}`}
            onClick={like}
            aria-pressed={liked}
            aria-label={liked ? "Quitar me gusta" : "Me gusta"}
          >
            <Heart filled={liked} /> {likes > 0 && likes}
          </button>

          <button className="act" onClick={abrir} aria-expanded={abierto}>
            <Bubble /> {total > 0 && total}
          </button>

          {post.author_username === user.username ? (
            <button className="act danger" onClick={borrar} aria-label="Borrar publicación">
              <Trash />
            </button>
          ) : (
            <button
              className="act danger" onClick={() => setReportando(true)}
              aria-label="Reportar publicación"
            >
              <Flag />
            </button>
          )}
        </div>

        {reportando && (
          <ReportDialog
            endpoint={`/posts/${post.id}/report/`}
            titulo="Reportar publicación"
            onClose={() => setReportando(false)}
          />
        )}

        {abierto && (
          <div className="comments">
            {comentarios === null && <p className="muted">Cargando…</p>}
            {comentarios?.length === 0 && <p className="muted">Aún no hay comentarios.</p>}
            {comentarios?.map((c) => (
              <div className="comment" key={c.id}>
                <Avatar user={{ username: c.author_username }} size={28} />
                <div className="comment-body">
                  <Link to={`/u/${c.author_username}`} className="comment-author">
                    {c.author_username}
                  </Link>
                  <p className="comment-text">{c.content}</p>
                </div>
              </div>
            ))}
            <form className="comment-form" onSubmit={comentar}>
              <input
                value={nuevo}
                onChange={(e) => setNuevo(e.target.value)}
                placeholder="Escribe un comentario"
                maxLength={300}
                aria-label="Escribe un comentario"
              />
              <button className="btn btn-sm" disabled={!nuevo.trim()}>Enviar</button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
