import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";

const MAX = 500;

export default function Composer({ onCreated }) {
  const { profile, user } = useAuth();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function publicar(e) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setError("");
    try {
      const post = await api("/posts/", { body: { content: texto } });
      setTexto("");
      onCreated(post);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const restante = MAX - texto.length;

  return (
    <form className="composer" onSubmit={publicar}>
      <Avatar user={profile ?? user} />
      <div className="composer-main">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value.slice(0, MAX))}
          placeholder="¿Qué está pasando?"
          rows={2}
          aria-label="Escribe una publicación"
        />
        {error && <p className="error">{error}</p>}
        <div className="composer-foot">
          <span className="spacer" />
          {texto.length > 0 && (
            <span className={`count ${restante < 50 ? "warn" : ""}`}>{restante}</span>
          )}
          <button className="btn" disabled={enviando || !texto.trim()}>
            {enviando ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </form>
  );
}
