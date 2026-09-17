export default function Skeleton({ rows = 3 }) {
  return (
    <div aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton" key={i}>
          <div className="sk" style={{ width: 42, height: 42, borderRadius: "50%" }} />
          <div style={{ flex: 1 }}>
            <div className="sk" style={{ width: "30%", height: 12, marginBottom: 10 }} />
            <div className="sk" style={{ width: "85%", height: 12, marginBottom: 7 }} />
            <div className="sk" style={{ width: "60%", height: 12 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
