# Przypadki użycia

## PU-01 — Wysyłanie wiadomości prywatnej

**Aktor:** Użytkownik końcowy  
**Warunek wstępny:** Użytkownik jest zalogowany i połączony przez WebSocket

**Scenariusz główny:**
1. Użytkownik wybiera kontakt z listy aktywnych użytkowników.
2. Wpisuje treść wiadomości w polu tekstowym i zatwierdza.
3. Frontend emituje zdarzenie `private_message` przez Socket.IO.
4. Serwer weryfikuje token JWT nadawcy.
5. Serwer wyszukuje aktywne sesje (socket_id) odbiorcy.
6. Serwer doręcza wiadomość do wszystkich sesji odbiorcy.
7. Serwer zapisuje wiadomość w bazie danych.
8. (Opcjonalnie) Serwer wysyła potwierdzenie ACK do nadawcy.

**Scenariusz alternatywny — odbiorca offline:**
- Krok 5: Odbiorca nie ma aktywnych sesji.
- Wiadomość zapisywana jest w DB jako niedostarczona.
- (Opcjonalnie) Dostarczana po ponownym połączeniu odbiorcy.

---

## PU-02 — Wysyłanie wiadomości do pokoju grupowego

**Aktor:** Użytkownik końcowy  
**Warunek wstępny:** Użytkownik jest zalogowany i należy do pokoju

**Scenariusz główny:**
1. Użytkownik wybiera pokój z listy dostępnych pokojów.
2. Serwer zwraca historię wiadomości pokoju (ostatnie N wiadomości).
3. Użytkownik wpisuje treść wiadomości i zatwierdza.
4. Frontend emituje zdarzenie `room_message` przez Socket.IO.
5. Serwer weryfikuje token JWT i członkostwo w pokoju.
6. Serwer rozgłasza wiadomość (`broadcast`) do wszystkich aktywnych uczestników pokoju.
7. Serwer zapisuje wiadomość w bazie danych.

**Scenariusz alternatywny — nowy uczestnik:**
- Użytkownik dołącza do pokoju przez `join_room`.
- Serwer zwraca historię wiadomości z bazy danych.
- Użytkownik może przeglądać wiadomości sprzed dołączenia.

---

## PU-03 — Logowanie i zarządzanie sesją

**Aktor:** Użytkownik końcowy  
**Warunek wstępny:** Użytkownik posiada konto w systemie

**Scenariusz główny:**
1. Użytkownik otwiera aplikację i wypełnia formularz logowania.
2. Frontend wysyła `POST /auth/login` z loginem i hasłem.
3. Serwer weryfikuje dane i hasło (bcrypt).
4. Serwer generuje token JWT (z `user_id`, czasem wygaśnięcia).
5. Frontend przechowuje token i nawiązuje połączenie WebSocket.
6. Serwer rejestruje sesję: `user_id → socket_id`.
7. Użytkownik widzi listę kontaktów, pokojów i historię wiadomości.

**Scenariusz alternatywny — błędne dane:**
- Krok 3: Dane niepoprawne → serwer zwraca `401 Unauthorized`.
- Frontend wyświetla komunikat błędu.

**Scenariusz — wylogowanie:**
1. Użytkownik klika "Wyloguj".
2. Frontend emituje `disconnect` przez Socket.IO.
3. Serwer usuwa sesję użytkownika ze słownika aktywnych połączeń.
4. Status użytkownika zmienia się na offline dla wszystkich kontaktów.
