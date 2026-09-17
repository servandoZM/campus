import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(f.username, f.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">Campus<span className="brand-dot">.</span></h1>
        <p className="auth-lede">La red privada de tu escuela.</p>

        <form onSubmit={entrar}>
          <label className="field">
            <span>Usuario</span>
            <input name="username" value={f.username} onChange={set} autoFocus autoComplete="username" />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input name="password" type="password" value={f.password} onChange={set} autoComplete="current-password" />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" style={{ width: "100%" }} disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="auth-alt">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </main>
  );
}
