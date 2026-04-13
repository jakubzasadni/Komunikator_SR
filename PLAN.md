# Plan semestralny — Komunikator SR

Zajęcia odbywają się co 2 tygodnie. Poniżej harmonogram iteracji wraz z celami, założeniami i kryteriami akceptacji.

---

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

## Iteracja 2 — Szkielet projektu i środowisko
**Termin:** Zajęcia 2

### Cele
- [ ] Struktura katalogów backend i frontend
- [ ] Docker Compose: Flask + PostgreSQL + React
- [ ] Modele bazy danych: `User`, `Room`, `Message`
- [ ] Migracje bazy danych (Flask-Migrate)
- [ ] Działający `docker-compose up`

### Kryteria akceptacji
- Kontenery uruchamiają się bez błędów
- Połączenie z bazą danych potwierdzone
- Modele widoczne w PostgreSQL po migracji

---

## Iteracja 3 — Autentykacja użytkownika
**Termin:** Zajęcia 3

### Cele
- [ ] Endpoint `POST /auth/register` — rejestracja
- [ ] Endpoint `POST /auth/login` — logowanie + JWT
- [ ] Endpoint `POST /auth/logout` — wylogowanie
- [ ] Hashowanie haseł (bcrypt)
- [ ] Formularz logowania i rejestracji w React
- [ ] Przechowywanie JWT w `localStorage` / `httpOnly cookie`

### Kryteria akceptacji
- Rejestracja tworzy użytkownika w DB
- Login zwraca token JWT
- Chronione endpointy odrzucają requesty bez tokena
- Testy w Postmanie przechodzą

---

## Iteracja 4 — Komunikacja WebSocket i wiadomości prywatne (PU-01)
**Termin:** Zajęcia 4

### Cele
- [ ] Integracja Flask-SocketIO z backendem
- [ ] Zdarzenia Socket.IO: `connect`, `disconnect`, `private_message`
- [ ] Dostarczanie wiadomości do konkretnego użytkownika (po `user_id`)
- [ ] Obsługa wielu sesji jednego użytkownika
- [ ] Okno czatu w React — wysyłanie i odbieranie wiadomości RT
- [ ] Zapis wiadomości do PostgreSQL

### Kryteria akceptacji
- Użytkownik A wysyła wiadomość → Użytkownik B odbiera natychmiast
- Wiadomość zapisana w tabeli `messages`
- Działa przy dwóch równoczesnych sesjach tego samego użytkownika

---

## Iteracja 5 — Pokoje grupowe (PU-02)
**Termin:** Zajęcia 5

### Cele
- [ ] Endpointy REST: tworzenie pokoju, lista pokojów, dołączanie
- [ ] Zdarzenia Socket.IO: `join_room`, `leave_room`, `room_message`
- [ ] Broadcast wiadomości do wszystkich uczestników pokoju
- [ ] Historia wiadomości pokoju (pobierana przy dołączeniu)
- [ ] Widok listy pokojów i okno czatu grupowego w React

### Kryteria akceptacji
- Wiadomość wysłana do pokoju dociera do wszystkich aktywnych uczestników
- Nowy uczestnik po dołączeniu widzi historię wiadomości
- Użytkownik może być w wielu pokojach jednocześnie

---

## Iteracja 6 — Status online, lista kontaktów i UI
**Termin:** Zajęcia 6

### Cele
- [ ] Status online/offline użytkowników (aktualizowany przez Socket.IO)
- [ ] Lista kontaktów z widocznym statusem w czasie rzeczywistym
- [ ] Powiadomienia o nowych wiadomościach
- [ ] Dopracowanie UI (responsywność, UX)
- [ ] Obsługa błędów i edge-case'ów (rozłączenie, timeout)

### Kryteria akceptacji
- Status zmienia się natychmiast po connect/disconnect
- Lista kontaktów odświeża się bez przeładowania strony

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
| Backend (Flask, Socket.IO) | Jakub Zasadni |
| Frontend (React, UI) | Dawid Świgut |
| Baza danych, DevOps | Krzysztof Witek |

> Podział może ewoluować — wszystkie osoby uczestniczą w code review.
