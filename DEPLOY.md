# Deployment na Azure VM (docker-compose)

**Aplikacja produkcyjna:** http://20.56.129.98/
**Panel admina:** http://20.56.129.98/admin

---

## 1. Utwórz maszynę wirtualną w Azure

1. Zaloguj się do [portal.azure.com](https://portal.azure.com)
2. **Utwórz zasób → Virtual Machine**
3. Ustawienia:
   - **Image**: Ubuntu Server 24.04 LTS
   - **Size**: B1s (1 vCPU, 1 GB RAM) — najtańsza, wystarczy
   - **Authentication**: SSH public key (wygeneruj lub użyj istniejącego)
   - **Region**: dowolny (np. East US lub North Europe)
4. **Networking → Inbound ports**: zaznacz **HTTP (80)** i **SSH (22)**
5. Kliknij **Review + Create → Create**
6. Po utworzeniu skopiuj **Public IP address** maszyny

---

## 2. Zaloguj się do VM przez SSH

```bash
chmod 600 ~/.ssh/twoj_klucz.pem
ssh -i ~/.ssh/twoj_klucz.pem azureuser@<PUBLIC_IP>
```

---

## 3. Zainstaluj Docker na VM

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

Sprawdź:
```bash
docker --version
```

---

## 4. Skopiuj projekt na VM

**Opcja A — przez Git:**
```bash
git clone https://github.com/TwojUsername/komunikator-sr.git
cd komunikator-sr
```

**Opcja B — przez scp z lokalnego komputera:**
```bash
scp -r -i ~/.ssh/twoj_klucz.pem /home/jakub-zasadni/CoreLogicGroups/STUDIA/Komunikator_SR azureuser@<PUBLIC_IP>:~/
ssh -i ~/.ssh/twoj_klucz.pem azureuser@<PUBLIC_IP>
cd Komunikator_SR
```

---

## 5. Utwórz plik .env.prod

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Uzupełnij wszystkie wartości:

```
DB_PASSWORD=TwojeHasloDoPostgres123!
SECRET_KEY=losowy_ciag_min_32_znaki_abcdefghijkl
JWT_SECRET_KEY=inny_losowy_ciag_min_32_znaki_12345678

ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@komunikator.local
ADMIN_PASSWORD=TwojeSilneHasloAdmina!
```

Możesz wygenerować losowe klucze:
```bash
openssl rand -hex 32
```

---

## 6. Uruchom aplikację

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Budowanie zajmie 2-5 minut. Sprawdź logi backendu:

```bash
docker compose -f docker-compose.prod.yml logs backend --tail=30
```

Powinieneś zobaczyć m.in.:
```
[seed-admin] Admin user 'admin' created (admin@komunikator.local)
wsgi starting up on http://0.0.0.0:5000
```

---

## 7. Otwórz aplikację

```
http://<PUBLIC_IP>         ← aplikacja
http://<PUBLIC_IP>/admin   ← panel admina
```

---

## Konto admina

Konto admina jest tworzone **automatycznie przy pierwszym starcie** na podstawie zmiennych z `.env.prod`.

| Pole | Wartość z .env.prod |
|------|---------------------|
| Login (email) | `ADMIN_EMAIL` |
| Hasło | `ADMIN_PASSWORD` |
| Username | `ADMIN_USERNAME` |

Po zalogowaniu admin widzi przycisk **"Panel admina"** w nagłówku aplikacji.

**Co może admin:**
- Przeglądać listę wszystkich użytkowników
- Usuwać użytkowników (kaskadowo usuwa ich wiadomości i członkostwa)
- Nadawać / odbierać rolę admina innym użytkownikom
- Przeglądać i usuwać dowolne pokoje grupowe

**Uwagi:**
- Admin nie może usunąć własnego konta
- Admin nie może zmienić własnej roli
- Przy ponownym `up --build` konto admina nie jest nadpisywane jeśli już istnieje

---

## Przydatne komendy

```bash
# Status kontenerów
docker compose -f docker-compose.prod.yml ps

# Logi backendu (live)
docker compose -f docker-compose.prod.yml logs backend -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Zatrzymanie
docker compose -f docker-compose.prod.yml down

# Aktualizacja po zmianach w kodzie
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Wyczyszczenie bazy danych
docker compose -f docker-compose.prod.yml exec db psql -U komunikator -d komunikator_db \
  -c "TRUNCATE TABLE messages, room_members, rooms, users RESTART IDENTITY CASCADE;"
```

---

## Opcjonalnie: Domena zamiast IP

1. W Azure Portal → VM → **DNS name label** → ustaw nazwę
2. Dostaniesz adres: `twoja-nazwa.westeurope.cloudapp.azure.com`

---

## Koszty (Azure for Students)

| Zasób | Koszt |
|-------|-------|
| VM B1s | ~$7/mies |
| Dysk OS (32 GB) | ~$2/mies |
| IP publiczny | ~$3/mies |
| **Razem** | **~$12/mies** |

Kredyty studenckie AGH ($100/rok) → ~8 miesięcy działania.
