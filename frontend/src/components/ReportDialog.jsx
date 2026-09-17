import { useState } from "react";
import { api } from "../api";

const MOTIVOS = [
  ["spam", "Spam o publicidad"],
  ["harassment", "Acoso o insultos"],
  ["hate", "Discurso de odio"],
  ["sexual", "Contenido sexual"],
  ["violence", "Violencia"],
  ["fake", "Cuenta falsa o suplantación"],
  ["other", "Otro"],
];

export default function ReportDialog({ endpoint, titulo, onClose }) {
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEstado("enviando");
    try {
      const r = await api(endpoint, { body: { reason, detail } });
      setEstado(r?.detail ?? "Gracias. Lo revisaremos.");
    } catch (err) {
      setError(err.message);
      setEstado("");
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="dialog">
        {estado && estado !== "enviando" ? (
          <>
            <h2 className="dialog-title">{estado}</h2>
            <p className="muted">Un moderador de tu escuela lo revisará.</p>
            <div className="dialog-actions">
              <button className="btn" onClick={onClose}>Cerrar</button>
            </div>
          </>
        ) : (
          <form onSubmit={enviar}>
            <h2 className="dialog-title">{titulo}</h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Tu reporte es anónimo para la persona reportada.
            </p>

            <div className="reasons">
              {MOTIVOS.map(([v, label]) => (
                <label className="reason" key={v}>
                  <input
                    type="radio" name="reason" value={v}
                    checked={reason === v} onChange={() => setReason(v)}
                  />
                  {label}
                </label>
              ))}
            </div>

            <label className="field">
              <span>Detalle (opcional)</span>
              <input
                value={detail} onChange={(e) => setDetail(e.target.value)}
                maxLength={300} placeholder="¿Qué pasó?"
              />
            </label>

            {error && <p className="error">{error}</p>}
            <div className="dialog-actions">
              <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
              <button className="btn" disabled={!reason || estado === "enviando"}>
                {estado === "enviando" ? "Enviando…" : "Reportar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
