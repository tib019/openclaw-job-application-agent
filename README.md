# OpenClaw Job Application Agent

Ein intelligenter, auf OpenClaw basierender Agent für die **autonome** Suche und Bewerbung auf Entwicklerstellen mit Fokus auf E-Mail- und LinkedIn-basierte Prozesse. Steuerbar über **Telegram** mit Batch-Versand-Funktion.

## 🌟 Übersicht

Dieses Projekt revolutioniert den Bewerbungsprozess für Softwareentwickler durch den Einsatz eines vollautonomen KI-Agenten. Der Agent läuft kontinuierlich im Hintergrund, sucht proaktiv nach passenden Stellen, erstellt maßgeschneiderte Bewerbungsunterlagen und sammelt diese in einer Warteschlange. Du behältst die volle Kontrolle durch eine intuitive Telegram-Schnittstelle und gibst gebündelte Bewerbungen mit einem einzigen Befehl frei.

Der strategische Fokus liegt auf der Vermeidung von komplexen Web-Formularen und CAPTCHAs durch die Priorisierung von Bewerbungen per E-Mail und über die "Einfache Bewerbung"-Funktion von LinkedIn.

## ✨ Features

### Autonomer Betrieb
- **Kontinuierlicher Loop:** Der Agent läuft automatisch alle 4 Stunden und sucht nach neuen Stellen.
- **Aktive Portal-Suche:** Durchsucht StepStone, Indeed, get-in-it.de und it-jobs.de proaktiv (bis zu 80 Stellen pro Durchlauf).
- **E-Mail-Monitoring:** Überwacht dedizierte Bewerbungs-E-Mail auf Job-Alerts.
- **Proaktives Sammeln:** Erstellt Bewerbungsunterlagen automatisch und legt sie zur Überprüfung bereit.
- **Intelligente Priorisierung:** Fokussiert sich auf die robustesten Bewerbungskanäle (E-Mail > LinkedIn > bekannte ATS).

### Telegram-Steuerung
- **Fernsteuerung per Messenger:** Steuere den Agenten von überall über einfache Telegram-Befehle.
- **Batch-Freigabe:** Überprüfe und genehmige mehrere Bewerbungen auf einmal mit `/approve all`.
- **One-Click-Versand:** Sende alle genehmigten Bewerbungen mit einem einzigen `/send`-Befehl.

**Verfügbare Befehle:**

| Befehl | Beschreibung |
|:-------|:-------------|
| `/status` | Zeigt alle Bewerbungen im Status "Pending Review" |
| `/review <ID>` | Zeigt Details einer spezifischen Bewerbung |
| `/approve <ID>` | Genehmigt eine einzelne Bewerbung |
| `/approve all` | Genehmigt alle wartenden Bewerbungen |
| `/reject <ID>` | Verwirft eine Bewerbung |
| `/send` | **GO-Befehl:** Versendet alle genehmigten Bewerbungen |
| `/stats` | Zeigt Statistiken (gesendete Bewerbungen, Antworten etc.) |

### Intelligente Features
- **Dynamische Dokumentenerstellung:** Maßgeschneiderte Anschreiben und Lebensläufe für jede Stelle.
- **Firmen-Recherche:** Integriert aktuelle News über die Firma ins Anschreiben für maximale Personalisierung.
- **Automatisches Follow-up:** Erstellt Nachfass-E-Mails für unbeantwortete Bewerbungen nach 7-10 Tagen.
- **Wöchentliches Reporting:** Sendet dir jeden Sonntag eine Zusammenfassung deiner Bewerbungsaktivitäten.
- **Keyword-Trend-Analyse:** Identifiziert die gefragtesten Skills in aktuellen Stellenanzeigen.

### Sicherheit & Kontrolle
- **Human-in-the-Loop:** Keine Bewerbung wird ohne deine explizite Freigabe versendet.
- **Dedizierte E-Mail:** Nutzt ein separates E-Mail-Konto zur Isolation von privaten Daten.
- **Modulare Skill-Architektur:** Erweiterbar und wartbar durch klare Trennung der Funktionen.

## 🏗️ Architektur-Konzept

Der Agent basiert auf der OpenClaw-Architektur und erweitert diese um eine Telegram-Bot-Schnittstelle und ein Application-Queue-System.

**Kernkomponenten:**

