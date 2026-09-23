import { useEffect, useRef } from "react";

/**
 * Reemplaza window.confirm(), que abre un cuadro gris del navegador y
 * rompe por completo el diseño de Campus en medio de una demo.
 *
 *   <ConfirmDialog
 *     titulo="¿Borrar esta publicación?"
 *     detalle="No se puede deshacer."
 *     confirmar="Borrar"
 *     peligro
 *     onConfirm={...}
 *     onCancel={...}
 *   />
 */
export default function ConfirmDialog({
  titulo,
  detalle,
  confirmar = "Confirmar",
  cancelar = "Cancelar",
  peligro = false,
  ocupado = false,
  onConfirm,
  onCancel,
}) {
  const botonRef = useRef(null);

  useEffect(() => {
    botonRef.current?.focus();
    const alTeclear = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCancel]);

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-titulo"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="dialog dialog-sm">
        <h2 className="dialog-title" id="confirm-titulo">{titulo}</h2>
        {detalle && <p className="muted" style={{ margin: "6px 0 0" }}>{detalle}</p>}

        <div className="dialog-actions">
          <button type="button" className="btn-outline" onClick={onCancel} disabled={ocupado}>
            {cancelar}
          </button>
          <button
            ref={botonRef}
            type="button"
            className={peligro ? "btn btn-danger" : "btn"}
            onClick={onConfirm}
            disabled={ocupado}
          >
            {ocupado ? "Un momento…" : confirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
