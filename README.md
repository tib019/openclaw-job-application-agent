# OpenClaw Job Application Agent

Ein intelligenter, auf OpenClaw basierender Agent für die teilautomatisierte Suche und Bewerbung auf Entwicklerstellen mit Fokus auf E-Mail- und LinkedIn-basierte Prozesse.

## 🌟 Übersicht

Dieses Projekt zielt darauf ab, den Bewerbungsprozess für Softwareentwickler durch den Einsatz eines autonomen KI-Agenten zu optimieren. Der Agent automatisiert die mühsamen und repetitiven Aufgaben der Jobsuche und der Erstellung von Bewerbungsunterlagen, während der Benutzer die volle Kontrolle und die endgültige Entscheidung behält ("Human-in-the-Loop").

Der strategische Fokus liegt auf der Vermeidung von komplexen Web-Formularen und CAPTCHAs durch die Priorisierung von Bewerbungen per E-Mail und über die "Einfache Bewerbung"-Funktion von LinkedIn.

## ✨ Features

- **Intelligentes Job Sourcing:** Überwacht Job-Alerts in einem dedizierten E-Mail-Postfach und durchsucht aktiv die LinkedIn-Jobbörse.
- **Strategische Filterung:** Priorisiert Stellen nach der Einfachheit und Robustheit des Bewerbungskanals (E-Mail > LinkedIn > Bekannte ATS).
- **Dynamische Dokumentenerstellung:** Generiert maßgeschneiderte Anschreiben und Lebensläufe, die auf die jeweilige Stellenanzeige zugeschnitten sind.
- **Sicherer "Human-in-the-Loop"-Workflow:** Der Agent bereitet alles vor, aber **versendet nichts** ohne die explizite Freigabe des Benutzers.
- **Modulare Skill-Architektur:** Nutzt ein erweiterbares System von Skills für verschiedene Aufgaben (E-Mail-Verarbeitung, LinkedIn-Interaktion, ATS-spezifische Automatisierung).
- **Bewerbungs-Tracking:** Protokolliert alle Aktionen im persistenten Gedächtnis und setzt automatische Erinnerungen zum Nachfassen.

## 🏗️ Architektur-Konzept

Der Agent basiert auf der OpenClaw-Architektur und erweitert diese um eine Reihe von spezialisierten Skills. Das System ist in mehrere logische Komponenten unterteilt:

1.  **Core Agent (OpenClaw):** Der zentrale Daemon, der die Skills ausführt, das Gedächtnis verwaltet und die grundlegenden KI-Fähigkeiten bereitstellt.
2.  **Sourcing Skills:**
    - `EmailReaderSkill`: Überwacht den Posteingang auf neue Job-Alerts und extrahiert die relevanten Informationen.
    - `LinkedInSearchSkill`: Führt gezielte Suchen auf LinkedIn durch und identifiziert passende Stellen.
3.  **Processing Skills:**
    - `JobParserSkill`: Analysiert eine Stellenanzeige und extrahiert Schlüsselanforderungen, Technologien und die Bewerbungsmethode.
    - `DocumentGeneratorSkill`: Erstellt Anschreiben und Lebenslauf basierend auf Vorlagen und den extrahierten Job-Details.
4.  **Execution Skills:**
    - `EmailSenderSkill`: Interagiert mit einem Mail-Client, um E-Mail-Bewerbungen vorzubereiten und zu versenden (nach Freigabe).
    - `LinkedInApplierSkill`: Steuert den Browser, um den "Einfache Bewerbung"-Prozess auf LinkedIn auszufüllen.
    - `AtsGreenhouseSkill`, `AtsWorkdaySkill`, etc.: Modulare, hochspezialisierte Skills zur Interaktion mit bekannten Bewerbermanagementsystemen (ATS).
5.  **Memory & Tracking:**
    - Das `MEMORY.md` von OpenClaw wird genutzt, um jede Bewerbung, jeden Kontakt und jede Antwort zu protokollieren.
    - Der `Scheduler` wird verwendet, um Follow-up-Erinnerungen zu erstellen.

## 🚀 Setup & Installation

*(Detaillierte Anweisungen werden hier hinzugefügt, sobald die grundlegende Implementierung steht.)*

1.  **Voraussetzungen:**
    - Node.js 22+
    - Python 3.11+
    - Ein dediziertes E-Mail-Konto (z.B. über Gmail, Outlook)
    - Ein LinkedIn-Konto

2.  **Installation:**
    ```bash
    git clone https://github.com/tibo47-161/openclaw-job-application-agent.git
    cd openclaw-job-application-agent
    npm install
    ```

3.  **Konfiguration:**
    - Konfigurieren der Zugangsdaten für das E-Mail- und LinkedIn-Konto in der `config/credentials.json`.
    - Anpassen der Bewerbungsvorlagen in `src/templates/`.

## 🗺️ Roadmap

-   [ ] **Phase 1: Grundgerüst & Sourcing**
    -   [ ] Implementierung des `EmailReaderSkill`.
    -   [ ] Implementierung des `LinkedInSearchSkill`.
    -   [ ] Aufbau der grundlegenden Projektstruktur und Konfiguration.
-   [ ] **Phase 2: Dokumentenerstellung & E-Mail-Versand**
    -   [ ] Entwicklung des `JobParserSkill`.
    -   [ ] Entwicklung des `DocumentGeneratorSkill` mit anpassbaren Vorlagen.
    -   [ ] Implementierung des `EmailSenderSkill` und des Freigabe-Workflows.
-   [ ] **Phase 3: LinkedIn-Integration & ATS-Skills**
    -   [ ] Entwicklung des `LinkedInApplierSkill`.
    -   [ ] Entwicklung des ersten modularen ATS-Skills (z.B. `AtsGreenhouseSkill`).
-   [ ] **Phase 4: Testing & Optimierung**
    -   [ ] Aufbau einer Testsuite.
    -   [ ] Optimierung der Prompts und der Zuverlässigkeit des Agenten.

## 🤝 Contributing

Beiträge sind willkommen! Bitte erstelle ein Issue, um neue Features oder Bugs zu diskutieren.

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
