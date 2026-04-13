import { useAuth } from "../../contexts/AuthContext";

// TODO: Iteracja 4 — implementacja okna czatu, listy kontaktów i pokojów
export default function ChatPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header style={{ padding: "12px 24px", background: "#fff", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between" }}>
        <strong>Komunikator</strong>
        <span>
          Zalogowany jako <strong>{user?.username}</strong>
          {" · "}
          <button onClick={logout}>Wyloguj</button>
        </span>
      </header>
      <main style={{ padding: 24 }}>
        <p>Czat będzie dostępny po implementacji w iteracji 4.</p>
      </main>
    </div>
  );
}
