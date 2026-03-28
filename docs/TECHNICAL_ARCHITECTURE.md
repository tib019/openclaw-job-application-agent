# Technische Architektur: Docker-basiertes Multi-Service-System

**Datum:** 07. Februar 2026
**Autor:** Manus AI

## 1. Architektur-Übersicht

Der **OpenClaw Job Application Agent** wird als **Multi-Container-System** mit Docker Compose implementiert. Diese Architektur trennt die Verantwortlichkeiten klar, ermöglicht unabhängige Skalierung und maximiert die Sicherheit durch Isolation.

## 2. Service-Architektur

Das System besteht aus drei Haupt-Services, die über ein internes Docker-Netzwerk kommunizieren.

```

 Docker Host (Dein PC)


 Docker Network: job-agent-network


 agent-service telegram-bridge
 (OpenClaw Core) (Python Bot)

 • Skills • Telegram API
 • Memory • Command Parser
 • Queue Manager


 Telegram
 Messages



 Remote WebDriver


 browser-service
 (Selenium Chrome)

 • LinkedIn
 • Job Portals





 Volumes (Persistenz)

 •./data → Bewerbungen
 •./logs → Log-Dateien
 •./config → Konfiguration





                                  Internet
                                (Telegram API)
```

## 3. Service-Details

### 3.1 Agent Service (`agent-service`)

**Basis-Image:** `node:22-alpine` oder `python:3.11-slim`

**Verantwortlichkeiten:**
- Ausführung des OpenClaw-Core-Agenten
- Verwaltung des Memory-Systems (`MEMORY.md`)
- Ausführung aller Skills (Sourcing, Parsing, Document Generation, Execution)
- Verwaltung der Application Queue (JSON-Datei oder SQLite)
- Bereitstellung einer internen REST-API für den Telegram-Bridge-Service

**Exponierte Ports:**
- `8080` (intern): REST-API für Telegram-Bridge

**Volumes:**
- `./data:/app/data`: Persistierung der Bewerbungen und des Memory
- `./logs:/app/logs`: Log-Dateien
- `./config:/app/config`: Konfigurationsdateien (read-only)

**Umgebungsvariablen:**
- `LOOP_INTERVAL_HOURS`: Intervall für den autonomen Loop (Standard: 4)
- `BROWSER_SERVICE_URL`: URL zum Selenium-Container (`http://browser-service:4444`)

### 3.2 Telegram Bridge Service (`telegram-bridge`)

**Basis-Image:** `python:3.11-slim`

**Verantwortlichkeiten:**
- Hosting des Telegram-Bots (via `python-telegram-bot`-Bibliothek)
- Parsing der Benutzer-Befehle (`/status`, `/approve`, `/send` etc.)
- Kommunikation mit dem Agent-Service über dessen REST-API
- Formatierung der Agent-Antworten für Telegram (Text, Inline-Keyboards)

**Exponierte Ports:**
- Keine (kommuniziert nur ausgehend mit Telegram und intern mit dem Agent-Service)

**Volumes:**
- `./config:/app/config`: Zugriff auf `credentials.json` für den Telegram-Bot-Token (read-only)

**Umgebungsvariablen:**
- `AGENT_API_URL`: URL zur Agent-Service-API (`http://agent-service:8080`)
- `TELEGRAM_BOT_TOKEN`: Wird aus `credentials.json` gelesen

### 3.3 Browser Service (`browser-service`)

**Basis-Image:** `selenium/standalone-chrome:latest`

**Verantwortlichkeiten:**
- Bereitstellung einer Headless-Chrome-Instanz
- Ausführung von Browser-Automatisierungs-Skripten für LinkedIn und Job-Portale
- Fernsteuerung durch den Agent-Service via Selenium WebDriver

**Exponierte Ports:**
- `4444` (intern): Selenium WebDriver-Endpunkt

**Volumes:**
- `./downloads:/home/seluser/Downloads`: Für heruntergeladene Dateien (falls benötigt)

**Besonderheiten:**
- Läuft im `--shm-size=2g`-Modus, um Speicherprobleme bei Chrome zu vermeiden

## 4. Kommunikationsfluss: Beispiel `/send`-Befehl

1.  **Benutzer sendet `/send` in Telegram.**
2.  **Telegram-Bridge-Service** empfängt den Befehl und parst ihn.
3.  **Telegram-Bridge** sendet einen `POST`-Request an `http://agent-service:8080/api/send`.
4.  **Agent-Service** empfängt den Request, holt alle Bewerbungen im Status `APPROVED` aus der Queue.
5.  **Agent-Service** führt für jede Bewerbung den entsprechenden Execution-Skill aus:
    -   `EmailSenderSkill`: Sendet E-Mail direkt.
    -   `LinkedInApplierSkill`: Verbindet sich mit `http://browser-service:4444`, steuert den Browser und führt die Bewerbung durch.
6.  **Agent-Service** aktualisiert den Status der Bewerbungen auf `SENT` und protokolliert das Ergebnis im Memory.
7.  **Agent-Service** sendet eine Response an den Telegram-Bridge: `{"success": true, "sent": 5, "failed": 0}`.
8. **Telegram-Bridge** formatiert die Antwort und sendet sie an den Benutzer: `" 5 Bewerbungen erfolgreich versendet!"`.

## 5. Docker-Compose-Konfiguration (Entwurf)

Die Datei `docker-compose.yml` im Projekt-Root würde wie folgt aussehen:

```yaml
version: '3.8'

services:
  agent-service:
    build:
      context: .
      dockerfile: docker/Dockerfile.agent
    container_name: job-agent-core
    environment:
      - LOOP_INTERVAL_HOURS=4
      - BROWSER_SERVICE_URL=http://browser-service:4444
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config:ro
    networks:
      - job-agent-network
    depends_on:
      - browser-service
    restart: unless-stopped

  telegram-bridge:
    build:
      context: .
      dockerfile: docker/Dockerfile.telegram
    container_name: job-agent-telegram
    environment:
      - AGENT_API_URL=http://agent-service:8080
    volumes:
      - ./config:/app/config:ro
    networks:
      - job-agent-network
    depends_on:
      - agent-service
    restart: unless-stopped

  browser-service:
    image: selenium/standalone-chrome:latest
    container_name: job-agent-browser
    shm_size: 2g
    ports:
      - "4444:4444"  # Optional: Für Debugging von außen zugänglich
    networks:
      - job-agent-network
    restart: unless-stopped

networks:
  job-agent-network:
    driver: bridge
```

## 6. Vorteile dieser Architektur

-   **Sicherheit:** Jeder Service ist isoliert. Ein Fehler im Browser-Service kann den Agent-Service nicht direkt kompromittieren.
-   **Wartbarkeit:** Jeder Service kann unabhängig entwickelt, getestet und aktualisiert werden.
-   **Skalierbarkeit:** Sollte die Last steigen (z.B. viele parallele LinkedIn-Bewerbungen), können wir einfach mehrere Browser-Service-Instanzen starten.
-   **Portabilität:** Das gesamte System kann mit einem einzigen `docker-compose up -d` auf jedem Rechner mit Docker gestartet werden.

## 7. Nächste Schritte

1.  Erstellung der `Dockerfile.agent` und `Dockerfile.telegram`.
2.  Implementierung der REST-API im Agent-Service.
3.  Implementierung des Telegram-Bots im Bridge-Service.
4.  Testing der Service-zu-Service-Kommunikation.
