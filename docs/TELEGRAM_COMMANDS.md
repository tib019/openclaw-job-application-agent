# Telegram Bot - Kommando-Referenz

## Übersicht

Der Telegram Bot ist deine Fernbedienung für den Job Application Agent. Alle Befehle werden direkt im Chat mit dem Bot eingegeben.

## Basis-Befehle

### `/start`
Initialisiert den Bot und zeigt eine Willkommensnachricht mit allen verfügbaren Befehlen.

**Beispiel:**
```
/start
```

**Antwort:**
```
👋 Willkommen beim Job Application Agent!

Ich helfe dir, automatisch nach Jobs zu suchen und Bewerbungen vorzubereiten.

Verfügbare Befehle:
/status - Zeige wartende Bewerbungen
/review <ID> - Details einer Bewerbung
/approve <ID> - Bewerbung genehmigen
/approve all - Alle genehmigen
/reject <ID> - Bewerbung verwerfen
/send - Alle genehmigten Bewerbungen versenden
/stats - Statistiken anzeigen
/help - Diese Hilfe anzeigen
```

---

## Bewerbungs-Management

### `/status`
Zeigt alle Bewerbungen im Status `PENDING_REVIEW` an.

**Beispiel:**
```
/status
```

**Antwort:**
```
📋 Wartende Bewerbungen (5):

ID: 1
📍 Firma: TechCorp GmbH
💼 Position: Junior Backend Developer
🔗 Link: https://stepstone.de/job/12345
📅 Gefunden: 07.02.2026 14:30

ID: 2
📍 Firma: StartupX
💼 Position: Full Stack Developer
🔗 Link: https://linkedin.com/jobs/view/67890
📅 Gefunden: 07.02.2026 15:45

[...]

Nutze /review <ID> für Details oder /approve all zum Genehmigen aller.
```

---

### `/review <ID>`
Zeigt detaillierte Informationen zu einer spezifischen Bewerbung.

**Beispiel:**
```
/review 1
```

**Antwort:**
```
📄 Bewerbung #1

📍 Firma: TechCorp GmbH
💼 Position: Junior Backend Developer
🌐 Website: https://techcorp.de
🔗 Stellenanzeige: https://stepstone.de/job/12345
📧 Bewerbungskanal: E-Mail (jobs@techcorp.de)

📝 Generiertes Anschreiben (Auszug):
---
Sehr geehrte Damen und Herren,

mit großem Interesse habe ich Ihre Stellenausschreibung für die Position als Junior Backend Developer gelesen. Als frischgebackener Fachinformatiker für Anwendungsentwicklung mit praktischer Erfahrung in Java und MySQL suche ich nach einer Gelegenheit, meine Kenntnisse in einem innovativen Team einzubringen...

[Vollständiges Anschreiben als Datei anhängen]
---

Aktionen:
/approve 1 - Genehmigen
/reject 1 - Verwerfen
```

---

### `/approve <ID>`
Genehmigt eine einzelne Bewerbung und verschiebt sie in den Status `APPROVED`.

**Beispiel:**
```
/approve 1
```

**Antwort:**
```
✅ Bewerbung #1 (TechCorp GmbH) wurde genehmigt.

Status: APPROVED
Nutze /send um alle genehmigten Bewerbungen zu versenden.
```

---

### `/approve all`
Genehmigt alle Bewerbungen im Status `PENDING_REVIEW` auf einmal.

**Beispiel:**
```
/approve all
```

**Antwort:**
```
✅ 5 Bewerbungen wurden genehmigt:

1. TechCorp GmbH - Junior Backend Developer
2. StartupX - Full Stack Developer
3. InnovateLab - Software Engineer
4. CloudSystems - Backend Developer
5. DataDriven GmbH - Junior Developer

Nutze /send um alle zu versenden.
```

---

### `/reject <ID>`
Verwirft eine Bewerbung und entfernt sie aus der Warteschlange.

**Beispiel:**
```
/reject 3
```

**Antwort:**
```
🗑️ Bewerbung #3 (InnovateLab) wurde verworfen.
```

---

### `/send`
**Der GO-Befehl:** Versendet alle Bewerbungen im Status `APPROVED`.

**Beispiel:**
```
/send
```

**Antwort:**
```
🚀 Versende 5 genehmigte Bewerbungen...

✅ 1/5: TechCorp GmbH - E-Mail gesendet
✅ 2/5: StartupX - LinkedIn Easy Apply erfolgreich
✅ 3/5: CloudSystems - E-Mail gesendet
⚠️ 4/5: DataDriven GmbH - Fehler beim Versand (CAPTCHA)
✅ 5/5: DevHouse - E-Mail gesendet

Ergebnis: 4 erfolgreich, 1 fehlgeschlagen

Die fehlgeschlagene Bewerbung bleibt im Status APPROVED zur manuellen Bearbeitung.
```

---

## Statistiken & Reporting

### `/stats`
Zeigt eine Übersicht über alle Bewerbungsaktivitäten.

**Beispiel:**
```
/stats
```

**Antwort:**
```
📊 Bewerbungs-Statistiken

📅 Zeitraum: Letzte 30 Tage

📤 Gesendete Bewerbungen: 42
📧 Per E-Mail: 28
💼 Per LinkedIn: 12
🌐 Per ATS: 2

📬 Antworten erhalten: 8 (19%)
✅ Positive Antworten: 3
❌ Absagen: 5

⏳ Wartend auf Antwort: 34
📆 Durchschnittliche Antwortzeit: 6 Tage

🔥 Top 3 gefragte Skills:
1. Java (32 Stellen)
2. JavaScript (28 Stellen)
3. Docker (18 Stellen)
```

---

### `/help`
Zeigt eine Übersicht aller verfügbaren Befehle.

**Beispiel:**
```
/help
```

---

## Erweiterte Befehle (geplant)

### `/pause`
Pausiert den autonomen Loop des Agenten.

### `/resume`
Setzt den autonomen Loop fort.

### `/settings`
Zeigt und ändert Agent-Einstellungen (z.B. Loop-Intervall, Suchkriterien).

---

## Proaktive Benachrichtigungen

Der Bot sendet dir automatisch Nachrichten in folgenden Situationen:

1. **Neue Bewerbungen bereit:**
   ```
   🔔 5 neue Bewerbungen sind bereit zur Überprüfung!
   
   Nutze /status um sie anzusehen.
   ```

2. **Wöchentliches Reporting:**
   ```
   📊 Wöchentliche Zusammenfassung (01.02 - 07.02.2026)
   
   📤 15 Bewerbungen gesendet
   📬 3 Antworten erhalten
   ⏳ 12 noch offen
   
   Details: /stats
   ```

3. **Follow-up bereit:**
   ```
   📮 3 Follow-up-E-Mails wurden vorbereitet für Bewerbungen ohne Antwort.
   
   Nutze /status um sie zu überprüfen.
   ```
