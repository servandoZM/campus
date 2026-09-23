import { useMemo, useState } from "react";
import Composer from "../components/Composer";
import Post from "../components/Post";
import Skeleton from "../components/Skeleton";
import usePagedPosts from "../usePagedPosts";

export default function Feed() {
  const [vista, setVista] = useState("escuela");

  // useMemo evita crear una cadena nueva en cada render, que haria que el
  // hook recargara el feed una y otra vez.
  const ruta = useMemo(
    () => (vista === "siguiendo" ? "/posts/?feed=1" : "/posts/"),
    [vista]
  );

  const { posts, error, hayMas, cargandoMas, cargarMas, agregar, quitar } =
    usePagedPosts(ruta);

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Inicio</h1>
        <div className="tabs" role="tablist">
          <button
            role="tab" aria-selected={vista === "escuela"}
            className={`tab ${vista === "escuela" ? "on" : ""}`}
            onClick={() => setVista("escuela")}
          >Tu escuela</button>
          <button
            role="tab" aria-selected={vista === "siguiendo"}
            className={`tab ${vista === "siguiendo" ? "on" : ""}`}
            onClick={() => setVista("siguiendo")}
          >Siguiendo</button>
        </div>
      </div>

      <Composer onCreated={agregar} />

      {error && <p className="error pad">{error}</p>}
      {posts === null && <Skeleton />}

      {posts?.length === 0 && (
        <div className="empty">
          <p className="empty-title">
            {vista === "siguiendo" ? "Tu feed está vacío" : "Nadie ha publicado todavía"}
          </p>
          <p className="muted">
            {vista === "siguiendo"
              ? "Sigue a otros estudiantes para ver lo que comparten."
              : "Sé el primero en publicar algo."}
          </p>
        </div>
      )}

      {posts?.map((p) => (
        <Post key={p.id} post={p} onDeleted={quitar} />
      ))}

      {hayMas && (
        <div className="load-more">
          <button className="btn-outline" onClick={cargarMas} disabled={cargandoMas}>
            {cargandoMas ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}
    </>
  );
}
