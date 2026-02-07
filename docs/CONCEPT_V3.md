# Konzept V3: Der autonome, Messenger-gesteuerte Bewerbungsagent

**Datum:** 07. Februar 2026
**Autor:** Manus AI

## 1. Paradigmenwechsel: Von manuellem Start zu autonomem Betrieb mit Fernsteuerung

Deine neuen Anforderungen heben das Projekt auf die nächste Stufe. Wir bewegen uns weg von einem manuell gestarteten Skript hin zu einem **autonom laufenden Agenten**, der proaktiv agiert und über eine einfache, intuitive Messenger-Schnittstelle (Telegram) gesteuert wird. Der "Human-in-the-Loop" bleibt als finale Freigabeinstanz erhalten, wird aber durch ein **Batch-System** deutlich effizienter.

**Die neue Kernphilosophie:** Der Agent arbeitet im Hintergrund wie ein persönlicher Assistent, sammelt und bereitet alles vor und präsentiert dem Benutzer gebündelte, entscheidungsreife Pakete.

## 2. Architektur-Erweiterung: Die Messenger-Brücke

Die Architektur wird um eine entscheidende Komponente erweitert: einen **Telegram Bot**, der als Brücke zwischen dir und dem Core Agent dient.

**Entscheidung für Telegram:** Die Bot-API von Telegram ist extrem robust, einfach zu implementieren und ideal für die 1-zu-1-Kommunikation mit dem Agenten. Dies ist weniger komplex als eine Discord-Integration.

### Aktualisiertes System-Diagramm

```mermaid
graph TD
    subgraph User Interaction via Telegram
        A[Benutzer] -- "/status" --> T(Telegram Bot)
        T -- "Zeige 5 neue Bewerbungen" --> A
        A -- "/approve all" --> T
        A -- "/send" --> T
    end

    subgraph Agent Core (Autonomer Loop)
        T -- "Kommando" --> B(Core Agent)
        B -- "Sammelt & bereitet vor" --> Q((Application Queue))
        B -- "Status-Update" --> T
    end

    subgraph Application Queue
        Q -- "Status: Pending" --> R{Pending Review}
        R -- "/approve" --> S{Approved}
        S -- "/send" --> B
        R -- "/reject" --> D[Rejected]
    end

    subgraph Execution (nach /send)
        B -- "Sendet alle aus 'Approved'" --> J[Execution Skills]
    end
```

## 3. Der neue, autonome Workflow

1.  **Autonomer Loop:** Der Agent läuft kontinuierlich (z.B. alle 4 Stunden via Cron-Job). In jedem Loop führt er die **Sourcing- und Parsing-Phasen** aus: Er checkt E-Mails, sucht auf LinkedIn und analysiert gefundene Stellen.

2.  **Sammeln im "Pending"-Status:** Statt dich für jede einzelne Stelle um Freigabe zu bitten, erstellt der Agent die Bewerbungsunterlagen und legt die fertige Bewerbung mit dem Status **`PENDING_REVIEW`** in eine Warteschlange (z.B. eine JSON-Datei oder eine simple Datenbank).

3.  **Gebündelte Benachrichtigung:** Sobald eine bestimmte Anzahl (z.B. 5) an neuen Bewerbungen im `PENDING_REVIEW`-Status ist, oder am Ende des Tages, sendet der Agent dir eine proaktive Nachricht über Telegram: `"Ich habe 5 neue Bewerbungen vorbereitet. Bereit zur Überprüfung?"`

4.  **Interaktive Steuerung per Telegram:** Du kannst nun mit einfachen Befehlen agieren:

