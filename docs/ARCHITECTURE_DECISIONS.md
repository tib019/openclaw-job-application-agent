# Architektur-Entscheidungen: Docker & UI

**Datum:** 07. Februar 2026
**Autor:** Manus AI

## 1. Fragestellung

Für die Umsetzung des **OpenClaw Job Application Agent** müssen zwei fundamentale Architektur-Entscheidungen getroffen werden:

1.  **Deployment-Umgebung:** Soll der Agent in einem **Docker-Container** gekapselt oder **nativ** auf dem Host-System installiert werden?
2.  **Benutzerschnittstelle:** Reicht die Steuerung via **Telegram** aus, oder wird eine dedizierte **Web-UI** benötigt?

Dieses Dokument analysiert die Vor- und Nachteile beider Optionen und gibt eine klare, auf die Projektziele zugeschnittene Experten-Empfehlung.

## 2. Analyse: Docker vs. Native Installation

### Meine Empfehlung: ✅ Eindeutig Docker

Für ein Projekt dieser Art, bei dem ein autonomer Agent mit potenziell weitreichenden Systemzugriffen (Dateisystem, Browser, Shell) agiert, ist die **Isolation durch Containerisierung nicht nur ein Vorteil, sondern eine Notwendigkeit**. Die Sicherheitsgewinne überwiegen den geringen Mehraufwand beim Setup bei weitem.

### Detaillierte Gegenüberstellung

| Aspekt | Docker (Empfehlung) | Native Installation |
| :--- | :--- | :--- |
| **Sicherheit** | ⭐⭐⭐⭐⭐ **Exzellent.** Der Agent ist im Container eingesperrt. Selbst eine kompromittierte Skill kann dem Host-System nur minimalen Schaden zufügen. Dateizugriffe können auf spezifische Volumes beschränkt werden. | ⭐☆☆☆☆ **Sehr riskant.** Der Agent läuft mit den vollen Rechten des ausführenden Benutzers. Ein Fehler oder eine bösartige Skill kann auf alle deine persönlichen Daten zugreifen, Dateien löschen oder Malware installieren. |
| **Stabilität** | ⭐⭐⭐⭐⭐ **Exzellent.** Die Umgebung ist zu 100% reproduzierbar. Alle Abhängigkeiten (Node.js, Python, Browser-Treiber) sind im Image festgeschrieben. Keine "Es funktioniert aber auf meiner Maschine"-Probleme. | ⭐⭐☆☆☆ **Mittelmäßig.** Die Stabilität hängt stark vom Host-System ab. Updates des Betriebssystems oder anderer global installierter Pakete können die Funktionsfähigkeit des Agenten beeinträchtigen. |
| **Einrichtung** | ⭐⭐⭐☆☆ **Mittel.** Erfordert die Erstellung eines `Dockerfile` und einer `docker-compose.yml`. Das initiale Setup ist komplexer, aber danach ist der Start mit `docker-compose up` trivial. | ⭐⭐⭐⭐☆ **Einfach.** Ein `git clone` und die Ausführung von Installations-Skripten sind schnell erledigt. |
| **Ressourcen** | ⭐⭐⭐⭐☆ **Sehr gut.** Der Overhead von Docker ist heutzutage minimal und für dieses Projekt vernachlässigbar. | ⭐⭐⭐⭐⭐ **Exzellent.** Kein Virtualisierungs-Overhead. |

**Fazit:** Die native Installation ist zwar auf den ersten Blick einfacher, aber sie ist ein Sicherheitsalbtraum, der für einen autonomen Agenten inakzeptabel ist. **Docker ist die professionelle und einzig verantwortungsvolle Wahl.**

## 3. Analyse: Dedizierte UI vs. Telegram-Only

### Meine Empfehlung: ✅ Eindeutig Telegram-Only (für den Start)

Eine dedizierte Web-UI ist ein klassisches "Over-Engineering" für die aktuelle Projektphase. Sie würde die Komplexität massiv erhöhen und vom eigentlichen Ziel – der Entwicklung der Agenten-Intelligenz – ablenken. **Telegram bietet alles, was wir für eine effektive Steuerung und Überwachung benötigen.**

### Detaillierte Gegenüberstellung

| Aspekt | Telegram-Only (Empfehlung) | Dedizierte Web-UI |
| :--- | :--- | :--- |
| **Fokus & Aufwand** | ⭐⭐⭐⭐⭐ **Exzellent.** Wir können uns zu 100% auf die Kernlogik des Agenten konzentrieren. Die UI ist ein bereits existierender, robuster Dienst. | ⭐☆☆☆☆ **Sehr hoch.** Wir müssten ein komplettes Full-Stack-Projekt aufsetzen (Frontend, Backend-API, Authentifizierung). Dies verdoppelt den Entwicklungsaufwand und lenkt vom Wesentlichen ab. |
| **Zugänglichkeit** | ⭐⭐⭐⭐⭐ **Exzellent.** Du kannst den Agenten von überall steuern, wo du Telegram hast – auf dem Handy, Tablet oder Desktop. | ⭐⭐☆☆☆ **Mittelmäßig.** Erfordert das Hosting der Web-App und den Zugriff über einen Browser. Für den Fernzugriff müsste die App sicher im Internet exponiert werden. |
| **Funktionalität** | ⭐⭐⭐⭐☆ **Sehr gut.** Für den Kern-Workflow (Status abfragen, Details ansehen, genehmigen, senden) ist Telegram perfekt. Es kann Text, Links und sogar Dateien (z.B. das generierte Anschreiben als PDF) senden. | ⭐⭐⭐⭐☆ **Sehr gut.** Bietet reichhaltigere Visualisierungsmöglichkeiten (Dashboards, Graphen, Tabellen), die aber für den Start nicht zwingend notwendig sind. |
| **Komplexität** | ⭐⭐⭐⭐⭐ **Sehr gering.** Die Implementierung eines Telegram-Bots in Python oder Node.js ist mit etablierten Bibliotheken eine Sache von Stunden. | ⭐☆☆☆☆ **Sehr hoch.** Erfordert Kenntnisse in Frontend-Frameworks (React, Vue), Backend-APIs (FastAPI, Express), Datenbanken und Authentifizierungs-Protokollen. |

**Fazit:** Die Telegram-Schnittstelle ist die perfekte Umsetzung des Prinzips "Keep it simple, stupid". Sie ist schlank, effizient und passt ideal zum Paradigma eines "headless" operierenden Assistenten. Eine Web-UI kann später als **optionales Zusatz-Feature** hinzugefügt werden, wenn der Kern des Agenten stabil und ausgereift ist.

## 4. Finale Architektur-Empfehlung

Basierend auf dieser Analyse empfehle ich folgende Architektur:

-   **Deployment:** Eine **Docker-Compose-Konfiguration**, die mehrere Dienste verwaltet:
    1.  **`agent-service`:** Ein Node.js/Python-Container, in dem der OpenClaw-Agent und die Skills laufen.
    2.  **`telegram-bridge-service`:** Ein kleiner Python-Container, der den Telegram-Bot hostet und mit dem Agent-Service über eine interne API oder ein Message-Queue kommuniziert.
    3.  **(Optional) `browser-service`:** Ein `selenium/standalone-chrome`-Container für die Browser-Automatisierung, der vom Agent-Service ferngesteuert wird.

-   **Benutzerschnittstelle:** **Ausschließlich über den Telegram-Bot.** Keine dedizierte Web-UI in der initialen Entwicklungsphase.
