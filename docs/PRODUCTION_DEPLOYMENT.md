# Production Deployment Guide

**Version:** 2.0.0  
**Datum:** 07. Februar 2026  
**Status:** Production-Ready ✅

---

## Übersicht

Dieser Guide führt dich durch das vollständige Deployment des Job Application Agents in einer Produktionsumgebung.

---

## Voraussetzungen

### System-Anforderungen

| Komponente | Minimum | Empfohlen |
|:-----------|:--------|:----------|
| **OS** | Ubuntu 22.04 | Ubuntu 22.04 LTS |
| **CPU** | 2 Cores | 4 Cores |
| **RAM** | 4 GB | 8 GB |
| **Disk** | 20 GB | 50 GB |
| **Node.js** | 22.0.0 | 22.13.0+ |
| **Python** | 3.11+ | 3.11+ |
| **Docker** | 24.0+ | Latest |

### Erforderliche Accounts

- ✅ GitHub Account (für Repository-Zugriff)
- ✅ OpenAI Account (für LLM-Calls)
- ✅ Telegram Account (für Bot)
- ✅ Dedizierte E-Mail (Gmail/Outlook empfohlen)
- ⏳ LinkedIn Account (optional, für Easy Apply)

---

## Schritt 1: Repository klonen

```bash
# SSH (empfohlen)
git clone git@github.com:tibo47-161/openclaw-job-application-agent.git

# HTTPS
git clone https://github.com/tibo47-161/openclaw-job-application-agent.git

cd openclaw-job-application-agent
```

---

## Schritt 2: Umgebungsvariablen konfigurieren

### 2.1 .env-Datei erstellen

```bash
cp .env.example .env
nano .env
```

### 2.2 Erforderliche Variablen setzen

```bash
# OpenAI API
OPENAI_API_KEY=sk-proj-...

# GitHub
GITHUB_TOKEN=ghp_...

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# E-Mail (dediziertes Bewerbungs-Konto)
EMAIL_ADDRESS=bewerbungen@gmail.com
EMAIL_PASSWORD=app-specific-password
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Optional: LinkedIn
LINKEDIN_EMAIL=dein-linkedin@email.com
LINKEDIN_PASSWORD=dein-passwort

# Optional: Logging
LOG_LEVEL=info
MAX_RETRIES=3
```

### 2.3 API-Keys erstellen

**OpenAI API Key:**
1. https://platform.openai.com/api-keys
2. "Create new secret key"
3. Kopiere den Key (beginnt mit `sk-proj-`)

**GitHub Token:**
1. https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Scopes: `public_repo`
4. Kopiere den Token (beginnt mit `ghp_`)

**Telegram Bot Token:**
1. Öffne Telegram, suche `@BotFather`
2. Sende `/newbot`
3. Folge den Anweisungen
4. Kopiere den Bot-Token

**Telegram Chat ID:**
1. Sende eine Nachricht an deinen Bot
2. Öffne: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Finde `"chat":{"id":123456789}`
4. Kopiere die ID

**Gmail App-Passwort:**
1. https://myaccount.google.com/apppasswords
2. "App auswählen" → "Sonstige"
3. Name: "Job Application Agent"
4. Kopiere das generierte Passwort

---

## Schritt 3: Konfigurationsdateien anpassen

### 3.1 User Profile

```bash
cp config/user_profile.example.json config/user_profile.json
nano config/user_profile.json
```

**Wichtige Felder:**
- `personal.name` - Dein vollständiger Name
- `personal.email` - Deine Bewerbungs-E-Mail
- `personal.github` - Dein GitHub-Username (tibo47-161)
- `professional.experience` - Deine Berufserfahrung
- `skills.languages` - Deine Programmiersprachen
- `preferences.positions` - Gewünschte Positionen
- `preferences.locations` - Gewünschte Standorte

### 3.2 Search Criteria

```bash
nano config/search_criteria.json
```

**Anpassen:**
- `keywords` - Suchbegriffe für Job-Portale
- `location` - Standort (Hamburg, Remote, etc.)
- `filters` - Erfahrungslevel, Vertragsart, etc.

---

## Schritt 4: Docker Deployment (empfohlen)

