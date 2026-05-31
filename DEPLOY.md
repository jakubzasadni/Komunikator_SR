# Deployment na Azure VM (docker-compose)

**Aplikacja produkcyjna:** http://20.56.129.98/


## 1. Utwórz maszynę wirtualną w Azure

1. Zaloguj się do [portal.azure.com](https://portal.azure.com)
2. **Utwórz zasób → Virtual Machine**
3. Ustawienia:
   - **Image**: Ubuntu Server 24.04 LTS
   - **Size**: B1s (1 vCPU, 1 GB RAM) — najtańsza, wystarczy
   - **Authentication**: SSH public key (wygeneruj lub użyj istniejącego)
   - **Region**: dowolny (np. West Europe)
4. **Networking → Inbound ports**: zaznacz **HTTP (80)** i **SSH (22)**
5. Kliknij **Review + Create → Create**
6. Po utworzeniu skopiuj **Public IP address** maszyny

---

## 2. Zaloguj się do VM przez SSH

```bash
ssh -i ~/.ssh/twoj_klucz azureuser@<PUBLIC_IP>
```

---

## 3. Zainstaluj Docker na VM

```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Wyloguj i zaloguj ponownie żeby zadziałała grupa docker
exit
```

Po ponownym zalogowaniu sprawdź:
```bash
docker --version
```

---

## 4. Skopiuj projekt na VM

**Opcja A — przez Git (jeśli masz repo):**
```bash
git clone https://github.com/TwojUsername/komunikator-sr.git
cd komunikator-sr
```

**Opcja B — przez scp z lokalnego komputera:**
```bash
# Uruchom lokalnie na swoim komputerze
scp -r -i ~/.ssh/twoj_klucz /home/jakub-zasadni/CoreLogicGroups/STUDIA/Komunikator_SR azureuser@<PUBLIC_IP>:~/
ssh -i ~/.ssh/twoj_klucz azureuser@<PUBLIC_IP>
cd Komunikator_SR
```

---

## 5. Utwórz plik .env.prod

Na VM, w katalogu projektu:

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Ustaw silne wartości:
```
DB_PASSWORD=TwojeHasloDoPostgres123!
SECRET_KEY=losowy_ciag_min_32_znaki_abcdefghijkl
JWT_SECRET_KEY=inny_losowy_ciag_min_32_znaki_12345678
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

Budowanie obrazów zajmie 2-5 minut. Po zakończeniu sprawdź logi:

```bash
docker compose -f docker-compose.prod.yml logs backend --tail=20
```

Powinieneś zobaczyć:
```
wsgi starting up on http://0.0.0.0:5000
```

---

## 7. Otwórz aplikację

Wejdź w przeglądarce na:
```
http://<PUBLIC_IP>
```

---

## Przydatne komendy

```bash
# Status kontenerów
docker compose -f docker-compose.prod.yml ps

# Logi backendu
docker compose -f docker-compose.prod.yml logs backend -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Zatrzymanie
docker compose -f docker-compose.prod.yml down

# Aktualizacja po zmianach w kodzie
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Opcjonalnie: Domena zamiast IP

Jeśli chcesz używać domeny (np. `komunikator.azurewebsites.net`):
1. W Azure Portal → VM → **DNS name label** → ustaw nazwę
2. Dostaniesz adres w stylu `twoja-nazwa.westeurope.cloudapp.azure.com`
3. Zaktualizuj CORS w backendzie jeśli potrzeba

---

## Koszty (Azure for Students)

| Zasób | Koszt |
|-------|-------|
| VM B1s | ~$7/mies |
| Dysk OS (32 GB) | ~$2/mies |
| IP publiczny | ~$3/mies |
| **Razem** | **~$12/mies** |

Kredyty studenckie AGH: $100/rok → spokojnie starczy na ~8 miesięcy.
