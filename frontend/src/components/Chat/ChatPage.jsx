import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import api from "../../services/api";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();

  const [contacts, setContacts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingFrom, setTypingFrom] = useState(null);
  const [unread, setUnread] = useState({});
  const [newRoomName, setNewRoomName] = useState("");
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const activeChatRef = useRef(null);

  // Update document title with total unread count
  useEffect(() => {
    const total = Object.values(unread).reduce((s, v) => s + v, 0);
    document.title = total > 0 ? `(${total}) Komunikator` : "Komunikator";
  }, [unread]);

  function addToast(text) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  // Keep ref in sync with state to avoid stale closures in socket handlers
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // Load contacts
  useEffect(() => {
    api.get("/users/").then((r) => setContacts(r.data.filter((u) => u.id !== user.id)));
  }, [user.id]);

  // Load rooms I belong to
  useEffect(() => {
    api.get("/rooms/").then((r) => setRooms(r.data));
  }, [user.id]);

  // Load history when active chat changes
  useEffect(() => {
    if (!activeChat) return;
    setMessages([]);
    setTypingFrom(null);
    if (activeChat.type === "contact") {
      api.get(`/messages/${activeChat.data.id}`).then((r) => setMessages(r.data));
    } else {
      api.get(`/rooms/${activeChat.data.id}/messages`).then((r) => setMessages(r.data));
    }
  }, [activeChat]);

  // Scroll to bottom on new messages or typing indicator change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingFrom]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      const current = activeChatRef.current;
      const isActive =
        current?.type === "contact" &&
        (msg.sender_id === current.data.id || msg.recipient_id === current.data.id);

      if (isActive) {
        setMessages((prev) => [...prev, msg]);
      } else {
        const senderId = msg.sender_id;
        if (senderId !== user.id) {
          setUnread((prev) => ({
            ...prev,
            [`c_${senderId}`]: (prev[`c_${senderId}`] ?? 0) + 1,
          }));
          const senderName = msg.sender_username ?? `Użytkownik #${senderId}`;
          addToast(`💬 ${senderName}: ${msg.content.slice(0, 60)}`);
        }
      }
    };

    const onRoomMessage = (msg) => {
      const current = activeChatRef.current;
      const isActive = current?.type === "room" && current.data.id === msg.room_id;

      if (isActive) {
        setMessages((prev) => [...prev, msg]);
      } else {
        if (msg.sender_id !== user.id) {
          setUnread((prev) => ({
            ...prev,
            [`r_${msg.room_id}`]: (prev[`r_${msg.room_id}`] ?? 0) + 1,
          }));
          addToast(`💬 #${msg.room_id} — ${msg.sender_username ?? "ktoś"}: ${msg.content.slice(0, 50)}`);
        }
      }
    };

    const onUserStatus = ({ user_id, online }) => {
      setContacts((prev) =>
        prev.map((c) => (c.id === user_id ? { ...c, online } : c))
      );
    };

    const onTyping = ({ from_user_id }) => {
      const current = activeChatRef.current;
      if (current?.type !== "contact" || from_user_id !== current.data.id) return;
      setTypingFrom(from_user_id);
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingFrom(null), 2500);
    };

    const onRoomInvite = (room) => {
      setRooms((prev) => {
        if (prev.find((r) => r.id === room.id)) return prev;
        return [...prev, room];
      });
      socket.emit("join_room", { room_id: room.id });
    };

    socket.on("message", onMessage);
    socket.on("room_message", onRoomMessage);
    socket.on("user_status", onUserStatus);
    socket.on("typing", onTyping);
    socket.on("room_invite", onRoomInvite);

    return () => {
      socket.off("message", onMessage);
      socket.off("room_message", onRoomMessage);
      socket.off("user_status", onUserStatus);
      socket.off("typing", onTyping);
      socket.off("room_invite", onRoomInvite);
    };
  }, [socket, user.id]);

  function selectContact(contact) {
    setActiveChat({ type: "contact", data: contact });
    setUnread((prev) => { const n = { ...prev }; delete n[`c_${contact.id}`]; return n; });
  }

  function selectRoom(room) {
    setActiveChat({ type: "room", data: room });
    setUnread((prev) => { const n = { ...prev }; delete n[`r_${room.id}`]; return n; });
    if (socket) socket.emit("join_room", { room_id: room.id });
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !activeChat || !socket) return;

    if (activeChat.type === "contact") {
      // Optimistic update for 1:1
      const optimistic = {
        id: Date.now(),
        sender_id: user.id,
        recipient_id: activeChat.data.id,
        content: input.trim(),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      socket.emit("private_message", { to_user_id: activeChat.data.id, content: input.trim() });
    } else {
      // No optimistic update for rooms — broadcast with include_self=True will deliver it
      socket.emit("room_message", { room_id: activeChat.data.id, content: input.trim() });
    }

    setInput("");
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    if (socket && activeChat?.type === "contact") {
      socket.emit("typing", { to_user_id: activeChat.data.id });
    }
  }

  async function createRoom(e) {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const res = await api.post("/rooms/", { name: newRoomName.trim() });
    setRooms((prev) => [...prev, res.data]);
    setNewRoomName("");
    setShowNewRoom(false);
    if (socket) socket.emit("join_room", { room_id: res.data.id });
  }

  async function openBrowse() {
    const res = await api.get("/rooms/available");
    setAvailableRooms(res.data);
    setShowBrowse(true);
  }

  async function joinRoom(room) {
    await api.post(`/rooms/${room.id}/join`);
    setRooms((prev) => {
      if (prev.find((r) => r.id === room.id)) return prev;
      return [...prev, room];
    });
    setAvailableRooms((prev) => prev.filter((r) => r.id !== room.id));
    if (socket) socket.emit("join_room", { room_id: room.id });
  }

  async function openManage() {
    const res = await api.get("/users/");
    setAllUsers(res.data.filter((u) => u.id !== user.id));
    setManageModal(true);
  }

  async function inviteUser(userId) {
    await api.post(`/rooms/${activeChat.data.id}/invite`, { user_id: userId });
    setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, invited: true } : u));
  }

  async function deleteRoom() {
    await api.delete(`/rooms/${activeChat.data.id}`);
    setRooms((prev) => prev.filter((r) => r.id !== activeChat.data.id));
    setActiveChat(null);
    setManageModal(false);
  }

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
          {/* Contacts section */}
          <div className="sidebar-title">Kontakty</div>
          <ul className="contact-list">
            {contacts.map((c) => (
              <li
                key={c.id}
                className={`contact-item ${
                  activeChat?.type === "contact" && activeChat.data.id === c.id ? "active" : ""
                }`}
                onClick={() => selectContact(c)}
              >
                <span className={`status-dot ${c.online ? "online" : "offline"}`} />
                <span className="contact-name">{c.username}</span>
                {unread[`c_${c.id}`] > 0 && (
                  <span className="badge">{unread[`c_${c.id}`]}</span>
                )}
              </li>
            ))}
            {contacts.length === 0 && (
              <li className="contact-empty">Brak innych użytkowników</li>
            )}
          </ul>

          {/* Rooms section */}
          <div className="sidebar-section-header sidebar-section-rooms">
            Pokoje
            <button
              className="btn-icon"
              title="Nowy pokój"
              onClick={() => setShowNewRoom((v) => !v)}
            >
              +
            </button>
          </div>

          {showNewRoom && (
            <form className="new-room-form" onSubmit={createRoom}>
              <input
                className="new-room-input"
                placeholder="Nazwa pokoju…"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                autoFocus
              />
              <button className="btn btn-send btn-sm" type="submit" disabled={!newRoomName.trim()}>
                OK
              </button>
            </form>
          )}

          <ul className="contact-list">
            {rooms.map((r) => (
              <li
                key={r.id}
                className={`contact-item ${
                  activeChat?.type === "room" && activeChat.data.id === r.id ? "active" : ""
                }`}
                onClick={() => selectRoom(r)}
              >
                <span className="room-icon">#</span>
                <span className="contact-name">{r.name}</span>
                {unread[`r_${r.id}`] > 0 && (
                  <span className="badge">{unread[`r_${r.id}`]}</span>
                )}
              </li>
            ))}
            {rooms.length === 0 && (
              <li className="contact-empty">Brak pokojów</li>
            )}
          </ul>

          <button className="btn-browse-rooms" onClick={openBrowse}>
            Przeglądaj pokoje
          </button>
        </aside>

        {/* Chat main */}
        <main className="chat-main">
          {activeChat ? (
            <>
              <div className="chat-header">
                {activeChat.type === "contact" ? (
                  <>
                    <span
                      className={`status-dot ${activeChat.data.online ? "online" : "offline"}`}
                    />
                    <strong>{activeChat.data.username}</strong>
                    <span className="chat-header-status">
                      {activeChat.data.online ? "online" : "offline"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="room-icon-lg">#</span>
                    <strong>{activeChat.data.name}</strong>
                    {activeChat.data.created_by === user.id && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ marginLeft: "auto" }}
                        onClick={openManage}
                      >
                        Zarządzaj
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="message-list">
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id ?? i} className={`message-row ${isMine ? "mine" : "theirs"}`}>
                      <div style={{ display: "flex", flexDirection: "column", maxWidth: "60%" }}>
                        {!isMine && activeChat.type === "room" && msg.sender_username && (
                          <span className="message-sender">{msg.sender_username}</span>
                        )}
                        <div className="message-bubble" style={{ maxWidth: "100%" }}>
                          <span className="message-content">{msg.content}</span>
                          <span className="message-time">
                            {new Date(msg.created_at).toLocaleTimeString("pl-PL", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
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
                  placeholder={
                    activeChat.type === "contact"
                      ? `Wiadomość do ${activeChat.data.username}…`
                      : `Wiadomość na #${activeChat.data.name}…`
                  }
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
              Wybierz kontakt lub pokój, aby rozpocząć rozmowę
            </div>
          )}
        </main>
      </div>

      {/* Browse rooms modal */}
      {showBrowse && (
        <div className="modal-overlay" onClick={() => setShowBrowse(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Dostępne pokoje</strong>
              <button className="btn-icon" onClick={() => setShowBrowse(false)}>✕</button>
            </div>
            {availableRooms.length === 0 ? (
              <div className="modal-empty">Brak dostępnych pokojów</div>
            ) : (
              <ul className="modal-list">
                {availableRooms.map((r) => (
                  <li key={r.id} className="modal-list-item">
                    <span><span className="room-icon">#</span> {r.name}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => joinRoom(r)}
                    >
                      Dołącz
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Manage room modal */}
      {manageModal && activeChat?.type === "room" && (
        <div className="modal-overlay" onClick={() => setManageModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <strong>Zarządzaj: #{activeChat.data.name}</strong>
              <button className="btn-icon" onClick={() => setManageModal(false)}>✕</button>
            </div>
            <div className="modal-section">
              <div className="modal-label">Zaproś użytkownika</div>
              {allUsers.length === 0 ? (
                <div className="modal-empty">Brak użytkowników</div>
              ) : (
                <ul className="modal-list">
                  {allUsers.map((u) => (
                    <li key={u.id} className="modal-list-item">
                      <span>
                        <span className={`status-dot ${u.online ? "online" : "offline"}`} style={{ marginRight: 8 }} />
                        {u.username}
                      </span>
                      <button
                        className="btn btn-sm"
                        style={u.invited ? { background: "#48bb78", color: "#fff" } : { background: "var(--color-primary)", color: "#fff" }}
                        onClick={() => !u.invited && inviteUser(u.id)}
                        disabled={u.invited}
                      >
                        {u.invited ? "Wysłano ✓" : "Zaproś"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger btn-sm" onClick={deleteRoom}>
                Usuń pokój
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className="toast">{t.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}
