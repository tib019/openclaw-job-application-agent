# Setup-Anleitung - OpenClaw Job Application Agent

**Version:** 1.0.0 (MVP)  
**Datum:** 07. Februar 2026

---

## Voraussetzungen

### System
- **Docker** 20.10+ und **Docker Compose** 2.0+
- **Node.js** 22+ (für lokale Entwicklung)
- **Python** 3.11+ (für lokale Entwicklung)
- **Git**

### Accounts & Credentials
- Dedizierte E-Mail-Adresse für Bewerbungen (Gmail, Outlook, etc.)
- Telegram Bot Token (von @BotFather)
- Telegram Chat ID (deine persönliche Chat ID)
- GitHub Token (für Repository-Analyse)
- OpenAI API Key (für LLM-Features)

---

## Schritt 1: Repository klonen

```bash
git clone https://github.com/tibo47-161/openclaw-job-application-agent.git
cd openclaw-job-application-agent
```

---

## Schritt 2: Verzeichnisse vorbereiten

Erstelle die notwendigen Verzeichnisse auf deinem Host-System:

```bash
# Bewerbungsordner (hier werden alle Bewerbungen gespeichert)
mkdir -p ~/Bewerbungen

# Dokumente-Ordner (für Master-Lebenslauf etc.)
mkdir -p ~/Dokumente/Bewerbung

# Downloads-Ordner (falls noch nicht vorhanden)
mkdir -p ~/Downloads
```

---

## Schritt 3: Credentials konfigurieren

### 3.1 Credentials-Datei erstellen

```bash
cp config/credentials.example.json config/credentials.json
```

### 3.2 Credentials eintragen

Öffne `config/credentials.json` und trage deine Daten ein:

```json
{
  "email": {
    "address": "deine.bewerbungen@gmail.com",
    "password": "dein-app-passwort",
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "deine.bewerbungen@gmail.com",
        "pass": "dein-app-passwort"
      }
    }
  },
  "telegram": {
    "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "chatId": "123456789"
  },
  "openai": {
    "apiKey": "sk-..."
  },
  "github": {
    "token": "ghp_..."
  }
}
```

**Wichtig für Gmail:**
- Aktiviere "2-Faktor-Authentifizierung"
- Erstelle ein "App-Passwort" unter https://myaccount.google.com/apppasswords
- Nutze das App-Passwort statt deines normalen Passworts

---

## Schritt 4: User Profile konfigurieren

Öffne `config/user_profile.json` und trage deine persönlichen Daten ein:

```json
{
  "name": "Dein Name",
  "email": "deine.email@example.com",
  "phone": "+49 XXX XXXXXXX",
  "currentPosition": {
    "title": "QA Engineer",
    "company": "Hosenso",
    "startDate": "2026-01"
  },
  "skills": {
    "programmingLanguages": [
      { "name": "Java", "level": "Intermediate" },
      { "name": "Python", "level": "Beginner" }
    ]
  }
  // ... weitere Daten
}
```

---

## Schritt 5: Telegram Bot erstellen

### 5.1 Bot erstellen

