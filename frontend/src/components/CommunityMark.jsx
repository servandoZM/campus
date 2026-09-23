// Las comunidades se representan con un cuadro de esquinas suaves y la
// inicial en violeta; las personas, con un círculo gris. Así se distinguen
// de un vistazo en listas mixtas.
export default function CommunityMark({ name, size = 44 }) {
  return (
    <span
      className="cmark"
      style={{ width: size, height: size, fontSize: size * 0.44, borderRadius: size * 0.22 }}
      aria-hidden="true"
    >
      {(name || "?").trim()[0].toUpperCase()}
    </span>
  );
}
