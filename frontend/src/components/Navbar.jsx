import { useAuth } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="nav-inner">
        <span className="wordmark">
          CAMPUS<span className="wordmark-school">/{user.school}</span>
        </span>
        <div className="nav-right">
          <span className="nav-user">@{user.username}</span>
          <button className="btn-ghost" onClick={logout}>Salir</button>
        </div>
      </div>
    </header>
  );
}
