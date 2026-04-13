import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

// Iteracja 4: pełna implementacja okna czatu, listy kontaktów i pokojów
export default function ChatPage() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">Komunikator</span>
        <div className="app-header-user">
          <span
            title={connected ? "Połączono" : "Rozłączono"}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#48bb78" : "#fc8181",
              display: "inline-block",
            }}
          />
          <span>
            Zalogowany jako <strong>{user?.username}</strong>
          </span>
          <button className="btn btn-ghost" onClick={logout}>
            Wyloguj
          </button>
        </div>
      </header>

      <div className="app-content">
        <p>Czat będzie dostępny w iteracji 4 🚧</p>
      </div>
    </div>
  );
}
