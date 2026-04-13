# Dokumentacja API

## REST API

Bazowy URL: `http://localhost:5000/api`

Wszystkie chronione endpointy wymagają nagłówka:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### Autentykacja

#### `POST /api/auth/register`
Rejestracja nowego użytkownika.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Odpowiedź 201:**
```json
{
  "message": "User created",
  "user_id": 1
}
```

---

#### `POST /api/auth/login`
Logowanie użytkownika.

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Odpowiedź 200:**
```json
{
  "access_token": "eyJ...",
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

---

#### `POST /api/auth/logout` *(chroniony)*
Wylogowanie (unieważnienie sesji po stronie serwera).

**Odpowiedź 200:**
```json
{ "message": "Logged out" }
```

---

### Użytkownicy

#### `GET /api/users` *(chroniony)*
Lista wszystkich użytkowników z ich statusem online.

**Odpowiedź 200:**
```json
[
  { "id": 1, "username": "alice", "online": true },
  { "id": 2, "username": "bob",   "online": false }
]
```

---

### Pokoje

#### `GET /api/rooms` *(chroniony)*
Lista pokojów, do których należy zalogowany użytkownik.

#### `POST /api/rooms` *(chroniony)*
Tworzenie nowego pokoju.

**Body:**
```json
{ "name": "string" }
```

#### `POST /api/rooms/<room_id>/join` *(chroniony)*
Dołączenie do pokoju.

#### `GET /api/rooms/<room_id>/messages` *(chroniony)*
Historia wiadomości pokoju (ostatnie 50).

---

### Wiadomości

#### `GET /api/messages/<user_id>` *(chroniony)*
Historia wiadomości prywatnych z danym użytkownikiem.

---

## Socket.IO Events

Połączenie: `ws://localhost:5000`  
Wymagane: nagłówek `Authorization: Bearer <token>` lub query param `?token=<token>`

---

### Klient → Serwer

| Zdarzenie | Dane | Opis |
|---|---|---|
| `private_message` | `{ to_user_id, content }` | Wyślij wiadomość prywatną |
| `room_message` | `{ room_id, content }` | Wyślij wiadomość do pokoju |
| `join_room` | `{ room_id }` | Dołącz do pokoju Socket.IO |
| `leave_room` | `{ room_id }` | Opuść pokój Socket.IO |
| `typing` | `{ to_user_id }` | Informacja "pisze..." |

---

### Serwer → Klient

| Zdarzenie | Dane | Opis |
|---|---|---|
| `message` | `{ id, from_user, content, timestamp }` | Nowa wiadomość prywatna |
| `room_message` | `{ id, room_id, from_user, content, timestamp }` | Nowa wiadomość grupowa |
| `user_status` | `{ user_id, online: bool }` | Zmiana statusu użytkownika |
| `ack` | `{ message_id }` | Potwierdzenie dostarczenia |
| `typing` | `{ from_user_id }` | Powiadomienie "pisze..." |
| `error` | `{ message }` | Błąd serwera |