1. Öffne Telegram und suche nach **@BotFather**
2. Sende `/newbot`
3. Wähle einen Namen: z.B. "Job Application Agent"
4. Wähle einen Username: z.B. "my_job_agent_bot"
5. Kopiere den **Bot Token** (sieht aus wie `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 5.2 Chat ID herausfinden

1. Sende eine Nachricht an deinen Bot (z.B. `/start`)
2. Öffne im Browser: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
3. Suche nach `"chat":{"id":123456789` - das ist deine Chat ID

---

## Schritt 6: Docker-Container starten

### 6.1 Environment-Variablen setzen

Erstelle eine `.env`-Datei im Projekt-Root:

```bash
# Email
EMAIL_ADDRESS=deine.bewerbungen@gmail.com
EMAIL_PASSWORD=dein-app-passwort
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=deine.bewerbungen@gmail.com
SMTP_PASS=dein-app-passwort
EMAIL_FROM_NAME=Dein Name
EMAIL_FROM_ADDRESS=deine.bewerbungen@gmail.com

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# OpenAI
OPENAI_API_KEY=sk-...

# GitHub
GITHUB_TOKEN=ghp_...

# Agent
AGENT_INTERVAL_HOURS=4
BROWSER_SERVICE_URL=http://browser-service:4444
AGENT_API_URL=http://agent-service:3000
```

### 6.2 Docker-Container bauen und starten

```bash
docker-compose up -d --build
```

### 6.3 Logs überprüfen

```bash
# Alle Services
docker-compose logs -f

# Nur Agent
docker-compose logs -f agent-service

# Nur Telegram Bot
docker-compose logs -f telegram-bridge
```

---

## Schritt 7: Telegram Bot testen

1. Öffne Telegram und suche deinen Bot
2. Sende `/start`
3. Du solltest eine Willkommensnachricht erhalten
4. Teste `/status` - sollte die Queue-Statistiken anzeigen

---

## Schritt 8: Ersten Test-Lauf durchführen

### Option A: Automatisch warten (4 Stunden)

Der Agent läuft automatisch alle 4 Stunden. Warte einfach ab.

### Option B: Manuell triggern

```bash
# In den Agent-Container einsteigen
docker exec -it openclaw-agent-service bash

# Agent manuell ausführen
node src/agent/MainLoop.js
```

---

## Workflow-Übersicht

```
1. Agent läuft alle 4 Stunden
   ↓
2. Prüft E-Mail-Posteingang auf Job-Alerts
   ↓
3. Extrahiert Job-URLs
   ↓
4. Parst jede Stellenanzeige (Selenium + LLM)
   ↓
5. Filtert nach Match-Score (≥50) und Bewerbungsmethode
   ↓
6. Generiert Anschreiben + Lebenslauf (LLM + GitHub-Analyse)
   ↓
7. Speichert in ~/Bewerbungen/DATUM_FIRMA_POSITION/
   ↓
8. Fügt zur Queue hinzu (Status: PENDING_REVIEW)
   ↓
9. Sendet Telegram-Benachrichtigung
   ↓
10. DU prüfst via Telegram (/list pending, /view <id>)
   ↓
11. DU gibst frei (/approve <id> oder /approveall)
   ↓
12. DU triggerst Versand (/send)
   ↓
13. Agent versendet alle freigegebenen Bewerbungen per E-Mail
   ↓
14. Status wird auf SENT gesetzt
```

---

## Telegram-Befehle (Kurzreferenz)

| Befehl | Beschreibung |
|:-------|:-------------|
| `/start` | Willkommensnachricht |
| `/status` | Queue-Status anzeigen |
| `/list pending` | Ausstehende Bewerbungen anzeigen |
| `/view <id>` | Bewerbung im Detail ansehen |
| `/approve <id>` | Einzelne Bewerbung freigeben |
| `/approveall` | Alle ausstehenden freigeben |
| `/reject <id>` | Bewerbung ablehnen |
| `/send` | Alle freigegebenen Bewerbungen versenden |
| `/stats` | Detaillierte Statistiken |
| `/help` | Alle Befehle anzeigen |

---

## Troubleshooting

### Problem: Agent findet keine E-Mails

**Lösung:**
1. Prüfe IMAP-Credentials in `config/credentials.json`
2. Stelle sicher, dass IMAP aktiviert ist (Gmail: Einstellungen → Weiterleitung und POP/IMAP)
3. Prüfe Logs: `docker-compose logs agent-service`

### Problem: Telegram Bot antwortet nicht

**Lösung:**
1. Prüfe Bot Token und Chat ID in `.env`
2. Sende `/start` an den Bot
3. Prüfe Logs: `docker-compose logs telegram-bridge`

### Problem: LLM-Calls schlagen fehl

**Lösung:**
1. Prüfe OpenAI API Key in `.env`
2. Stelle sicher, dass du Guthaben hast
3. Prüfe Logs für Fehler-Details

### Problem: Selenium-Browser startet nicht

**Lösung:**
1. Prüfe ob browser-service läuft: `docker-compose ps`
2. Starte neu: `docker-compose restart browser-service`
3. Prüfe Logs: `docker-compose logs browser-service`

### Problem: Dateien werden nicht gespeichert

**Lösung:**
1. Prüfe Volume-Mounts in `docker-compose.yml`
2. Stelle sicher, dass `~/Bewerbungen` existiert
3. Prüfe Berechtigungen: `ls -la ~/Bewerbungen`

---

## Sicherheitshinweise

### Best Practices

1. **Dedizierte E-Mail:** Nutze eine separate E-Mail nur für Bewerbungen
2. **App-Passwörter:** Nutze App-Passwörter statt echten Passwörtern
3. **Credentials nicht committen:** `config/credentials.json` ist in `.gitignore`
4. **Regelmäßige Backups:** Sichere `~/Bewerbungen` regelmäßig
5. **Logs prüfen:** Überwache die Logs auf Fehler

###  Risiken

1. **E-Mail-Credentials:** Agent hat Zugriff auf deine E-Mail
2. **Automatischer Versand:** Bewerbungen werden automatisch versendet (nach Freigabe)
3. **LLM-Kosten:** Jede Bewerbung kostet ~$0.05 an OpenAI-Credits

---

## Nächste Schritte

Nach erfolgreichem Setup:

1. **Job-Alerts einrichten:** Richte Job-Alerts bei StepStone, LinkedIn, Indeed ein
2. **Master-Lebenslauf erstellen:** Lege `~/Dokumente/Bewerbung/Lebenslauf_Master.md` an
3. **Erste Bewerbungen prüfen:** Warte auf erste Benachrichtigungen und prüfe Qualität
4. **Feintuning:** Passe Filter und Prompts nach Bedarf an

---

**Viel Erfolg mit deinem automatisierten Bewerbungsagenten!**
