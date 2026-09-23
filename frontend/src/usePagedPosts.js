import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/**
 * Maneja una lista paginada de publicaciones.
 *
 * El backend ya no devuelve un array, devuelve:
 *   { count, next, previous, results: [...] }
 *
 * Este hook guarda esa complejidad en un solo lugar para que Feed y
 * Perfil no la repitan cada uno por su cuenta.
 *
 *   const { posts, cargando, error, hayMas, cargarMas, agregar, quitar }
 *     = usePagedPosts("/posts/?feed=1");
 */
export default function usePagedPosts(path) {
  const [posts, setPosts] = useState(null);   // null = primera carga
  const [next, setNext] = useState(null);     // url de la siguiente pagina
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState("");

  // El backend manda "next" como URL absoluta. Solo necesitamos lo que va
  // despues de /api para volver a pasarlo por nuestro cliente api().
  const soloRuta = (url) => (url ? url.slice(url.indexOf("/api/") + 4) : null);

  useEffect(() => {
    let cancelado = false;
    setPosts(null);
    setNext(null);
    setError("");

    api(path)
      .then((d) => {
        if (cancelado) return;
        setPosts(d?.results ?? []);
        setNext(soloRuta(d?.next));
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e.message);
        setPosts([]);
      });

    // Si el usuario cambia de pestaña antes de que llegue la respuesta,
    // esto evita pintar resultados viejos sobre la vista nueva.
    return () => { cancelado = true; };
  }, [path]);

  const cargarMas = useCallback(async () => {
    if (!next || cargandoMas) return;
    setCargandoMas(true);
    try {
      const d = await api(next);
      setPosts((prev) => [...(prev ?? []), ...(d?.results ?? [])]);
      setNext(soloRuta(d?.next));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargandoMas(false);
    }
  }, [next, cargandoMas]);

  const agregar = useCallback((post) => setPosts((prev) => [post, ...(prev ?? [])]), []);
  const quitar = useCallback(
    (id) => setPosts((prev) => (prev ?? []).filter((p) => p.id !== id)),
    []
  );

  return { posts, error, hayMas: Boolean(next), cargandoMas, cargarMas, agregar, quitar };
}
