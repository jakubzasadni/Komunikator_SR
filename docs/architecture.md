# Architektura systemu

## Model klient–serwer

```
┌──────────────┐        WebSocket / HTTP        ┌─────────────────────┐
│   React SPA  │ ◄────────────────────────────► │   Flask + SocketIO  │
│  (Frontend)  │                                │     (Backend)        │
└──────────────┘                                └──────────┬──────────┘
                                                           │ SQLAlchemy
                                                ┌──────────▼──────────┐
                                                │     PostgreSQL       │
                                                │   (Baza danych)      │
                                                └─────────────────────┘
```

## Warstwy systemu

### Warstwa prezentacji (React)
- Aplikacja SPA — brak przeładowań strony
- Komponenty: `ChatWindow`, `ContactList`, `RoomList`, `LoginForm`
- Komunikacja z backendem: REST (auth, dane) + Socket.IO (RT messages)
- Konteksty: `AuthContext` (token JWT), `SocketContext` (połączenie WS)

### Warstwa aplikacji (Flask + Socket.IO)
- REST API: rejestracja, logowanie, zarządzanie pokojami
- Socket.IO Gateway: obsługa zdarzeń czasu rzeczywistego
- Weryfikacja JWT na każdym żądaniu (middleware)
- Zarządzanie sesjami użytkowników (mapowanie `user_id → socket_id[]`)

### Warstwa danych (PostgreSQL)
- Trwałe przechowywanie kont, pokojów i historii wiadomości
- ORM: SQLAlchemy + Flask-Migrate (migracje)

## Przepływ wiadomości prywatnej

```
Klient A                    Serwer                    Klient B
   │                           │                          │
   │──emit('private_message')──►│                          │
   │                           │──lookup sessions(B)──────►│
   │                           │──emit('message')──────────►│
   │◄──emit('ack')─────────────│                          │
   │                           │──INSERT messages (DB)     │
```

## Przepływ wiadomości grupowej

```
Klient A                    Serwer                  Klienci w pokoju
   │                           │                          │
   │──emit('room_message')─────►│                          │
   │                           │──broadcast(room_id)───────►│ (wszyscy)
   │                           │──INSERT messages (DB)     │
```
