import { useState } from "react";
import { api } from "../api";

export default function NewPost({ onCreated }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError("");
    try {
      const post = await api("/posts/", { body: { content } });
      setContent("");
      onCreated(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="newpost" onSubmit={submit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué está pasando en tu escuela?"
        maxLength={500}
        rows={3}
      />
      <div className="newpost-foot">
        <span className="count">{content.length}/500</span>
        {error && <span className="error">{error}</span>}
        <button className="btn" disabled={sending || !content.trim()}>
          {sending ? "Publicando…" : "Publicar"}
        </button>
      </div>
    </form>
  );
}
