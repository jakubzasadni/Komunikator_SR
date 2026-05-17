import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingFrom, setTypingFrom] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Load contacts
  useEffect(() => {
    api.get("/users/").then((r) => setContacts(r.data.filter((u) => u.id !== user.id)));
  }, [user.id]);

  // Load history when active contact changes
  useEffect(() => {
    if (!activeContact) return;
    api.get(`/messages/${activeContact.id}`).then((r) => setMessages(r.data));
  }, [activeContact]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingFrom]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      if (
        msg.room_id === null &&
        (msg.sender_id === activeContact?.id || msg.recipient_id === activeContact?.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const onUserStatus = ({ user_id, online }) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === user_id ? { ...c, online } : c))
      );
    };

    const onTyping = ({ from_user_id }) => {
      if (from_user_id !== activeContact?.id) return;
      setTypingFrom(from_user_id);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingFrom(null), 2500);
    };

    socket.on("message", onMessage);
    socket.on("user_status", onUserStatus);
    socket.on("typing", onTyping);

    return () => {
      socket.off("message", onMessage);
      socket.off("user_status", onUserStatus);
      socket.off("typing", onTyping);
    };
  }, [socket, activeContact]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeContact || !socket) return;
    const optimistic = {
      id: Date.now(),
      sender_id: user.id,
      recipient_id: activeContact.id,
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    socket.emit("private_message", { to_user_id: activeContact.id, content: input.trim() });
    setInput("");
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    if (socket && activeContact) {
      socket.emit("typing", { to_user_id: activeContact.id });
    }
  }

  function selectContact(contact) {
    setActiveContact(contact);
    setMessages([]);
    setTypingFrom(null);
  }

  const activeContactName = activeContact?.username ?? null;
  const typingContactName =
    typingFrom != null
      ? contacts.find((c) => c.id === typingFrom)?.username
      : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-header-logo">Komunikator</span>
        <div className="app-header-user">
          <span
            title={connected ? "Połączono" : "Rozłączono"}
            className={`status-dot ${connected ? "online" : "offline"}`}
          />
          <span>
            Zalogowany jako <strong>{user?.username}</strong>
          </span>
          <button className="btn btn-ghost" onClick={logout}>
            Wyloguj
          </button>
        </div>
      </header>

      <div className="chat-layout">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-title">Kontakty</div>
          <ul className="contact-list">
            {contacts.map((c) => (
              <li
                key={c.id}
                className={`contact-item ${activeContact?.id === c.id ? "active" : ""}`}
                onClick={() => selectContact(c)}
              >
                <span className={`status-dot ${c.online ? "online" : "offline"}`} />
                <span className="contact-name">{c.username}</span>
              </li>
            ))}
            {contacts.length === 0 && (
              <li className="contact-empty">Brak innych użytkowników</li>
            )}
          </ul>
        </aside>

        {/* Chat area */}
        <main className="chat-main">
          {activeContact ? (
            <>
              <div className="chat-header">
                <span className={`status-dot ${activeContact.online ? "online" : "offline"}`} />
                <strong>{activeContactName}</strong>
                <span className="chat-header-status">
                  {activeContact.online ? "online" : "offline"}
                </span>
              </div>

              <div className="message-list">
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id ?? i} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                      <div className="message-bubble">
                        <span className="message-content">{msg.content}</span>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString("pl-PL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {typingContactName && (
                  <div className="typing-indicator">{typingContactName} pisze...</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-bar" onSubmit={sendMessage}>
                <input
                  className="chat-input"
                  placeholder={`Wiadomość do ${activeContactName}...`}
                  value={input}
                  onChange={handleInputChange}
                  autoFocus
                />
                <button className="btn btn-send" type="submit" disabled={!input.trim()}>
                  Wyślij
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty">
              Wybierz kontakt, aby rozpocząć rozmowę
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
