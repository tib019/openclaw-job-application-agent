# ADR-002: Dateisystem-DB (JSON) statt relationaler Datenbank

**Status:** Accepted  
**Datum:** 2024

## Kontext

Der Agent speichert: Bewerbungs-Queue (welche Jobs wurden gefunden, welche freigegeben, welche versendet), Bewerbungshistorie, Log-Einträge.

Optionen für die Persistenzschicht:
- **SQLite:** Relationale DB, kein Server nötig, gut für strukturierte Queries
- **PostgreSQL/MySQL:** Vollständige relationale DB, für concurrent Zugriffe geeignet
- **JSON-Dateien:** Einfache Textdateien, kein Setup, menschenlesbar

## Entscheidung

Wir verwenden eine **JSON-Dateisystem-Datenbank** im `data/`-Verzeichnis.

Jede Entität wird als JSON-Datei oder JSON-Array in einer Datei gespeichert:

```
data/
├── queue.json          # Aktuelle Bewerbungs-Queue
├── history.json        # Abgeschlossene Bewerbungen
├── config.json         # Nutzer-spezifische Einstellungen
└── logs/
    └── 2024-01-15.json # Tageslog
```

**Warum kein SQLite?** Das Datenmodell ist **dokumentenorientiert**, nicht relational. Eine Bewerbung ist ein verschachteltes JSON-Objekt (Job-Details, generiertes Anschreiben, ausgewählte GitHub-Projekte, Versandstatus). In SQL würde das mindestens 3 Tabellen und JOINs erfordern. JSON ist natürlicher.

**Warum kein vollwertiges DBMS?** Der Agent läuft als Single-Process mit sequentiellem Zugriff auf die Queue. Es gibt keine concurrent Writers. Die Datenmenge ist niedrig (Hunderte, nicht Millionen von Datensätzen).

## Konsequenzen

**Positiv:**
- Kein Datenbank-Setup, keine Migrationen
- Vollständig portabel — `docker cp data/` genügt für ein Backup
- Menschenlesbar: Debugging ohne DB-Client möglich
- Einfache Integration in Docker Volumes

**Negativ:**
- Keine Query-Engine: komplexe Filterabfragen erfordern JavaScript-Array-Operationen
- Race Conditions bei zukünftigem Concurrent-Zugriff (mehrere Worker-Instanzen) nicht sicher
- Keine Transaktionsgarantien: bei einem Absturz während des Schreibens kann eine Datei inkonsistent sein

**Migrationspfad:** Bei Bedarf an komplexeren Queries oder Concurrent-Zugriff wäre SQLite die natürliche nächste Stufe, da das Datenmodell sich direkt übertragen lässt.