### 4.1 Docker-Compose starten

```bash
# Alle Services starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Status prüfen
docker-compose ps
```

### 4.2 Services

| Service | Port | Beschreibung |
|:--------|:-----|:-------------|
| `agent-service` | 3000 | Agent Main Loop + REST API |
| `telegram-bridge` | - | Telegram Bot |
| `browser-service` | 4444 | Selenium Chrome |

### 4.3 Healthcheck

```bash
curl http://localhost:3000/health
```

**Erwartete Antwort:**
```json
{
  "status": "healthy",
  "uptime": "0d 1h 23m 45s",
  "services": {
    "applicationQueue": { "status": "healthy" },
    "githubService": { "status": "healthy" },
    "fileSystem": { "status": "healthy" }
  }
}
```

---

## Schritt 5: Native Deployment (alternativ)

### 5.1 Dependencies installieren

```bash
# Node.js Dependencies
npm install

# Python Dependencies
sudo pip3 install -r requirements.txt
```

### 5.2 Services starten

**Terminal 1: Agent Main Loop**
```bash
npm start
```

**Terminal 2: REST API**
```bash
npm run api
```

**Terminal 3: Telegram Bot**
```bash
python3 src/telegram/TelegramBot.py
```

### 5.3 Systemd Services (für Autostart)

```bash
# Agent Service
sudo nano /etc/systemd/system/job-agent.service
```

```ini
[Unit]
Description=Job Application Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/openclaw-job-application-agent
ExecStart=/usr/bin/node src/agent/MainLoop.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren
sudo systemctl enable job-agent
sudo systemctl start job-agent
sudo systemctl status job-agent
```

---

## Schritt 6: Job-Alerts einrichten

### 6.1 StepStone

1. https://www.stepstone.de/
2. Suche: "Junior Backend Developer Hamburg"
3. "Job-Agent erstellen"
4. E-Mail: Deine dedizierte Bewerbungs-E-Mail
5. Frequenz: Täglich

### 6.2 LinkedIn

1. https://www.linkedin.com/jobs/
2. Suche: "Software Developer Hamburg"
3. "Job-Alarm erstellen"
4. E-Mail: Deine dedizierte Bewerbungs-E-Mail

### 6.3 Indeed

1. https://de.indeed.com/
2. Suche: "Fachinformatiker Anwendungsentwicklung Hamburg"
3. "Job-Alarm erstellen"
4. E-Mail: Deine dedizierte Bewerbungs-E-Mail

---

## Schritt 7: Ersten Test durchführen

### 7.1 Environment validieren

```bash
node -e "require('./src/utils/EnvironmentValidator').validate()"
```

### 7.2 Telegram Bot testen

Sende an deinen Bot:
```
/status
```

**Erwartete Antwort:**
```
📊 Bewerbungs-Status:

Pending Review: 0
Approved: 0
Sent: 0

Keine Bewerbungen in der Warteschlange.
```

### 7.3 Manuelle Ausführung

```bash
# Einmal manuell ausführen
node src/agent/MainLoop.js --once
```

**Erwarteter Output:**
```
🚀 Job Application Agent starting...
✅ Environment validation passed
🔄 Starting cycle 1...
📧 Checking email for job alerts...
🔍 Searching job portals...
✅ Cycle complete: 0 new applications
```

---

## Schritt 8: Monitoring einrichten

### 8.1 Logs überwachen

```bash
# Docker
docker-compose logs -f agent-service

# Native
tail -f /app/logs/agent.log
```

### 8.2 Healthcheck-Monitoring

**Cron-Job für Healthcheck:**
```bash
crontab -e
```

```cron
# Healthcheck alle 5 Minuten
*/5 * * * * curl -f http://localhost:3000/health || echo "Agent unhealthy" | mail -s "Agent Alert" deine-email@example.com
```

### 8.3 Error-Monitoring

```bash
# Letzte Errors anzeigen
curl http://localhost:3000/api/errors/recent
```

---

## Schritt 9: Backup einrichten

### 9.1 Automatisches Backup

