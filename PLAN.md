## Iteracja 1 — Kick-off i setup projektu
**Termin:** Zajęcia 1 (prezentacja wstępna — zrealizowane)

### Cele
- [x] Zdefiniowanie wymagań i zakresu projektu
- [x] Wybór stosu technologicznego
- [x] Przygotowanie prezentacji wstępnej
- [x] Inicjalizacja repozytorium

### Założenia
- Architektura klient–serwer z WebSocket
- Frontend: React, Backend: Flask + Socket.IO, DB: PostgreSQL

---

## Iteracja 2 — Szkielet projektu i środowisko ✅
**Termin:** Zajęcia 2

### Cele
- [x] Struktura katalogów backend i frontend
- [x] Docker Compose: Flask + PostgreSQL + React
- [x] Modele bazy danych: `User`, `Room`, `RoomMember`, `Message`
- [x] Migracje bazy danych (Flask-Migrate + `entrypoint.sh`)
- [x] Działający `docker-compose up`

### Kryteria akceptacji
- Kontenery uruchamiają się bez błędów ✅
- Połączenie z bazą danych potwierdzone ✅
- Modele widoczne w PostgreSQL po migracji ✅

---

## Iteracja 3 — Autentykacja użytkownika ✅
**Termin:** Zajęcia 3

### Cele
- [x] Endpoint `POST /api/auth/register` — rejestracja z walidacją unikalności email i username
- [x] Endpoint `POST /api/auth/login` — logowanie + JWT
- [x] Endpoint `POST /api/auth/logout` — wylogowanie
- [x] Hashowanie haseł (bcrypt)
- [x] Formularz logowania i rejestracji w React (z obsługą błędów)
- [x] Przechowywanie JWT w `localStorage`

### Kryteria akceptacji
- Rejestracja tworzy użytkownika w DB ✅
- Login zwraca token JWT ✅
- Chronione endpointy odrzucają requesty bez tokena ✅
- Walidacja pól i czytelne komunikaty błędów ✅

---

## Iteracja 4 — Komunikacja WebSocket i wiadomości prywatne (PU-01) ✅
**Termin:** Zajęcia 4

### Cele
- [x] Integracja Flask-SocketIO z backendem (eventlet async mode)
- [x] Zdarzenia Socket.IO: `connect`, `disconnect`, `private_message`, `typing`
- [x] Dostarczanie wiadomości do konkretnego użytkownika (po `user_id`)
- [x] Obsługa wielu sesji jednego użytkownika (`SessionStore`: `user_id → set(socket_ids)`)
- [x] Okno czatu w React — wysyłanie i odbieranie wiadomości RT (`ChatPage.jsx`)
- [x] Zapis wiadomości do PostgreSQL (tabela `messages`, kolumna `delivered`)
- [x] Wskaźnik pisania (`typing` event, timeout 2.5 s)
- [x] Status online/offline w sidebarze kontaktów (zielona/szara kropka)
- [x] Historia wiadomości przy wyborze kontaktu (`GET /api/messages/<user_id>`)
- [x] ACK dostarczenia wiadomości (`ack` event → ikona ✓ po stronie nadawcy)

### Kryteria akceptacji
- Użytkownik A wysyła wiadomość → Użytkownik B odbiera natychmiast ✅
- Wiadomość zapisana w tabeli `messages` ✅
- Działa przy dwóch równoczesnych sesjach tego samego użytkownika ✅

### Zrealizowane pliki
- `backend/app/sockets/events.py` — pełna obsługa zdarzeń WebSocket
- `backend/app/routes/messages.py` — historia wiadomości prywatnych
- `backend/app/routes/users.py` — lista użytkowników ze statusem online
- `backend/app/session_store.py` — `SessionStore` (singleton, thread-safe)
- `frontend/src/components/Chat/ChatPage.jsx` — widok czatu 1:1
- `frontend/src/index.css` — style czatu (bąbelki, sidebar, typing indicator)

---

## Iteracja 5 — Pokoje grupowe (PU-02) ✅
**Termin:** Zajęcia 5

