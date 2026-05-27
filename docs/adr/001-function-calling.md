# ADR-001: OpenAI Function Calling für den Agent-Loop

**Status:** Accepted  
**Datum:** 2024

## Kontext

Ein autonomer Agent muss entscheiden, welche Aktionen er in welcher Reihenfolge ausführt: Job-Suche starten, Stellenanzeige analysieren, Bewerbung generieren, Nutzer benachrichtigen, E-Mail versenden.

Drei Implementierungsansätze:

1. **Hardcoded State Machine:** Fester Ablauf, jeder Schritt explizit programmiert
2. **ReAct-Prompting:** LLM denkt Schritt für Schritt (Reason + Act), gibt Freitext-Antworten, Code parst die Aktionen
3. **Function Calling:** LLM wählt strukturiert aus einem definierten Set von Funktionen mit typisierten Parametern

## Entscheidung

Wir verwenden **OpenAI Function Calling** (GPT-4.1-mini).

Jeder ausführbare Schritt ist als Function-Schema definiert. Der LLM analysiert den aktuellen Kontext und gibt zurück, welche Funktion mit welchen Parametern aufgerufen werden soll — als strukturiertes JSON, nicht als Freitext.

```javascript
// Beispiel-Schema (vereinfacht)
const tools = [
  {
    type: 'function',
    function: {
      name: 'searchJobs',
      description: 'Suche nach Jobs auf einem Portal',
      parameters: {
        properties: {
          portal: { type: 'string', enum: ['stepstone', 'indeed'] },
          keywords: { type: 'array', items: { type: 'string' } },
        }
      }
    }
  },
  // generateCoverLetter, sendEmail, notifyUser…
];

// LLM gibt zurück:
// { name: 'searchJobs', arguments: { portal: 'stepstone', keywords: ['Python', 'Backend'] } }
```

Zusätzlich ermöglicht `/prompt` im Telegram-Bot **natürlichsprachige Steuerung**: Der Nutzer schreibt "Suche nach Python-Jobs in Hamburg", der LLM mapped das auf den richtigen Funktionsaufruf.

## Abgewogene Alternativen

**Hardcoded State Machine:** Zuverlässig und deterministisch, aber unflexibel. Jede neue Aktion erfordert Code-Änderungen. Keine natürlichsprachige Steuerung möglich.

**ReAct-Prompting:** Flexibler, aber das Parsen von Freitext-Antworten ist fehleranfällig. Halluzinierte Aktionsnamen oder falsche Parameter führen zu Silent Failures.

## Konsequenzen

**Positiv:**
- Typisierte Parameter: Der LLM kann keine ungültigen Werte zurückgeben
- Neue Skills (Funktionen) lassen sich ohne Prompt-Engineering hinzufügen
- Natürlichsprachige Steuerung über `/prompt` out-of-the-box
- Niedrigere Fehlerrate als Freitext-Parsing

**Negativ:**
- OpenAI-API-Abhängigkeit — kein Offline-Betrieb
- Function Calling ist modell-spezifisch; Migration zu einem anderen LLM erfordert Anpassung
- Kosten pro API-Call; bei hohem Aufkommen relevant