```bash
# Backup-Script erstellen
nano /home/ubuntu/backup-agent.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data
tar -czf $BACKUP_DIR/agent-data-$DATE.tar.gz \
  /app/data \
  /app/logs \
  /home/ubuntu/Bewerbungen

# Keep only last 7 backups
ls -t $BACKUP_DIR/agent-data-*.tar.gz | tail -n +8 | xargs rm -f

echo "Backup completed: agent-data-$DATE.tar.gz"
```

```bash
chmod +x /home/ubuntu/backup-agent.sh

# Cron-Job für tägliches Backup
crontab -e
```

```cron
# Backup jeden Tag um 2 Uhr nachts
0 2 * * * /home/ubuntu/backup-agent.sh
```

---

## Schritt 10: Sicherheit härten

### 10.1 Firewall konfigurieren

```bash
# UFW installieren
sudo apt install ufw

# Nur SSH und Agent-API erlauben
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### 10.2 Credentials sichern

```bash
# Berechtigungen einschränken
chmod 600 .env
chmod 600 config/credentials.json
chmod 600 config/user_profile.json
```

### 10.3 Updates automatisieren

```bash
# Unattended Upgrades installieren
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Troubleshooting

### Problem: "Environment validation failed"

**Lösung:**
```bash
# Prüfe fehlende Variablen
node -e "require('./src/utils/EnvironmentValidator').validate()"

# Setze fehlende Variablen in .env
nano .env
```

---

### Problem: "GitHub service not initialized"

**Lösung:**
```bash
# Prüfe GitHub Token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Token neu erstellen falls ungültig
# https://github.com/settings/tokens
```

---

### Problem: "Telegram bot not responding"

**Lösung:**
```bash
# Prüfe Bot-Token
curl https://api.telegram.com/bot$TELEGRAM_BOT_TOKEN/getMe

# Prüfe Chat-ID
curl https://api.telegram.com/bot$TELEGRAM_BOT_TOKEN/getUpdates

# Telegram-Service neu starten
docker-compose restart telegram-bridge
```

---

### Problem: "Email connection failed"

**Lösung:**
```bash
# Gmail: App-Passwort verwenden, nicht normales Passwort
# https://myaccount.google.com/apppasswords

# IMAP aktivieren in Gmail-Einstellungen
# https://mail.google.com/mail/u/0/#settings/fwdandpop
```

---

## Wartung

### Wöchentlich

- ✅ Logs prüfen (`docker-compose logs`)
- ✅ Healthcheck Status prüfen (`curl /health`)
- ✅ Bewerbungs-Statistiken prüfen (`/stats` in Telegram)

### Monatlich

- ✅ Dependencies aktualisieren (`npm update`)
- ✅ Backups prüfen
- ✅ Disk-Space prüfen (`df -h`)

### Bei Bedarf

- ✅ GitHub-Cache refreshen (automatisch nach 24h)
- ✅ Logs rotieren (automatisch)
- ✅ User Profile aktualisieren

---

## Performance-Optimierung

### Ressourcen-Limits (Docker)

```yaml
# docker-compose.yml
services:
  agent-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Caching-Optimierung

```javascript
// config/settings.json
{
  "cache": {
    "githubCacheDuration": 86400000, // 24h
    "jobCacheDuration": 3600000       // 1h
  }
}
```

---

## Zusammenfassung

✅ **System ist production-ready!**

**Was du jetzt hast:**
- ✅ Vollständig konfiguriertes System
- ✅ Automatische Überwachung (Healthchecks)
- ✅ Error Handling mit Retry-Logik
- ✅ Strukturiertes Logging
- ✅ Automatische Backups
- ✅ Sicherheits-Härtung

**Nächste Schritte:**
1. Warte auf erste Job-Alerts (E-Mail)
2. Agent findet automatisch passende Stellen
3. Du erhältst Telegram-Benachrichtigung
4. Prüfe und genehmige via `/approve all`
5. Versende mit `/send`

**Support:**
- Dokumentation: `/docs`
- GitHub Issues: https://github.com/tibo47-161/openclaw-job-application-agent/issues
- Logs: `/app/logs/agent.log`

---

**Erstellt am 07. Februar 2026**  
**Version: 2.0.0 - Production-Ready**
