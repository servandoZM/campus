import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";
import { Bell, Compass, Home, Shield, User, Users } from "./icons";
import Rail from "./Rail";

const NAV = [
  { to: "/", label: "Inicio", Icon: Home, end: true },
  { to: "/explorar", label: "Explorar", Icon: Compass },
  { to: "/actividad", label: "Actividad", Icon: Bell, badge: true },
  { to: "/conexiones", label: "Conexiones", Icon: Users },
  { to: "/perfil", label: "Perfil", Icon: User },
];

// El tabbar de móvil deja fuera "Conexiones": 4 destinos caben cómodos, 5 no.
const NAV_MOVIL = NAV.filter((n) => n.to !== "/conexiones");
const MOD = { to: "/moderacion", label: "Moderación", Icon: Shield };

export default function Layout({ children }) {
  const { user, profile, logout, unread, refreshUnread } = useAuth();

  useEffect(() => {
    const t = setInterval(refreshUnread, 60000);
    return () => clearInterval(t);
  }, []);

  const item = ({ to, label, Icon, end, badge }, clase) => (
    <NavLink key={to} to={to} end={end} className={clase}>
      <span className="navicon">
        <Icon />
        {badge && unread > 0 && (
          <span className="badge" aria-label={`${unread} sin leer`}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Principal">
        <div className="brand">Campus<span className="brand-dot">.</span></div>
        <div className="navlist">
          {NAV.map((n) => item(n, "navlink"))}
          {profile?.role === "admin" && item(MOD, "navlink")}
        </div>
        <div className="sidebar-foot">
          <div className="whoami">
            <Avatar user={profile ?? user} size={36} />
            <div className="whoami-text">
              <div className="whoami-name">{profile?.full_name || user.username}</div>
              <div className="whoami-handle">@{user.username}</div>
            </div>
          </div>
          <button className="signout" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      <div className="center">
        <header className="mobile-top">
          <span className="mobile-brand">Campus<span className="brand-dot">.</span></span>
          <button className="signout" style={{ width: "auto" }} onClick={logout}>Salir</button>
        </header>
        {children}
      </div>

      <aside className="rail"><Rail /></aside>

      <nav className="tabbar" aria-label="Principal">
        {NAV_MOVIL.map((n) => item(n, "tabitem"))}
      </nav>
    </div>
  );
}
