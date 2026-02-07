# Benutzerhandbuch

**Projekt:** OpenClaw Job Application Agent  
**Version:** 2.0.0  
**Datum:** 07. Februar 2026  
**Autor:** Tobias Heiko Buß

---

## 1. Einleitung

Dieses Handbuch beschreibt die Verwendung des OpenClaw Job Application Agent über den Telegram Bot.

## 2. Voraussetzungen

- Telegram Account
- Der Agent muss bereits deployed und gestartet sein.

## 3. Befehlsübersicht

| Befehl | Beschreibung |
|:-------|:-------------|
| `/start` | Startet den Bot und zeigt eine Willkommensnachricht. |
| `/status` | Zeigt eine Übersicht über die Application Queue. |
| `/list <status>` | Listet Bewerbungen mit einem bestimmten Status auf. |
| `/get <id>` | Zeigt Details zu einer einzelnen Bewerbung. |
| `/approve <id>` | Genehmigt eine einzelne Bewerbung. |
| `/approveall` | Genehmigt alle ausstehenden Bewerbungen. |
| `/reject <id>` | Lehnt eine einzelne Bewerbung ab. |
| `/send` | Versendet alle genehmigten Bewerbungen. |
| `/prompt <text>` | Führt eine Anweisung in natürlicher Sprache aus. |
| `/help` | Zeigt eine Hilfe-Nachricht mit allen Befehlen. |

## 4. Workflow

1.  **Warten auf Benachrichtigungen**
    - Der Agent sucht alle 4 Stunden nach neuen Jobs.
    - Du erhältst eine Nachricht, wenn neue Bewerbungen zur Prüfung bereitstehen.

2.  **Bewerbungen prüfen**
    - Nutze `/list pending`, um die ausstehenden Bewerbungen zu sehen.
    - Nutze `/get <id>`, um Details zu einer Bewerbung anzuzeigen.

3.  **Bewerbungen freigeben**
    - Nutze `/approve <id>` für einzelne Bewerbungen.
    - Nutze `/approveall`, um alle auf einmal freizugeben.

4.  **Bewerbungen versenden**
    - Nutze `/send`, um alle genehmigten Bewerbungen zu versenden.

## 5. Natürliche Sprachsteuerung (`/prompt`)

Du kannst den Agenten auch mit natürlichen Sätzen steuern:

- `/prompt lehne alle bewerbungen mit score unter 60 ab`
- `/prompt zeige mir alle bewerbungen für junior backend developer`
- `/prompt genehmige alle bewerbungen von firmen mit mehr als 1000 mitarbeitern`

---

**Ende des Benutzerhandbuchs**
