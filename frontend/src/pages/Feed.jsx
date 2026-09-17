import { useEffect, useState } from "react";
import { api } from "../api";
import Composer from "../components/Composer";
import Post from "../components/Post";
import Skeleton from "../components/Skeleton";

export default function Feed() {
  const [vista, setVista] = useState("escuela");
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPosts(null);
    api(vista === "siguiendo" ? "/posts/?feed=1" : "/posts/")
      .then((d) => setPosts(d ?? []))
      .catch((e) => { setError(e.message); setPosts([]); });
  }, [vista]);

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

      <Composer onCreated={(p) => setPosts([p, ...(posts ?? [])])} />

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
        <Post key={p.id} post={p} onDeleted={(id) => setPosts(posts.filter((x) => x.id !== id))} />
      ))}
    </>
  );
}