| Telegram-Befehl | Aktion |
| :--- | :--- |
| `/status` | Zeigt eine Liste aller Bewerbungen im `PENDING_REVIEW`-Status (z.B. `ID: 1, Firma: Hosenso, Position: Junior Dev`). |
| `/review <ID>` | Sendet dir die Details zu einer Bewerbung: Firmenname, Link zur Ausschreibung und das generierte Anschreiben als Text. |
| `/approve <ID>` | Ändert den Status der Bewerbung auf `APPROVED`. |
| `/approve all` | Ändert den Status aller `PENDING_REVIEW`-Bewerbungen auf `APPROVED`. |
| `/reject <ID>` | Löscht eine Bewerbung aus der Warteschlange. |
| `/send` | **Der "GO"-Befehl:** Der Agent nimmt **alle** Bewerbungen im `APPROVED`-Status und führt den Versand (E-Mail, LinkedIn etc.) aus. |

5.  **Finale Protokollierung:** Nach dem Versand wird der Status auf `SENT` gesetzt und das Ergebnis im Memory protokolliert.

## 4. Weitere Ideen & Features ("Was mir noch einfällt")

Um den Agenten noch mächtiger zu machen, schlage ich folgende Erweiterungen vor:

-   **Dashboard & Reporting:** Einmal pro Woche sendet der Agent eine Zusammenfassung: `"Letzte Woche: 15 Bewerbungen gesendet, 3 Antworten erhalten (Status: In Bearbeitung), 12 keine Antwort."`. Dies gibt dir einen klaren Überblick über die Effektivität.

-   **Automatisches Follow-up:** Für Bewerbungen, die nach 7-10 Tagen unbeantwortet bleiben, kann der Agent automatisch eine höfliche Nachfass-E-Mail vorbereiten und sie ebenfalls in den `PENDING_REVIEW`-Status zur Freigabe stellen.

-   **Intelligente Keyword-Analyse:** Der Agent analysiert alle gefundenen Stellenanzeigen und meldet dir Trends: `"Auffällig: In 60% der letzten 50 Stellen wurde 'Testautomatisierung mit Cypress' gefordert. Deine Kenntnisse in diesem Bereich sind ein starkes Plus."`. So siehst du, welche deiner Skills gerade am gefragtesten sind.

-   **Firmen-Recherche 2.0:** Vor der Erstellung des Anschreibens führt der Agent eine schnelle News-Suche zur Firma durch. Findet er eine aktuelle, positive Meldung (z.B. "Firma X gewinnt Innovationspreis"), kann er einen Satz wie `"Besonders beeindruckt hat mich Ihre jüngste Auszeichnung für..."` in das Anschreiben einbauen, was extrem personalisiert wirkt.

-   **A/B-Testing für Anschreiben:** Der Agent könnte für ähnliche Stellen zwei leicht unterschiedliche Einleitungssätze oder Skill-Reihenfolgen verwenden und tracken, welche Variante zu mehr positiven Antworten führt. Ein fortgeschrittenes, aber sehr starkes Feature zur Selbstoptimierung.

## 5. Aktualisierte Roadmap

Die Roadmap wird um die neuen Features erweitert:

-   [ ] **Phase 1: Grundgerüst & Sourcing** (unverändert)
-   [ ] **Phase 2: Dokumentenerstellung & Batch-System**
    -   [ ] Implementierung der `Application Queue` (Pending, Approved, Sent).
    -   [ ] Anpassung des Workflows auf das Sammeln von Bewerbungen.
-   [ ] **Phase 3: Telegram-Integration**
    -   [ ] Entwicklung des Telegram Bots.
    -   [ ] Implementierung der Befehle (`/status`, `/approve`, `/send` etc.).
-   [ ] **Phase 4: Execution & LinkedIn-Integration** (zuvor Phase 3)
-   [ ] **Phase 5: Advanced Features**
    -   [ ] Implementierung des wöchentlichen Reportings.
    -   [ ] Implementierung des automatischen Follow-ups.

Dieses erweiterte Konzept macht den Agenten zu einem echten, proaktiven Assistenten, der dir massiv Zeit spart und gleichzeitig die volle Kontrolle in deine Hände legt.
