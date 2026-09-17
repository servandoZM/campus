import { useState } from "react";
import { api } from "../api";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
}

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);

  async function toggleLike() {
    // Optimista: actualiza la UI antes de que responda el servidor.
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
    try {
      const data = await api(`/posts/${post.id}/like/`, { body: {} });
      setLiked(data.liked);
      setLikes(data.likes_count);
    } catch {
      setLiked(liked);
      setLikes(likes);
    }
  }

  return (
    <article className="post">
      <div className="post-head">
        <span className="avatar">{post.author_username[0].toUpperCase()}</span>
        <span className="post-author">@{post.author_username}</span>
        <span className="post-time">{timeAgo(post.created_at)}</span>
      </div>
      <p className="post-body">{post.content}</p>
      {post.image_url && <img className="post-img" src={post.image_url} alt="" />}
      <div className="post-actions">
        <button
          className={liked ? "like liked" : "like"}
          onClick={toggleLike}
          aria-pressed={liked}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
        <span className="post-meta">{post.comments_count} comentarios</span>
      </div>
    </article>
  );
}
