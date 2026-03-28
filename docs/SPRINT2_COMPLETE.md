# Sprint 2: LLM-Steuerung via Telegram - Abgeschlossen

**Version:** 1.2.0  
**Datum:** 07. Februar 2026  
**Feature:** Natural Language Prompt Control

---

## Übersicht

Sprint 2 erweitert den Job Application Agent um **LLM-gesteuerte Steuerung** via Telegram. Statt nur feste Befehle zu nutzen, kannst du den Agenten jetzt mit **natürlicher Sprache** steuern.

---

## Was wurde implementiert?

### 1. Datensammlung für ML-Modell

**ApplicationQueue erweitert:**
- `features` Feld für ML-Training-Features
- `decision` Feld für User-Entscheidungen (approved/rejected)
- Automatisches Tracking bei approve/reject

**Zweck:** Passive Sammlung von Trainingsdaten für zukünftiges ML-Modell.

**Beispiel-Datenstruktur:**
```json
{
  "id": 1,
  "company": "Test GmbH",
  "position": "Backend Developer",
  "matchScore": 75,
  "features": {
    "skills": ["Java", "Spring"],
    "experience": "junior",
    "salary": 65000,
    "remote": "hybrid"
  },
  "decision": "approved"
}
```

---

### 2. Erweiterte API-Endpoints

**Neue Batch-Operationen:**

| Endpoint | Methode | Beschreibung |
|:---------|:--------|:-------------|
| `/api/queue/reject-batch` | POST | Lehne mehrere Bewerbungen basierend auf Filter ab |
| `/api/queue/approve-batch` | POST | Genehmige mehrere Bewerbungen basierend auf Filter |
| `/api/queue/list-filtered` | GET | Liste Bewerbungen mit erweiterten Filtern |
| `/api/ml/export-training-data` | GET | Exportiere Trainingsdaten für ML-Modell |
| `/api/prompt/process` | POST | Verarbeite natürlichen Sprach-Prompt |

**Filter-Kriterien:**
- `minScore` / `maxScore` - Score-Range
- `includeKeywords` / `excludeKeywords` - Keyword-Filter
- `remoteOnly` - Nur Remote-Jobs
- `maxCompanySize` - Maximale Firmengröße

---

### 3. LLM Function Calling Service

**PromptService.js:**
- Verarbeitet natürliche Sprache via OpenAI GPT-4.1-mini
- Function Calling für strukturierte API-Aufrufe
- 7 vordefinierte Funktionen

**Unterstützte Funktionen:**
1. `listApplicationsFiltered` - Liste mit Filtern
2. `approveApplication` - Einzelne Bewerbung genehmigen
3. `rejectApplication` - Einzelne Bewerbung ablehnen
4. `approveBatch` - Batch-Genehmigung
5. `rejectBatch` - Batch-Ablehnung
6. `sendAllApplications` - Alle genehmigten versenden
7. `getStatistics` - Statistiken abrufen

---

### 4. `/prompt`-Befehl im Telegram Bot

**Syntax:**
```
/prompt <deine anweisung>
```

**Beispiele:**

| Prompt | Aktion |
|:-------|:-------|
| `/prompt zeige alle bewerbungen mit score über 70` | Listet Bewerbungen mit Score ≥70 |
| `/prompt lehne alle bewerbungen mit score unter 60 ab` | Lehnt Bewerbungen mit Score <60 ab |
| `/prompt genehmige alle remote jobs` | Genehmigt alle Remote-Positionen |
| `/prompt sende alle genehmigten bewerbungen` | Versendet alle genehmigten Bewerbungen |
| `/prompt zeige mir die statistiken` | Zeigt Queue-Statistiken |

**Intelligente Verarbeitung:**
1. Prompt wird an PromptService gesendet
2. LLM analysiert den Prompt
3. LLM entscheidet, welche Funktion aufgerufen werden soll
4. API führt die Funktion aus
5. Ergebnis wird formatiert und an Telegram zurückgesendet

---

## Workflow

```

 Telegram Bot
 User: "/prompt lehne alle mit score unter 60 ab"




 Agent API
 POST /api/prompt/process




 PromptService
 - Sendet Prompt an OpenAI GPT-4.1-mini
 - LLM analysiert und wählt Funktion
 - Function Call: rejectBatch({ maxScore: 59 })




 Agent API
 POST /api/queue/reject-batch
 Body: { filter: { maxScore: 59 } }




 ApplicationQueue
 - Filtert Bewerbungen mit Score ≤59
 - Setzt Status auf REJECTED
 - Setzt decision = 'rejected'
 - Speichert Queue




 Telegram Bot
 " 5 Bewerbungen abgelehnt!"

```

