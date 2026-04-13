# Komunikator — Projekt Systemów Rozproszonych

Aplikacja komunikatora internetowego w architekturze klient–serwer, realizowana w ramach przedmiotu **Systemy Rozproszone**.

**Autorzy:** Dawid Świgut · Krzysztof Witek · Jakub Zasadni

---

## Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | React + Vite |
| Backend | Python 3.12 + Flask + Flask-SocketIO |
| Komunikacja RT | WebSocket / Socket.IO |
| Baza danych | PostgreSQL |
| ORM | SQLAlchemy |
| Konteneryzacja | Docker + Docker Compose |
| Testowanie API | Postman |

---

## Kluczowe funkcjonalności

- Rejestracja i logowanie użytkownika (JWT)
- Wiadomości prywatne 1:1 w czasie rzeczywistym
- Pokoje grupowe — dołączanie, opuszczanie, rozsyłanie wiadomości
- Historia wiadomości (PostgreSQL)
- Status online/offline użytkowników
- Obsługa wielu równoległych sesji jednego użytkownika
- (opcjonalnie) ACK potwierdzenia dostarczenia
- (opcjonalnie) Kolejka wiadomości offline

---

## Struktura repozytorium

```
Komunikator_SR/
├── backend/                  # Serwer Flask + Socket.IO
│   ├── app/
│   │   ├── models/           # Modele SQLAlchemy (User, Room, Message)
│   │   ├── routes/           # REST endpointy (auth, rooms, users)
│   │   └── sockets/          # Obsługa zdarzeń Socket.IO
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
├── frontend/                 # Klient React
│   ├── src/
│   │   ├── components/       # Chat, ContactList, Login, Rooms
│   │   ├── contexts/         # AuthContext, SocketContext
│   │   ├── hooks/            # useSocket, useMessages
│   │   └── services/         # api.js, socket.js
│   └── package.json
├── docs/                     # Dokumentacja projektu
│   ├── architecture.md
│   ├── use-cases.md
│   └── api.md
├── docker-compose.yml
└── .gitignore
```

---

## Uruchomienie lokalne

### Wymagania
- Docker Desktop
- Node.js 20+
- Python 3.12+

### Docker (zalecane)

```bash
docker-compose up --build
```

Aplikacja dostępna pod:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

### Ręczne uruchomienie

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # uzupełnij zmienne środowiskowe
flask db upgrade
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Przypadki użycia

| ID | Opis |
|---|---|
| PU-01 | Wysyłanie wiadomości prywatnej |
| PU-02 | Wysyłanie wiadomości do pokoju grupowego |
| PU-03 | Logowanie i zarządzanie sesją |

Szczegóły: [docs/use-cases.md](docs/use-cases.md)

---

## Dokumentacja API

Szczegóły endpointów REST i zdarzeń Socket.IO: [docs/api.md](docs/api.md)

Kolekcja Postman: `docs/postman_collection.json` (dodawana sukcesywnie)

---

## Plan semestralny

Szczegółowy harmonogram z celami na każde zajęcia: [PLAN.md](PLAN.md)
