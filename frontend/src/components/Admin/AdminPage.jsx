import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    loadUsers();
    loadRooms();
  }, []);

  async function loadUsers() {
    const res = await api.get("/admin/users");
    setUsers(res.data);
  }

  async function loadRooms() {
    const res = await api.get("/admin/rooms");
    setRooms(res.data);
  }

  async function deleteUser(uid) {
    if (!confirm("Na pewno usunąć użytkownika?")) return;
    await api.delete(`/admin/users/${uid}`);
    setUsers((prev) => prev.filter((u) => u.id !== uid));
  }

  async function toggleAdmin(uid) {
    const res = await api.post(`/admin/users/${uid}/toggle-admin`);
    setUsers((prev) => prev.map((u) => u.id === uid ? res.data : u));
  }

  async function deleteRoom(rid) {
    if (!confirm("Na pewno usunąć pokój?")) return;
    await api.delete(`/admin/rooms/${rid}`);
    setRooms((prev) => prev.filter((r) => r.id !== rid));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">Komunikator — Panel Admina</span>
        <div className="app-header-user">
          <span>Zalogowany jako <strong>{user?.username}</strong></span>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>← Czat</button>
          <button className="btn btn-ghost" onClick={logout}>Wyloguj</button>
        </div>
      </header>

      <div style={{ padding: "24px", flex: 1, overflow: "auto" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            className={`btn ${tab === "users" ? "btn-primary" : "btn-ghost"}`}
            style={{ width: "auto" }}
            onClick={() => setTab("users")}
          >
            Użytkownicy ({users.length})
          </button>
          <button
            className={`btn ${tab === "rooms" ? "btn-primary" : "btn-ghost"}`}
            style={{ width: "auto" }}
            onClick={() => setTab("rooms")}
          >
            Pokoje ({rooms.length})
          </button>
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Rola</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>
                    <span className={`role-badge ${u.is_admin ? "role-admin" : "role-user"}`}>
                      {u.is_admin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 8 }}>
                    {u.id !== user.id && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: "#ed8936", color: "#fff" }}
                          onClick={() => toggleAdmin(u.id)}
                        >
                          {u.is_admin ? "Odbierz admina" : "Nadaj admina"}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(u.id)}
                        >
                          Usuń
                        </button>
                      </>
                    )}
                    {u.id === user.id && <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>(to Ty)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Rooms tab */}
        {tab === "rooms" && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nazwa</th>
                <th>Właściciel</th>
                <th>Członkowie</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td># {r.name}</td>
                  <td>{r.created_by_username}</td>
                  <td>{r.member_count}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteRoom(r.id)}>
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
