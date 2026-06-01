import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/Login/LoginPage";
import RegisterPage from "./components/Login/RegisterPage";
import ChatPage from "./components/Chat/ChatPage";
import AdminPage from "./components/Admin/AdminPage";

export default function App() {
  const { token, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/" element={token ? <ChatPage /> : <Navigate to="/login" />} />
      <Route path="/admin" element={token && user?.is_admin ? <AdminPage /> : <Navigate to="/" />} />
    </Routes>
  );
}
