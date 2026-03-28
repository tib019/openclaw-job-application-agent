# OpenClaw Job Application Agent

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

Ein intelligenter, autonomer Agent, der passende Stellen sucht, individuelle Bewerbungen erstellt und den gesamten Prozess über Telegram steuerbar macht.

## Projektübersicht

Der **OpenClaw Job Application Agent** ist ein autonomes System, das den gesamten Bewerbungsprozess automatisiert – von der Stellensuche über die Erstellung maßgeschneiderter Unterlagen bis hin zum Versand.

### Problemstellung

*   **Zeitaufwändige Jobsuche** auf verschiedenen Portalen
*   **Hoher Aufwand** für die Erstellung individueller Bewerbungsunterlagen
*   **Fehlende Übersicht** über den Status laufender Bewerbungen
*   **Ineffiziente Prozesse** im Bewerbungsmanagement

### Lösung

Ein autonomer Agent, der:

*   Automatisch Job-Portale durchsucht und E-Mail-Alerts überwacht
*   Stellenanzeigen analysiert und mit dem eigenen Profil abgleicht (Match-Scoring)
*   **Individuelle Anschreiben** mit LLMs generiert
*   **Passende GitHub-Projekte** intelligent auswählt und im Anschreiben erwähnt
*   Den gesamten Prozess über **Telegram** steuerbar macht
*   In einer sicheren **Docker-Umgebung** läuft

## Features

* **Autonome Jobsuche** auf 4 Portalen (StepStone, Indeed, etc.)
* **Intelligentes Match-Scoring** (0-100) zur Bewertung von Stellen
* **Dynamische Dokumentenerstellung** (LLM-basierte Anschreiben)
* **GitHub-Integration** zur automatischen Auswahl relevanter Projekte
* **Telegram-Steuerung** mit 10+ Befehlen (inkl. `/prompt` für natürliche Sprache)
* **Batch-Verarbeitung** (mehrere Bewerbungen auf einmal freigeben & versenden)
* **Sichere Docker-Umgebung** mit 3 Services (Agent, Telegram, Browser)
* **Umfassendes Monitoring** mit Health Checks und strukturiertem Logging
* **Production-Ready** mit 90+ Unit Tests und robustem Error Handling

## ️ Technologie-Stack

| Kategorie | Technologie |
|:----------|:------------|
| **Backend** | Node.js, Python |
| **KI** | OpenAI GPT-4.1-mini, Function Calling |
| **Automatisierung** | Selenium, Nodemailer, IMAP |
| **Datenbank** | JSON-basierte File-System-DB |
| **Deployment** | Docker, Docker-Compose |
| **API** | REST (Express.js) |
| **Kommunikation** | Telegram Bot API |
| **Testing** | Jest |

## Projektstruktur

    openclaw-job-application-agent/
 config/ # Konfigurationsdateien
 data/ # Bewerbungsdaten (Queue, Logs)
 docs/ # Projektdokumentation
 src/
 agent/ # Agent Main Loop
 api/ # REST API
 services/ # GitHub, Prompt Service
 skills/ # Kern-Skills
 telegram/ # Telegram Bot
 utils/ # Utilities (Logger, ErrorHandler)
 tests/ # Unit Tests
.env.example # Environment-Template
 docker-compose.yml # Docker-Setup
 README.md # Diese Datei

## Installation & Verwendung

Die vollständige Anleitung befindet sich im **[Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md)**.

### Kurzanleitung

1.  **Repository klonen**
    ```bash
    git clone git@github.com:tibo47-161/openclaw-job-application-agent.git
    cd openclaw-job-application-agent
    ```

2.  **Konfiguration**
    ```bash
    cp .env.example .env
    nano .env  # Zugangsdaten eintragen
    ```

3.  **Starten**
    ```bash
    docker-compose up -d
    ```

4.  **Verwenden**
    - Sende `/status` an deinen Telegram Bot
    - Warte auf Benachrichtigungen über neue Jobs
    - Gib Bewerbungen mit `/approve all` frei
    - Versende mit `/send`

## Sicherheit

### Implementierte Sicherheitsmaßnahmen

* **Docker-Isolation** aller Services
* **Environment Variables** für alle Credentials
* **Read-Only Volumes** für Master-Dokumente
* **Firewall-Regeln** (minimal ports)
* **Masked Logging** (keine Credentials in Logs)
* **Automatisierte Backups**

## Projekterfolg

### Messbare Ergebnisse

*   ⏱️ **~95% Zeitersparnis** pro Bewerbung (ca. 28 von 30 Minuten)
* **5x mehr Bewerbungen** durch autonome Suche
* **100% individuelle Anschreiben** durch LLM-Generierung
* **Erhöhte Relevanz** durch GitHub-Integration

### Technische Achievements

*   Entwicklung eines vollautonomen, intelligenten Agenten
*   Implementierung von LLM Function Calling für natürliche Sprachsteuerung
*   Sichere Docker-Architektur mit 3 Services
*   Umfassendes Testing mit 90+ Unit Tests

## Lernziele & Kompetenzen

Dieses Projekt demonstriert folgende Fähigkeiten:

*   **KI-Entwicklung**: LLMs, Prompt Engineering, Function Calling
*   **System-Architektur**: Microservices, Docker, REST APIs
*   **Automatisierung**: Web Scraping, E-Mail-Automatisierung
*   **Sicherheit**: Docker-Isolation, Credential Management
*   **Projektmanagement**: Agile Entwicklung, Dokumentation, Testing
*   **DevOps**: Docker, CI/CD (geplant), Monitoring

## Dokumentation

Die vollständige Projektdokumentation befindet sich im `docs/` Ordner und umfasst:

*   **[Architektur-Dokumentation](docs/ARCHITECTURE.md)**
*   **[Technische Projektdokumentation](docs/TECHNICAL_PROJECT_DOCUMENTATION.md)**
*   **[API-Dokumentation](docs/API_DOCUMENTATION.md)**
*   **[Sicherheitskonzept](docs/SECURITY_CONCEPT.md)**
*   **[Benutzerhandbuch](docs/USER_MANUAL.md)**
*   **[Test-Dokumentation](docs/TESTING.md)**
*   **[Deployment-Guide](docs/PRODUCTION_DEPLOYMENT.md)**

## Über das Projekt

Dieses Projekt ist eine private Initiative zur Vertiefung meiner Kenntnisse in den Bereichen KI, Automatisierung und System-Architektur.

## ‍ Entwickler

**Tobias Heiko Buß**

* Email: [tobias.buss.dev@gmail.com](mailto:tobias.buss.dev@gmail.com)
* GitHub: [@tibo47-161](https://github.com/tibo47-161)
* Hamburg, Deutschland

## Danksagung

Besonderer Dank gilt der **GFN Hamburg** für die fundierte Ausbildung zum Fachinformatiker für Anwendungsentwicklung, die die Grundlage für solche Projekte gelegt hat.

 **Wenn dir dieses Projekt gefällt, lass gerne einen Stern da!**

_Entwickelt mit ️ in Hamburg_
