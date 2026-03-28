# GitHub Integration - Intelligente Projektauswahl

**Version:** 1.3.0  
**Datum:** 07. Februar 2026  
**Feature:** Automatische Analyse und Auswahl relevanter GitHub-Projekte

---

## Übersicht

Der Job Application Agent analysiert jetzt automatisch alle deine GitHub-Projekte und wählt für jede Bewerbung die **relevantesten Projekte** aus. Diese werden im Anschreiben erwähnt und demonstrieren deine praktischen Fähigkeiten.

---

## Wie es funktioniert

### 1. Repository-Analyse

**GitHubService** analysiert alle deine öffentlichen Repositories:

- **README-Analyse:** Extrahiert Technologien und Beschreibungen
- **Sprachen-Erkennung:** Identifiziert verwendete Programmiersprachen
- **Topics-Auswertung:** Nutzt GitHub-Topics für Kategorisierung
- **Aktivitäts-Tracking:** Berücksichtigt letzte Updates
- **Popularitäts-Bewertung:** Stars und Forks als Qualitätsindikator

**Caching:** Alle Daten werden 24 Stunden gecacht für Performance.

---

### 2. Intelligentes Matching

Für jede Stellenanzeige wird ein **Match-Score (0-100)** berechnet:

| Kriterium | Max. Punkte | Beschreibung |
|:----------|:------------|:-------------|
| **Sprachen-Match** | 30 | Verwendete Programmiersprachen |
| **Technologie-Match** | 30 | Frameworks, Tools, Libraries |
| **Topics-Match** | 20 | GitHub-Topics (z.B. "backend", "api") |
| **Keyword-Match** | 10 | Keywords in README/Beschreibung |
| **Position-Match** | 10 | Stellenspezifische Keywords |
| **Aktivitäts-Bonus** | 5 | Letzte Updates (<30 Tage) |
| **Popularitäts-Bonus** | 5 | Stars (>10 = 5 Punkte) |

**Beispiel:**

Stellenanzeige: "Backend Developer - Java, Spring, MySQL"

```
Projekt: automated-trading-system
- Sprachen: Java (+10)
- Technologien: Spring, MySQL (+20)
- Topics: backend, api (+10)
- README: "REST API with Spring Boot" (+5)
- Position: backend (+5)
- Update: vor 15 Tagen (+5)
- Stars: 3 (+1)
---
Total Score: 56/100
```

---

### 3. Projekt-Auswahl

**Für jede Bewerbung:**
- Top 3 Projekte werden ausgewählt (konfigurierbar)
- Beste Match wird im Anschreiben hervorgehoben
- Alle 3 können im Portfolio-Abschnitt erwähnt werden

**Fallback:** Falls keine passenden Projekte gefunden werden, wird ein Standardprojekt verwendet.

---

## Konfiguration

### User Profile (`config/user_profile.json`)

```json
{
  "personal": {
    "github": "tibo47-161"
  },
  "github": {
    "username": "tibo47-161",
    "highlightProjects": true,
    "maxProjectsPerApplication": 3,
    "excludeProjects": ["old-project", "test-repo"]
  }
}
```

### Umgebungsvariablen

```bash
GITHUB_TOKEN=ghp_your_token_here
```

**GitHub Token erstellen:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes: `public_repo` (nur öffentliche Repos)
4. Kopiere den Token in `.env`

---

## Integration im Workflow

```
Job Sourcing
    ↓
Job Parsing
    ↓

 GitHub Integration (NEU!)

 1. Lade alle Repositories
 2. Analysiere jedes Projekt
 3. Berechne Match-Score
 4. Wähle Top 3 Projekte

    ↓
Document Generation
    ↓
  - Anschreiben erwähnt bestes Projekt
  - Lebenslauf listet relevante Projekte
    ↓
Application Queue
```

---

## Beispiel-Output

### Anschreiben-Auszug:

> "In meinem GitHub-Portfolio möchte ich besonders auf mein Projekt **automated-trading-system** hinweisen. Dieses Projekt demonstriert meine Fähigkeiten in **Java** und **Spring Boot**, die Sie in der Stellenbeschreibung als Kernkompetenzen nennen. Das Projekt umfasst eine vollständige REST-API mit MySQL-Datenbankanbindung und wurde mit modernen Best Practices entwickelt."

### Metadata (`metadata.json`):

```json
{
  "selectedProject": {
    "name": "automated-trading-system",
    "url": "https://github.com/tibo47-161/automated-trading-system",
    "language": "Java",
    "technologies": ["Spring", "MySQL", "REST"],
    "matchScore": 75,
    "reason": "Best match with score 75/100"
  },
  "allMatchingProjects": [
    {
      "name": "automated-trading-system",
      "matchScore": 75
    },
    {
      "name": "argo-aviation-referral-portal",
      "matchScore": 62
    },
    {
      "name": "ArgoTicketTool",
      "matchScore": 58
    }
  ]
}
```

