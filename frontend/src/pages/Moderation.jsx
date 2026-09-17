import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Skeleton from "../components/Skeleton";

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

  function cargar(e = estado) {
    setReportes(null);
    api(`/moderation/reports/?status=${e}`).then((d) => setReportes(d ?? []))
      .catch((err) => { setError(err.message); setReportes([]); });
    api("/moderation/summary/").then(setResumen).catch(() => {});
  }

  useEffect(() => { cargar(estado); }, [estado]);

  async function resolver(id, action) {
    const textos = {
      delete_post: "¿Eliminar esta publicación?",
      disable_user: "¿Desactivar esta cuenta? No podrá iniciar sesión.",
      dismiss: "¿Descartar este reporte?",
    };
    if (!confirm(textos[action])) return;
    await api(`/moderation/reports/${id}/resolve/`, { body: { action } });
    cargar();
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
                <button className="btn-outline btn-sm" onClick={() => resolver(r.id, "delete_post")}>
                  Eliminar publicación
                </button>
              )}
              <button className="btn-outline btn-sm danger-outline"
                onClick={() => resolver(r.id, "disable_user")}>
                Desactivar cuenta
              </button>
              <button className="btn-outline btn-sm" onClick={() => resolver(r.id, "dismiss")}>
                Descartar
              </button>
            </div>
          )}
        </article>
      ))}
    </>
  );
}