### Cele
- [x] Endpointy REST: tworzenie pokoju, lista pokojów, dołączanie (`GET/POST /api/rooms/`, `POST /api/rooms/<id>/join`)
- [x] Endpoint `GET /api/rooms/available` — pokoje do których użytkownik nie należy
- [x] Endpoint `POST /api/rooms/<id>/invite` — zaproszenie usera przez właściciela
- [x] Endpoint `DELETE /api/rooms/<id>/members/<uid>` — usunięcie członka (owner)
- [x] Endpoint `DELETE /api/rooms/<id>` — usunięcie pokoju (owner)
- [x] Zdarzenia Socket.IO: `join_room`, `leave_room`, `room_message`
- [x] Auto-join pokoi przy połączeniu WS (`on_connect` iteruje po `RoomMember`)
- [x] Broadcast wiadomości do wszystkich uczestników pokoju (`include_self=True`)
- [x] Historia wiadomości pokoju (pobierana przy wyborze pokoju)
- [x] `sender_username` w `Message.to_dict()` — widoczny w czacie grupowym
- [x] Widok listy pokojów w sidebarze React z sekcją "Pokoje"
- [x] Inline form tworzenia pokoju (przycisk "+" przy nagłówku Pokoje)
- [x] Modal "Przeglądaj pokoje" z przyciskiem Dołącz
- [x] Okno czatu grupowego — bąbelki z username nadawcy
- [x] Modal "Zarządzaj" dla właściciela (zapraszanie, usunięcie pokoju)
- [x] `room_invite` event — zaproszony user widzi pokój w sidebarze natychmiast

### Kryteria akceptacji
- Wiadomość wysłana do pokoju dociera do wszystkich aktywnych uczestników ✅
- Nowy uczestnik po dołączeniu widzi historię wiadomości ✅
- Użytkownik może być w wielu pokojach jednocześnie ✅

### Zrealizowane pliki
- `backend/app/routes/rooms.py` — nowe endpointy (available, invite, remove member, delete)
- `backend/app/sockets/events.py` — auto-join pokoi przy `on_connect`
- `backend/app/models/message.py` — `sender_username` w `to_dict()`
- `frontend/src/components/Chat/ChatPage.jsx` — pełna obsługa pokojów grupowych

---

## Iteracja 6 — Status online, lista kontaktów i UI ✅
**Termin:** Zajęcia 6

### Cele
- [x] Status online/offline użytkowników (aktualizowany przez Socket.IO `user_status`)
- [x] Lista kontaktów z widocznym statusem w czasie rzeczywistym (zielona/szara kropka)
- [x] Nieodczytane odznaki (badge) na kontaktach i pokojach w sidebarze
- [x] Kasowanie badge przy wybraniu czatu
- [x] Obsługa `room_invite` — pokój pojawia się w sidebarze bez przeładowania
- [x] Reconnect: `reconnectionAttempts: 5`, `reconnectionDelay: 1000ms` w SocketContext
- [x] Wskaźnik stanu połączenia w nagłówku (kropka online/offline przy nazwie usera)
- [x] `activeChatRef` — eliminacja stale closure w handlerach socketa
- [x] Dopracowanie UI: modale, sidebar sections, room icon "#", badge

### Kryteria akceptacji
- Status zmienia się natychmiast po connect/disconnect ✅
- Lista kontaktów odświeża się bez przeładowania strony ✅

### Zrealizowane pliki
- `frontend/src/components/Chat/ChatPage.jsx` — unread badges, status dots, reconnect handling
- `frontend/src/index.css` — nowe klasy: sidebar sections, badge, modal, room icon, btn-sm, btn-danger

---

## Iteracja 7 — Testy, optymalizacja i dokumentacja
**Termin:** Zajęcia 7

### Cele
- [ ] Testy jednostkowe backendu (pytest)
- [ ] Testy integracyjne endpointów REST (Postman / pytest)
- [ ] Dokumentacja API (`docs/api.md`) — kompletna
- [ ] Profil obciążenia: test wielu równoczesnych połączeń
- [ ] Opcjonalnie: ACK potwierdzenia dostarczenia
- [ ] Opcjonalnie: kolejka wiadomości offline

### Kryteria akceptacji
- Pokrycie testami ≥ 70% backendu
- Kolekcja Postman dla wszystkich endpointów
- Serwer obsługuje ≥ 10 równoczesnych połączeń bez błędów

---

## Iteracja 8 — Prezentacja końcowa
**Termin:** Ostatnie zajęcia

### Cele
- [ ] Kompletna, działająca aplikacja
- [ ] Demo: rejestracja, logowanie, czat 1:1, czat grupowy
- [ ] Prezentacja końcowa
- [ ] Sprawozdanie / dokumentacja techniczna
- [ ] Czysty kod, code review, merge do `main`

---

## Wymagania niefunkcjonalne

| Wymaganie | Wartość docelowa |
|---|---|
| Opóźnienie wiadomości RT | < 100 ms (sieć lokalna) |
| Równoczesne połączenia | ≥ 10 |
| Bezpieczeństwo | JWT + bcrypt, brak danych wrażliwych w URL |
| Przenośność | Uruchomienie przez `docker-compose up` |

---

## Podział odpowiedzialności (wstępny)

| Obszar | Osoba |
|---|---|
| Backend (Flask, Socket.IO) | Dawid Świgut |
| Frontend (React, UI) | Krzysztof Witek |
| Baza danych, DevOps | Jakub Zasadni |

> Podział może ewoluować — wszystkie osoby uczestniczą w code review.
