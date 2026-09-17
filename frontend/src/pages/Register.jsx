import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Register() {
  const [f, setF] = useState({ username: "", email: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await api("/auth/register/", { body: f });
      setListo(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <main className="auth-page">
        <div className="auth-card">
          <h1 className="auth-brand">Campus<span className="brand-dot">.</span></h1>
          <p className="auth-lede">Revisa tu correo.</p>
          <div className="auth-note">
            <p style={{ margin: 0 }}>
              Enviamos un enlace a <strong>{f.email}</strong>. Ábrelo para activar tu cuenta.
            </p>
          </div>
          <p className="auth-alt"><Link to="/login">Ir a entrar</Link></p>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">Campus<span className="brand-dot">.</span></h1>
        <p className="auth-lede">Tu correo escolar te conecta con tu escuela.</p>

        <form onSubmit={crear}>
          <label className="field">
            <span>Usuario</span>
            <input name="username" value={f.username} onChange={set} autoFocus autoComplete="username" />
          </label>
          <label className="field">
            <span>Correo escolar</span>
            <input name="email" type="email" value={f.email} onChange={set}
              placeholder="tu@escuela.edu.mx" autoComplete="email" />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input name="password" type="password" value={f.password} onChange={set} autoComplete="new-password" />
          </label>
          <label className="field">
            <span>Repite la contraseña</span>
            <input name="password2" type="password" value={f.password2} onChange={set} autoComplete="new-password" />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ width: "100%" }} disabled={enviando}>
            {enviando ? "Creando…" : "Crear cuenta"}
          </button>
        </form>

        <p className="auth-alt">¿Ya tienes cuenta? <Link to="/login">Entrar</Link></p>
      </div>
    </main>
  );
}
