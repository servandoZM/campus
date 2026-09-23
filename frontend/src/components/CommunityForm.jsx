import { useState } from "react";
import { api } from "../api";

export const CATEGORIAS = [
  ["major", "Carrera"],
  ["course", "Materia"],
  ["club", "Club"],
  ["sports", "Deporte"],
  ["study", "Grupo de estudio"],
  ["interest", "Interés"],
  ["other", "Otro"],
];

/**
 * Formulario para crear o editar una comunidad.
 *   inicial = null        -> crear   (POST /communities/)
 *   inicial = comunidad   -> editar  (PATCH /communities/<slug>/)
 */
export default function CommunityForm({ inicial, onSaved, onCancel, extra }) {
  const [f, setF] = useState({
    name: inicial?.name ?? "",
    description: inicial?.description ?? "",
    category: inicial?.category ?? "interest",
    is_private: inicial?.is_private ?? false,
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const c = inicial
        ? await api(`/communities/${inicial.slug}/`, { method: "PATCH", body: f })
        : await api("/communities/", { body: f });
      onSaved(c);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="identity" onSubmit={guardar}>
      <label className="field">
        <span>Nombre</span>
        <input name="name" value={f.name} onChange={set} maxLength={60} required
          placeholder="Club de Robótica" autoFocus={!inicial} />
      </label>

      <label className="field">
        <span>Descripción</span>
        <textarea name="description" value={f.description} onChange={set} maxLength={280} rows={3}
          placeholder="¿De qué trata y quién debería unirse?" />
      </label>

      <label className="field">
        <span>Categoría</span>
        <select name="category" value={f.category} onChange={set}>
          {CATEGORIAS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      <fieldset className="field privacy">
        <span>Quién puede entrar</span>
        {[
          [false, "Pública", "Cualquiera de tu escuela se une y ve las publicaciones."],
          [true, "Privada", "Solo los miembros ven las publicaciones. Tú apruebas quién entra."],
        ].map(([v, t, d]) => (
          <label key={t} className={`privacy-opt ${f.is_private === v ? "on" : ""}`}>
            <input type="radio" name="is_private" checked={f.is_private === v}
              onChange={() => setF({ ...f, is_private: v })} />
            <span>
              <strong>{t}</strong>
              <small>{d}</small>
            </span>
          </label>
        ))}
        {inicial?.is_private && !f.is_private && (
          <small className="muted">Al hacerla pública se aceptan todas las solicitudes pendientes.</small>
        )}
      </fieldset>

      {error && <p className="error">{error}</p>}
      <div className="form-actions">
        <button className="btn" disabled={guardando || f.name.trim().length < 3}>
          {guardando ? "Guardando…" : inicial ? "Guardar" : "Crear comunidad"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>Cancelar</button>
        <span className="spacer" />
        {extra}
      </div>
    </form>
  );
}
