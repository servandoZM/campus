import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";
import ConfirmDialog from "./ConfirmDialog";
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

export default function Post({ post, onDeleted, enComunidad = false }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [beat, setBeat] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [comentarios, setComentarios] = useState(null);
  const [nuevo, setNuevo] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [errorComentario, setErrorComentario] = useState("");
  const [total, setTotal] = useState(post.comments_count);
  const [reportando, setReportando] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [porBorrar, setPorBorrar] = useState(null);   // "post" | id de comentario
  const [borrando, setBorrando] = useState(false);

  const esMio = post.author_username === user.username;
  // El backend decide quién puede borrar: el autor, la moderación de la
  // escuela, o el dueño/moderadores de la comunidad donde vive el post.
  const puedoBorrarPost = post.can_delete ?? esMio;

  const autor = {
    username: post.author_username,
    full_name: post.author_name,
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
    if (!nuevo.trim() || enviandoComentario) return;
    setEnviandoComentario(true);
    setErrorComentario("");
    try {
      const c = await api(`/posts/${post.id}/comments/`, { body: { content: nuevo } });
      setComentarios([...(comentarios ?? []), c]);
      setTotal(total + 1);
      setNuevo("");
    } catch (err) {
      setErrorComentario(err.message);
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function confirmarBorrado() {
    setBorrando(true);
    try {
      if (porBorrar === "post") {
        await api(`/posts/${post.id}/`, { method: "DELETE" });
        onDeleted?.(post.id);
      } else {
        await api(`/posts/${post.id}/comments/${porBorrar}/`, { method: "DELETE" });
        setComentarios((prev) => (prev ?? []).filter((c) => c.id !== porBorrar));
        setTotal((t) => Math.max(0, t - 1));
      }
      setPorBorrar(null);
    } catch (err) {
      setErrorComentario(err.message);
      setPorBorrar(null);
    } finally {
      setBorrando(false);
    }
  }

  return (
    <article className="post">
      <Link to={`/u/${post.author_username}`}><Avatar user={autor} /></Link>
      <div className="post-main">
        <div className="post-head">
          <Link to={`/u/${post.author_username}`} className="post-name">
            {post.author_name || post.author_username}
          </Link>
          <span className="post-handle">@{post.author_username}</span>
          {post.author_semester && (
            <span className="post-sem">{post.author_semester}°</span>
          )}
          <span className="post-time">· {cuando(post.created_at)}</span>
        </div>
        {post.community_slug && !enComunidad && (
          <Link to={`/c/${post.community_slug}`} className="post-community">
            en <strong>{post.community_name}</strong>
          </Link>
        )}

        <p className="post-body">{post.content}</p>
        {post.image_url && (
          <img
            className="post-img" src={post.image_url} alt=""
            onClick={() => setZoom(true)}
          />
        )}

        {zoom && (
          <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-modal="true">
            <img src={post.image_url} alt="" />
          </div>
        )}

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

          {puedoBorrarPost && (
            <button
              className="act danger" onClick={() => setPorBorrar("post")}
              aria-label="Borrar publicación"
            >
              <Trash />
            </button>
          )}
          {!esMio && (
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

        {porBorrar !== null && (
          <ConfirmDialog
            titulo={porBorrar === "post" ? "¿Borrar esta publicación?" : "¿Borrar este comentario?"}
            detalle="No se puede deshacer."
            confirmar="Borrar"
            peligro
            ocupado={borrando}
            onConfirm={confirmarBorrado}
            onCancel={() => setPorBorrar(null)}
          />
        )}

        {abierto && (
          <div className="comments">
            {comentarios === null && <p className="muted">Cargando…</p>}
            {comentarios?.length === 0 && <p className="muted">Aún no hay comentarios.</p>}

            {comentarios?.map((c) => {
              // Puedes borrar tu propio comentario, o cualquiera que esté en
              // una publicación que puedes borrar (la tuya, o una que moderas).
              const puedoBorrar = c.author_username === user.username || puedoBorrarPost;
              return (
                <div className="comment" key={c.id}>
                  <Avatar
                    user={{
                      username: c.author_username,
                      full_name: c.author_name,
                      avatar_url: c.author_avatar,
                    }}
                    size={28}
                  />
                  <div className="comment-body">
                    <Link to={`/u/${c.author_username}`} className="comment-author">
                      {c.author_name || c.author_username}
                    </Link>
                    <p className="comment-text">{c.content}</p>
                  </div>
                  {puedoBorrar && (
                    <button
                      className="comment-x"
                      onClick={() => setPorBorrar(c.id)}
                      aria-label={`Borrar el comentario de ${c.author_username}`}
                    >
                      <Trash />
                    </button>
                  )}
                </div>
              );
            })}

            {errorComentario && <p className="error">{errorComentario}</p>}

            <form className="comment-form" onSubmit={comentar}>
              <input
                value={nuevo}
                onChange={(e) => setNuevo(e.target.value)}
                placeholder="Escribe un comentario"
                maxLength={300}
                aria-label="Escribe un comentario"
              />
              <button className="btn btn-sm" disabled={!nuevo.trim() || enviandoComentario}>
                {enviandoComentario ? "…" : "Enviar"}
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
