# Architektur-Dokumentation

## 1. Philosophische Grundlagen

Die Architektur des **OpenClaw Job Application Agent** folgt drei Kernprinzipien:

1.  **Sicherheit durch Isolation und Kontrolle:** Der Agent darf niemals unkontrolliert agieren. Jede externe Aktion (insbesondere das Versenden von Daten) erfordert eine explizite Freigabe durch den Benutzer ("Human-in-the-Loop"). Die Nutzung einer dedizierten E-Mail-Adresse isoliert den Prozess von privaten Daten.

2.  **Robustheit durch Spezialisierung:** Statt zu versuchen, die unendliche Vielfalt des offenen Webs zu beherrschen, konzentriert sich der Agent auf wenige, aber robuste und standardisierte Kanäle (E-Mail, LinkedIn). Komplexität wird nicht bekämpft, sondern vermieden.

3.  **Modularität durch Skill-basierte Erweiterung:** Jede Fähigkeit des Agenten ist in einem eigenen, in sich geschlossenen "Skill" gekapselt. Dies ermöglicht eine einfache Wartung, Testbarkeit und Erweiterung des Systems.

## 2. System-Diagramm

```mermaid
graph TD
    subgraph User Interaction
        A[Benutzer] -- "Starte Jobsuche" --> B(Core Agent)
        B -- "Freigabe erforderlich" --> A
        A -- "OK" --> B
    end

    subgraph Sourcing & Parsing
        C[EmailReaderSkill] -- "Liest Job-Alerts" --> D{Job-Queue}
        E[LinkedInSearchSkill] -- "Findet LinkedIn-Jobs" --> D
        B -- "Nächster Job" --> D
        D -- "Job-Details" --> F[JobParserSkill]
        F -- "Strukturierte Daten" --> B
    end

    subgraph Document Generation
        G[DocumentGeneratorSkill] -- "Erstellt Anschreiben & CV" --> H{Generierte Dokumente}
        B -- "Erstelle Dokumente für Job X" --> G
        I[Vorlagen] -- "Markdown Templates" --> G
    end

    subgraph Execution (nach Freigabe)
        B -- "Sende E-Mail" --> J[EmailSenderSkill]
        B -- "Bewirb dich auf LinkedIn" --> K[LinkedInApplierSkill]
        B -- "Nutze ATS-Skill" --> L[Modulare ATS-Skills]
        H -- "Anhänge" --> J
    end

    subgraph Memory
        M[Memory-System] -- "Protokolliert alle Aktionen" --> B
        B -- "Schreibe Log" --> M
    end
```

## 3. Komponenten im Detail

### Core Agent (OpenClaw)
-   **Verantwortlichkeit:** Orchestrierung der Skills, Verwaltung des Kurz- und Langzeitgedächtnisses, Interaktion mit dem LLM zur Entscheidungsfindung.
-   **Technologie:** OpenClaw Daemon, LLM (z.B. GPT-4.1-mini).

### Skill-Verzeichnis (`src/skills/`)

-   **`EmailReaderSkill`:**
    -   **Zweck:** Verbindet sich mit dem dedizierten IMAP-Postfach, sucht nach ungelesenen E-Mails von bekannten Job-Portalen (z.B. `jobs-noreply@stepstone.de`) und extrahiert die URLs zu den Stellenanzeigen.
    -   **Output:** Eine Liste von URLs, die zur Job-Queue hinzugefügt werden.

-   **`LinkedInSearchSkill`:**
    -   **Zweck:** Nutzt Browser-Automatisierung, um sich bei LinkedIn anzumelden, die Job-Suche mit vordefinierten Kriterien (z.B. "Softwareentwickler Hamburg") auszuführen und Stellen zu identifizieren, die entweder "Einfache Bewerbung" oder einen direkten Recruiter-Kontakt anbieten.
    -   **Output:** Eine Liste von LinkedIn-Job-URLs.

-   **`JobParserSkill`:**
    -   **Zweck:** Nimmt eine Job-URL entgegen, besucht die Seite und extrahiert mithilfe des LLM strukturierte Informationen: Firmenname, Position, geforderte Skills, Bewerbungsmethode (E-Mail-Adresse, ATS-Typ, etc.).
    -   **Output:** Ein JSON-Objekt mit den Job-Details.

-   **`DocumentGeneratorSkill`:**
    -   **Zweck:** Kombiniert die strukturierten Job-Daten mit den Master-Vorlagen (`src/templates/`) für Lebenslauf und Anschreiben. Ersetzt Platzhalter und passt die Skill-Liste und die Einleitung des Anschreibens dynamisch an.
    -   **Output:** Zwei Markdown-Dateien (`cover_letter.md`, `resume.md`).

-   **`EmailSenderSkill`:**
    -   **Zweck:** Nutzt einen Kommandozeilen-Mail-Client (z.B. `mutt` oder eine Python-Bibliothek), um eine E-Mail mit den generierten Dokumenten als Anhang zu verfassen und als Entwurf zu speichern oder nach Freigabe zu senden.
    -   **Output:** Status der E-Mail (gesendet/Entwurf).

-   **`Ats*Skill` (z.B. `AtsGreenhouseSkill`):**
    -   **Zweck:** Ein hochspezialisierter Skill, der die genauen Schritte zur Durchführung einer Bewerbung auf einer bestimmten ATS-Plattform kennt. Er füllt Felder aus, lädt Dokumente hoch und navigiert durch die Seiten.
    -   **Output:** Status der Bewerbung (erfolgreich/fehlgeschlagen).

### Daten-Verzeichnis (`data/`)
-   **`applications/`:** Hier werden die generierten Markdown-Dokumente für jede einzelne Bewerbung gespeichert, typischerweise in einem Unterordner pro Firma (z.B. `data/applications/hosenso/`).
-   **`resumes/`, `cover_letters/`:** Könnte für Master-Versionen oder spezifische Varianten genutzt werden.

### Konfigurations-Verzeichnis (`config/`)
-   **`credentials.json`:** Speichert sicher die Zugangsdaten für E-Mail und LinkedIn. **WICHTIG:** Diese Datei muss in `.gitignore` eingetragen sein, um ein versehentliches Pushen zu verhindern.
-   **`settings.json`:** Enthält allgemeine Einstellungen wie Suchbegriffe, Job-Portal-Adressen etc.

## 4. Sicherheitskonzept

-   **Credential Management:** Zugangsdaten werden ausschließlich in der `config/credentials.json` gespeichert und niemals im Code oder im Memory des Agenten hartcodiert. Die Datei wird durch `.gitignore` geschützt.
-   **Human-in-the-Loop:** Der kritischste Sicherheitspunkt. Der Agent darf keine Aktionen mit externer Wirkung (E-Mail-Versand, Bewerbung abschicken) ohne eine `ask`-Nachricht und die positive Bestätigung des Benutzers durchführen.
-   **Sandbox-Umgebung:** Der Agent läuft in einer isolierten Umgebung (z.B. Docker-Container oder dedizierter Benutzer), um den Zugriff auf das Host-System zu beschränken.
