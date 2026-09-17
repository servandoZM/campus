import { useState } from "react";
import { api } from "../api";

export default function EditProfile({ perfil, onSaved, onCancel }) {
  const [f, setF] = useState({
    full_name: perfil.full_name ?? "",
    major: perfil.major ?? "",
    semester: perfil.semester ?? "",
    bio: perfil.bio ?? "",
    avatar_url: perfil.avatar_url ?? "",
    interests: (perfil.interests ?? []).join(", "),
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError("");
    try {
      const nuevo = await api(`/users/${perfil.username}/`, {
        method: "PATCH",
        body: {
          ...f,
          semester: f.semester === "" ? null : Number(f.semester),
          interests: f.interests.split(",").map((s) => s.trim()).filter(Boolean),
        },
      });
      onSaved(nuevo);
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
        <input name="full_name" value={f.full_name} onChange={set} maxLength={120} />
      </label>
      <label className="field">
        <span>Carrera</span>
        <input name="major" value={f.major} onChange={set} maxLength={120}
          placeholder="Ingeniería en Software" />
      </label>
      <label className="field">
        <span>Semestre</span>
        <input name="semester" type="number" min="1" max="20"
          value={f.semester} onChange={set} />
      </label>
      <label className="field">
        <span>Bio</span>
        <input name="bio" value={f.bio} onChange={set} maxLength={280}
          placeholder="Construyendo cosas. Aprendiendo en público." />
      </label>
      <label className="field">
        <span>Intereses</span>
        <input name="interests" value={f.interests} onChange={set}
          placeholder="Python, Robótica, Softbol" />
      </label>
      <label className="field">
        <span>Foto (URL)</span>
        <input name="avatar_url" value={f.avatar_url} onChange={set}
          placeholder="https://…" />
      </label>

      {error && <p className="error">{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button className="btn" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn-outline" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
