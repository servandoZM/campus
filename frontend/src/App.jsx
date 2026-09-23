import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Layout from "./components/Layout";
import Communities from "./pages/Communities";
import Community from "./pages/Community";
import CommunityNew from "./pages/CommunityNew";
import Connections from "./pages/Connections";
import Explore from "./pages/Explore";
import Feed from "./pages/Feed";
import Login from "./pages/Login";
import Moderation from "./pages/Moderation";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

function Privado({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function NotificacionesRuta() {
  const { setUnread } = useAuth();
  return <Notifications onRead={() => setUnread(0)} />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/registro" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<Privado><Feed /></Privado>} />
      <Route path="/explorar" element={<Privado><Explore /></Privado>} />
      <Route path="/comunidades" element={<Privado><Communities /></Privado>} />
      <Route path="/comunidades/nueva" element={<Privado><CommunityNew /></Privado>} />
      <Route path="/c/:slug" element={<Privado><Community /></Privado>} />
      <Route path="/actividad" element={<Privado><NotificacionesRuta /></Privado>} />
      <Route path="/moderacion" element={<Privado><Moderation /></Privado>} />
      <Route path="/conexiones" element={<Privado><Connections /></Privado>} />
      <Route path="/perfil" element={<Privado><Profile /></Privado>} />
      <Route path="/u/:username" element={<Privado><Profile /></Privado>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
