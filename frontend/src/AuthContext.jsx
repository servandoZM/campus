import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearSession, getToken, saveSession } from "./api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    getToken()
      ? { username: localStorage.getItem("username"), school: localStorage.getItem("school") }
      : null
  );
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!getToken()) return;
    api("/notifications/unread/").then((d) => setUnread(d?.unread ?? 0)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setUnread(0); return; }
    api("/me/").then(setProfile).catch(() => {});
    refreshUnread();
  }, [user?.username]);

  async function login(username, password) {
    const data = await api("/auth/login/", { body: { username, password } });
    saveSession(data);
    setUser({ username: data.username, school: data.school });
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <Ctx.Provider
      value={{ user, profile, setProfile, login, logout, unread, setUnread, refreshUnread }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
