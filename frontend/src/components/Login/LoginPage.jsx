import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Nieprawidłowy e-mail lub hasło.");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h2>Logowanie</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Hasło" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Zaloguj</button>
      </form>
      <p><Link to="/register">Zarejestruj się</Link></p>
    </div>
  );
}
