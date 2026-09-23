import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Skeleton from "../components/Skeleton";

// Lo que el moderador verá antes de aplicar cada acción.
const ACCIONES = {
  delete_post: {
    titulo: "¿Eliminar esta publicación?",
    detalle: "Desaparece del feed. El reporte queda registrado.",
    confirmar: "Eliminar",
    peligro: true,
  },
  disable_user: {
    titulo: "¿Desactivar esta cuenta?",
    detalle: "No podrá iniciar sesión. Sus publicaciones se conservan.",
    confirmar: "Desactivar",
    peligro: true,
  },
  dismiss: {
    titulo: "¿Descartar este reporte?",
    detalle: "No se toma ninguna medida contra el estudiante.",
    confirmar: "Descartar",
    peligro: false,
  },
};

const ESTADOS = [
  ["open", "Pendientes"],
  ["resolved", "Resueltos"],
  ["dismissed", "Descartados"],
];

export default function Moderation() {
  const [estado, setEstado] = useState("open");
  const [reportes, setReportes] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [pendiente, setPendiente] = useState(null);   // { id, action }
  const [aplicando, setAplicando] = useState(false);

  function cargar(e = estado) {
    setReportes(null);
    api(`/moderation/reports/?status=${e}`).then((d) => setReportes(d ?? []))
      .catch((err) => { setError(err.message); setReportes([]); });
    api("/moderation/summary/").then(setResumen).catch(() => {});
  }

  useEffect(() => { cargar(estado); }, [estado]);

  async function aplicar() {
    setAplicando(true);
    setError("");
    try {
      await api(`/moderation/reports/${pendiente.id}/resolve/`, {
        body: { action: pendiente.action },
      });
      setPendiente(null);
      cargar();
    } catch (err) {
      setError(err.message);
      setPendiente(null);
    } finally {
      setAplicando(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Moderación</h1>
        <div className="tabs" role="tablist">
          {ESTADOS.map(([v, label]) => (
            <button
              key={v} role="tab" aria-selected={estado === v}
              className={`tab ${estado === v ? "on" : ""}`}
              onClick={() => setEstado(v)}
            >{label}</button>
          ))}
        </div>
      </div>

      {resumen && (
        <div className="summary">
          {[
            ["Pendientes", resumen.open],
            ["Estudiantes", resumen.students],
            ["Desactivados", resumen.disabled],
            ["Publicaciones", resumen.posts],
          ].map(([l, n]) => (
            <div className="summary-item" key={l}>
              <div className="summary-n">{n}</div>
              <div className="summary-l">{l}</div>
            </div>
          ))}
        </div>
      )}

      {pendiente && (
        <ConfirmDialog
          {...ACCIONES[pendiente.action]}
          ocupado={aplicando}
          onConfirm={aplicar}
          onCancel={() => setPendiente(null)}
        />
      )}

      {error && <p className="error pad">{error}</p>}
      {reportes === null && <Skeleton rows={3} />}
      {reportes?.length === 0 && (
        <div className="empty">
          <p className="empty-title">Nada pendiente</p>
          <p className="muted">Los reportes de tu escuela aparecerán aquí.</p>
        </div>
      )}

      {reportes?.map((r) => (
        <article className="report" key={r.id}>
          <div className="report-head">
            <span className="report-reason">{r.reason_label}</span>
            <span className="muted">
              @{r.reporter_username} reportó a{" "}
              <Link to={`/u/${r.reported_username}`}>@{r.reported_username}</Link>
            </span>
          </div>

          {r.detail && <p className="report-detail">{r.detail}</p>}
          {r.post_preview && <p className="report-quote">{r.post_preview}</p>}

          {estado === "open" && (
            <div className="report-actions">
              {r.post && (
                <button className="btn-outline btn-sm" onClick={() => setPendiente({ id: r.id, action: "delete_post" })}>
                  Eliminar publicación
                </button>
              )}
              <button className="btn-outline btn-sm danger-outline"
                onClick={() => setPendiente({ id: r.id, action: "disable_user" })}>
                Desactivar cuenta
              </button>
              <button className="btn-outline btn-sm" onClick={() => setPendiente({ id: r.id, action: "dismiss" })}>
                Descartar
              </button>
            </div>
          )}
        </article>
      ))}
    </>
  );
}
