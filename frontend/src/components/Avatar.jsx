export default function Avatar({ user, size = 42 }) {
  const letra = (user?.full_name || user?.username || "?")[0].toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : letra}
    </span>
  );
}
