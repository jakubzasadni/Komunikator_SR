import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form.username, form.email, form.password);
      navigate("/login");
    } catch {
      setError("Rejestracja nie powiodła się.");
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: "10vh auto", padding: 24 }}>
      <h2>Rejestracja</h2>
      <form onSubmit={handleSubmit}>
        <input name="username" placeholder="Nazwa użytkownika" value={form.username} onChange={handleChange} required />
        <input name="email" placeholder="E-mail" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Hasło" value={form.password} onChange={handleChange} required />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Zarejestruj</button>
      </form>
      <p><Link to="/login">Masz już konto? Zaloguj się</Link></p>
    </div>
  );
}