---

## Vorteile

### 1. Maximale Flexibilität
- **Natürliche Sprache** statt fester Befehle
- **Komplexe Anweisungen** in einem Befehl
- **Spontane Aktionen** ohne Menü-Navigation

### 2. Effizienz
- **Batch-Operationen** mit einem Befehl
- **Intelligente Filterung** durch LLM
- **Keine Wiederholung** von Befehlen

### 3. Zukunftssicherheit
- **Datensammlung** für ML-Modell läuft passiv
- **Erweiterbar** um neue Funktionen
- **Lernfähig** (LLM kann neue Muster erkennen)

---

## Kosten

**LLM-Calls:**
- Modell: GPT-4.1-mini
- Kosten: ~$0.001 pro Prompt
- Bei 10 Prompts/Tag: ~$0.30/Monat

**Vernachlässigbar im Vergleich zum Nutzen!**

---

## Beispiel-Session

```
User: /prompt zeige mir alle bewerbungen

Bot: 15 Bewerbungen gefunden:

#1 - Test GmbH - Backend Developer (Score: 85)
#2 - Example AG - Full Stack Developer (Score: 72)
#3 - Demo Inc - Junior Developer (Score: 58)
...

User: /prompt lehne alle mit score unter 60 ab

Bot: 3 Bewerbungen abgelehnt!

User: /prompt genehmige alle mit score über 75

Bot: 5 Bewerbungen genehmigt!

User: /prompt sende alle genehmigten

Bot: 5 Bewerbungen versendet!
 0 fehlgeschlagen.
```

---

## Nächste Schritte

### Phase 2: ML-Modell (in 2-3 Monaten)

Wenn genügend Trainingsdaten gesammelt wurden (>100 Entscheidungen):

1. **Daten exportieren:**
   ```bash
   curl http://localhost:3000/api/ml/export-training-data > training_data.json
   ```

2. **Modell trainieren:**
   - Scikit-learn (Python)
   - Logistic Regression oder Gradient Boosting
   - Feature Engineering (TF-IDF für Text)

3. **ML Model Service erstellen:**
   - Flask/FastAPI Server
   - Lädt trainiertes Modell
   - Gibt Score (0-100) zurück

4. **Integration:**
   - JobParserSkill ruft ML Model Service statt OpenAI an
   - Hybrid-Ansatz: ML für Vorauswahl, LLM für Top-Kandidaten

---

## Technische Details

### Dependencies

**Neue NPM-Pakete:**
- `openai` - OpenAI SDK für Function Calling
- `axios` - HTTP-Client für API-Calls

**Neue Python-Pakete:**
- Keine (nutzt bestehende `requests`)

### Konfiguration

**Umgebungsvariablen:**
- `OPENAI_API_KEY` - OpenAI API Key (bereits vorhanden)

**Keine zusätzliche Konfiguration nötig!**

---

## Testing

### Manuelle Tests

1. **Prompt-Verarbeitung testen:**
   ```bash
   curl -X POST http://localhost:3000/api/prompt/process \
     -H "Content-Type: application/json" \
     -d '{"prompt": "zeige alle bewerbungen mit score über 70"}'
   ```

2. **Batch-Reject testen:**
   ```bash
   curl -X POST http://localhost:3000/api/queue/reject-batch \
     -H "Content-Type: application/json" \
     -d '{"filter": {"maxScore": 59}}'
   ```

3. **ML-Daten exportieren:**
   ```bash
   curl http://localhost:3000/api/ml/export-training-data
   ```

### Telegram Bot testen

1. Starte den Bot: `docker-compose up`
2. Öffne Telegram
3. Sende: `/prompt zeige alle bewerbungen`
4. Prüfe die Antwort

---

## Zusammenfassung

Sprint 2 bringt **maximale Flexibilität** mit **minimalem Aufwand**:

 **LLM-Steuerung** via Telegram
 **Batch-Operationen** für Effizienz
 **Datensammlung** für zukünftiges ML-Modell
 **Erweiterte API** für komplexe Aktionen
 **Intelligente Verarbeitung** durch Function Calling

**Von "feste Befehle" zu "natürliche Sprache" in einem Sprint!**

---

**Erstellt von Manus AI am 07. Februar 2026**
