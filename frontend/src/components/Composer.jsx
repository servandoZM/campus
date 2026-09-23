import { useRef, useState } from "react";
import { api, uploadImage } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";
import { ImageIcon, X } from "./icons";

const MAX = 500;

/**
 *   <Composer onCreated={...} />                     publica en el inicio general
 *   <Composer community={c} onCreated={...} />       publica dentro de una comunidad
 */
export default function Composer({ onCreated, community = null }) {
  const { profile, user } = useAuth();
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState(null);      // { url, preview }
  const [subiendo, setSubiendo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  async function elegir(e) {
    const file = e.target.files?.[0];
    e.target.value = "";                            // permite reelegir el mismo archivo
    if (!file) return;
    setError("");
    setSubiendo(true);
    const preview = URL.createObjectURL(file);      // se ve al instante, sin esperar al servidor
    try {
      const url = await uploadImage(file);
      setImagen({ url, preview });
    } catch (err) {
      setError(err.message);
      URL.revokeObjectURL(preview);
    } finally {
      setSubiendo(false);
    }
  }

  function quitar() {
    if (imagen) URL.revokeObjectURL(imagen.preview);
    setImagen(null);
  }

  async function publicar(e) {
    e.preventDefault();
    if (!texto.trim() && !imagen) return;
    setEnviando(true);
    setError("");
    try {
      const post = await api("/posts/", {
        body: { content: texto, image_url: imagen?.url ?? null, community: community?.id ?? null },
      });
      setTexto("");
      quitar();
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
          placeholder={community ? `Comparte algo con ${community.name}` : "¿Qué está pasando?"}
          rows={2}
          aria-label="Escribe una publicación"
        />

        {imagen && (
          <div className="preview">
            <img src={imagen.preview} alt="" />
            <button type="button" className="preview-x" onClick={quitar} aria-label="Quitar imagen">
              <X />
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="composer-foot">
          <button
            type="button"
            className="act"
            onClick={() => fileRef.current.click()}
            disabled={subiendo || !!imagen}
            aria-label="Agregar imagen"
          >
            <ImageIcon /> {subiendo && "Subiendo…"}
          </button>
          <input
            ref={fileRef} type="file" accept="image/*"
            onChange={elegir} hidden
          />

          <span className="spacer" />
          {texto.length > 0 && (
            <span className={`count ${restante < 50 ? "warn" : ""}`}>{restante}</span>
          )}
          <button className="btn" disabled={enviando || subiendo || (!texto.trim() && !imagen)}>
            {enviando ? "Publicando…" : "Publicar"}
          </button>
        </div>
      </div>
    </form>
  );
}