1. **Core Agent (OpenClaw):** Orchestriert die Skills und verwaltet das Gedächtnis.
2. **Telegram Bot:** Deine Fernbedienung für den Agenten.
3. **Application Queue:** Verwaltet Bewerbungen in drei Status: `PENDING_REVIEW`, `APPROVED`, `SENT`.
4. **Sourcing Skills:** `EmailReaderSkill`, `LinkedInSearchSkill`.
5. **Processing Skills:** `JobParserSkill`, `DocumentGeneratorSkill`, `CompanyResearchSkill`.
6. **Execution Skills:** `EmailSenderSkill`, `LinkedInApplierSkill`, modulare `Ats*Skills`.

**Workflow:**

```
Autonomer Loop (alle 4h)
    ↓
Job Sourcing (E-Mail + LinkedIn)
    ↓
Job Parsing & Filterung
    ↓
Dokumentenerstellung
    ↓
→ Application Queue (PENDING_REVIEW)
    ↓
Telegram-Benachrichtigung: "5 neue Bewerbungen bereit"
    ↓
Du: /approve all
    ↓
→ Application Queue (APPROVED)
    ↓
Du: /send
    ↓
Versand aller genehmigten Bewerbungen
    ↓
→ Application Queue (SENT)
```

## 🚀 Setup & Installation

### Voraussetzungen
- Node.js 22+
- Python 3.11+
- Ein dediziertes E-Mail-Konto (Gmail, Outlook etc.)
- Ein LinkedIn-Konto
- Ein Telegram-Konto

### Installation

1. **Repository klonen:**
   ```bash
   git clone https://github.com/tibo47-161/openclaw-job-application-agent.git
   cd openclaw-job-application-agent
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. **Telegram Bot erstellen:**
   - Öffne Telegram und suche nach `@BotFather`
   - Sende `/newbot` und folge den Anweisungen
   - Kopiere den erhaltenen Bot-Token

4. **Konfiguration:**
   - Kopiere `config/credentials.example.json` zu `config/credentials.json`
   - Trage deine Zugangsdaten ein:
     ```json
     {
       "email": {
         "address": "deine-bewerbungs-email@gmail.com",
         "password": "dein-app-passwort"
       },
       "linkedin": {
         "email": "dein-linkedin@email.com",
         "password": "dein-passwort"
       },
       "telegram": {
         "bot_token": "dein-telegram-bot-token",
         "chat_id": "deine-telegram-chat-id"
       }
     }
     ```

5. **Agent starten:**
   ```bash
   npm start
   ```

6. **Cron-Job einrichten (optional):**
   ```bash
   crontab -e
   # Füge hinzu: 0 */4 * * * cd /pfad/zum/projekt && npm run loop
   ```

## 🗺️ Roadmap

- [x] **Phase 0: Projektsetup**
  - [x] GitHub-Repository erstellen
  - [x] Projektstruktur aufbauen
  - [x] Dokumentation schreiben

- [ ] **Phase 1: Grundgerüst & Sourcing**
  - [ ] Implementierung des `EmailReaderSkill`
  - [ ] Implementierung des `LinkedInSearchSkill`
  - [ ] Aufbau der Application Queue

- [ ] **Phase 2: Dokumentenerstellung & Batch-System**
  - [ ] Entwicklung des `JobParserSkill`
  - [ ] Entwicklung des `DocumentGeneratorSkill`
  - [ ] Implementierung der Queue-Status-Verwaltung

- [ ] **Phase 3: Telegram-Integration**
  - [ ] Entwicklung des Telegram Bots
  - [ ] Implementierung aller Befehle (`/status`, `/approve`, `/send` etc.)
  - [ ] Benachrichtigungssystem

- [ ] **Phase 4: Execution & LinkedIn-Integration**
  - [ ] Implementierung des `EmailSenderSkill`
  - [ ] Entwicklung des `LinkedInApplierSkill`
  - [ ] Entwicklung des ersten modularen ATS-Skills

- [ ] **Phase 5: Advanced Features**
  - [ ] Wöchentliches Reporting
  - [ ] Automatisches Follow-up
  - [ ] Firmen-Recherche-Integration
  - [ ] Keyword-Trend-Analyse

## 📚 Dokumentation

- [Architektur-Dokumentation](docs/ARCHITECTURE.md)
- [Konzept V3: Autonomer Betrieb & Telegram-Steuerung](docs/CONCEPT_V3.md)

## 🤝 Contributing

Beiträge sind willkommen! Bitte erstelle ein Issue, um neue Features oder Bugs zu diskutieren.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