---

## Technische Details

### GitHubService.js

**Hauptmethoden:**

| Methode | Beschreibung |
|:--------|:-------------|
| `initialize()` | Lädt Cache oder fetcht Repositories |
| `refreshCache()` | Aktualisiert Repository-Daten |
| `findMatchingProjects(jobRequirements, limit)` | Findet beste Matches |
| `getAllRepositories()` | Gibt alle gecachten Repos zurück |

**Caching:**
- Speicherort: `/app/data/github_cache.json`
- Gültigkeit: 24 Stunden
- Automatische Refresh bei Ablauf

**Performance:**
- Initiale Analyse: ~30-60 Sekunden (einmalig)
- Matching pro Job: <1 Sekunde (aus Cache)
- API-Calls: Minimal durch Caching

---

## Vorteile

### 1. Authentizität
- **Echte Projekte** statt generischer Aussagen
- **Konkrete Beispiele** für deine Fähigkeiten
- **Verifizierbarer Code** auf GitHub

### 2. Relevanz
- **Automatisches Matching** zu Stellenanforderungen
- **Intelligente Auswahl** basierend auf Score
- **Dynamische Anpassung** für jede Bewerbung

### 3. Effizienz
- **Kein manuelles Auswählen** von Projekten
- **Automatische Analyse** aller Repos
- **24h-Caching** für Performance

---

## Beispiel-Szenarien

### Szenario 1: Backend Developer (Java, Spring)

**Stellenanforderungen:**
- Java, Spring Boot, MySQL
- REST APIs, Microservices

**Ausgewähltes Projekt:**
- `automated-trading-system` (Score: 85)
- Begründung: Perfekter Match - nutzt Java, Spring, MySQL

---

### Szenario 2: Frontend Developer (React, TypeScript)

**Stellenanforderungen:**
- React, TypeScript, Tailwind CSS
- Responsive Design

**Ausgewähltes Projekt:**
- `argo-aviation-referral-portal` (Score: 78)
- Begründung: React-basiert, moderne UI

---

### Szenario 3: QA Engineer (Testing, Automation)

**Stellenanforderungen:**
- Selenium, Test Automation
- CI/CD, Jenkins

**Ausgewähltes Projekt:**
- `ArgoTicketTool` (Score: 65)
- Begründung: Enthält Testing-Komponenten

---

## Troubleshooting

### Problem: "No matching projects found"

**Ursache:** Keine Projekte passen zu den Anforderungen.

**Lösung:**
1. Prüfe, ob GitHub-Token gültig ist
2. Stelle sicher, dass Repositories öffentlich sind
3. Füge Topics zu deinen Projekten hinzu
4. Aktualisiere README mit Technologie-Keywords

---

### Problem: "Cache expired"

**Ursache:** Cache ist älter als 24 Stunden.

**Lösung:** Automatisch - Service refresht Cache beim nächsten Start.

**Manuell refreshen:**
```javascript
await githubService.refreshCache();
```

---

### Problem: "Wrong project selected"

**Ursache:** Matching-Algorithmus wählt unpassendes Projekt.

**Lösung:**
1. Verbessere README des gewünschten Projekts
2. Füge relevante Topics hinzu
3. Nutze `excludeProjects` in Config für unerwünschte Projekte

---

## Zukünftige Erweiterungen

### Phase 1 (aktuell):
- Automatische Repository-Analyse
- Intelligentes Matching
- Top 3 Projekt-Auswahl

### Phase 2 (geplant):
- **README-Zusammenfassung** mit LLM
- **Code-Qualitäts-Analyse** (Complexity, Tests)
- **Commit-Historie-Analyse** (Aktivität, Konsistenz)

### Phase 3 (geplant):
- **Private Repositories** (mit erweiterten Permissions)
- **Organisations-Projekte** einbeziehen
- **Projekt-Kategorisierung** (Web, Mobile, CLI, etc.)

---

## Zusammenfassung

Die GitHub-Integration macht deine Bewerbungen **authentischer, relevanter und überzeugender**:

 **Automatische Analyse** aller Repositories
 **Intelligentes Matching** zu Stellenanforderungen
 **Top 3 Projekte** pro Bewerbung
 **Konkrete Beispiele** im Anschreiben
 **24h-Caching** für Performance
 **Konfigurierbar** via User Profile

**Von "Ich kann Java" zu "Hier ist mein Java-Projekt mit 75% Match zu Ihren Anforderungen"!**

---

**Erstellt von Manus AI am 07. Februar 2026**
