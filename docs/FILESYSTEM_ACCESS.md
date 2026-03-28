# Dateisystem-Zugriff: Konzept und Sicherheit

**Datum:** 07. Februar 2026  
**Autor:** Manus AI

## 1. Warum Dateisystem-Zugriff essentiell ist

Der Agent benötigt Zugriff auf dein lokales Dateisystem aus mehreren kritischen Gründen:

### Bewerbungsrelevante Use Cases

1. **Zugriff auf Master-Dokumente:**
   - Dein aktueller Lebenslauf (z.B. `~/Dokumente/Bewerbung/Lebenslauf_Master.pdf`)
   - Zeugnisse und Zertifikate (Python-Zertifikat, Scrum-Foundation etc.)
   - Referenzschreiben vom Praktikum bei Argo Aviation

2. **Speichern generierter Bewerbungen:**
   - Jede Bewerbung wird in einem eigenen Ordner abgelegt: `~/Bewerbungen/2026-02-07_TechCorp/`
   - Enthält: Anschreiben, angepasster Lebenslauf, Stellenanzeige als PDF, Metadaten

3. **Template-Verwaltung:**
   - Vorlagen für Anschreiben in verschiedenen Stilen (formal, modern, startup-freundlich)
   - LaTeX- oder Markdown-Templates für den Lebenslauf

4. **Projektportfolio:**
   - Zugriff auf deine GitHub-Repositories (lokal geklont) zur Analyse
   - Screenshots oder Demos deiner besten Projekte

## 2. Docker Volume Mapping: Sicherer Zugriff

Um dem Docker-Container Zugriff auf dein Dateisystem zu geben, nutzen wir **Volume Mounts**. Dies ist sicher, weil:

- Der Agent nur auf **explizit gemappte Verzeichnisse** zugreifen kann
- Alle anderen Bereiche deines Systems bleiben unerreichbar
- Du behältst die volle Kontrolle über die Berechtigungen

### Aktualisierte docker-compose.yml

```yaml
services:
  agent-service:
    volumes:
      # Interne Daten (im Container)
      - ./data:/app/data
      - ./logs:/app/logs
      - ./config:/app/config:ro
      
      # Zugriff auf dein lokales Dateisystem
      - ~/Bewerbungen:/host/bewerbungen          # Bewerbungsordner
      - ~/Dokumente/Bewerbung:/host/dokumente:ro # Master-Dokumente (read-only)
      - ~/Downloads:/host/downloads:ro           # Job-PDFs aus Downloads
```

**Erklärung:**
- `~/Bewerbungen` → Der Agent kann hier Bewerbungen erstellen und speichern
- `~/Dokumente/Bewerbung` → **Read-only**: Agent liest Master-Lebenslauf und Zeugnisse, kann sie aber nicht ändern
- `~/Downloads` → **Read-only**: Agent kann heruntergeladene Stellenanzeigen lesen

## 3. Dynamische Dokumentenerstellung

Der Agent erstellt **für jede Stelle** komplett neue, maßgeschneiderte Dokumente. Dies ist der Kern seiner Intelligenz.

### Workflow: Von der Stellenanzeige zum fertigen Anschreiben

1. **Analyse der Stellenanzeige:**
   - Extrahiert geforderte Skills (z.B. "Java, Spring Boot, REST APIs")
   - Identifiziert Unternehmenskultur-Signale (z.B. "agiles Team", "flache Hierarchien")
   - Erkennt Schwerpunkte (z.B. Backend vs. Full Stack, Testing vs. Development)

2. **Matching mit deinem Profil:**
   - Vergleicht geforderte Skills mit deinen Kenntnissen
   - Wählt die **relevantesten 3-5 Skills** aus deinem Portfolio
   - Identifiziert die **beste Projekt-Referenz** aus deinen GitHub-Repos

3. **Generierung des Anschreibens:**
   - Nutzt ein **Template** als Basis (z.B. `templates/anschreiben_modern.md`)
   - Ersetzt Platzhalter dynamisch:
     - `{{FIRMA}}` → "TechCorp GmbH"
     - `{{POSITION}}` → "Junior Backend Developer"
     - `{{SKILLS}}` → "Java, MySQL und Agile Methoden"
     - `{{PROJEKT}}` → "Mein Projekt 'Automated Trading System' auf GitHub"
   - **LLM-generierte Einleitung:** Ein einzigartiger, nicht-generischer erster Absatz

4. **Anpassung des Lebenslaufs:**
   - Liest deinen Master-Lebenslauf (Markdown oder LaTeX)
   - **Reordering:** Stellt die relevantesten Skills nach oben
   - **Highlighting:** Betont Erfahrungen, die zur Stelle passen (z.B. "QA Engineer bei Hosenso" für Testing-lastige Stellen)
   - Exportiert als PDF mit professionellem Layout

### Beispiel: Template für Anschreiben

```markdown
# Anschreiben-Template: Modern

{{DATUM}}

{{FIRMA}}  
{{ANSPRECHPARTNER}}  
{{ADRESSE}}

**Betreff: Bewerbung als {{POSITION}}**

Sehr {{ANREDE}},

{{LLM_EINLEITUNG}}

während meiner Umschulung zum Fachinformatiker für Anwendungsentwicklung habe ich fundierte Kenntnisse in {{SKILLS}} erworben. Besonders stolz bin ich auf mein Projekt "{{PROJEKT_NAME}}", bei dem ich {{PROJEKT_BESCHREIBUNG}}. 

In meiner aktuellen Position als QA Engineer bei Hosenso konnte ich bereits praktische Erfahrungen in {{RELEVANTE_ERFAHRUNG}} sammeln, die ich gerne in Ihrem Team einbringen möchte.

{{FIRMEN_RECHERCHE_SATZ}}

Ich freue mich darauf, in einem persönlichen Gespräch mehr über die Position und Ihre Erwartungen zu erfahren.

Mit freundlichen Grüßen,  
{{DEIN_NAME}}
```

**Platzhalter werden ersetzt durch:**
- `{{LLM_EINLEITUNG}}`: Ein vom LLM generierter, einzigartiger Einstieg basierend auf der Stellenanzeige
- `{{FIRMEN_RECHERCHE_SATZ}}`: Ein Satz basierend auf aktuellen News zur Firma (z.B. "Besonders beeindruckt hat mich Ihre jüngste Auszeichnung als 'Innovativstes Startup 2026'")

## 4. Sicherheitsmaßnahmen

### Was der Agent NICHT darf:

- Auf Bereiche außerhalb der gemappten Volumes zugreifen
- Master-Dokumente überschreiben (read-only Mount)
- Dateien löschen ohne explizite Freigabe
- Persönliche Daten außerhalb des Bewerbungskontexts lesen

### Was der Agent darf:

- Bewerbungen im `~/Bewerbungen`-Ordner erstellen
- Master-Dokumente lesen und daraus lernen
- GitHub-Repos analysieren (für Projekt-Auswahl)
- Stellenanzeigen aus `~/Downloads` lesen

## 5. Ordnerstruktur: Best Practice

```
~/Bewerbungen/
 2026-02-07_TechCorp_Junior_Backend_Developer/
 anschreiben.pdf
 lebenslauf.pdf
 stellenanzeige.pdf
 metadata.json
 logs.txt
 2026-02-08_StartupX_Full_Stack_Developer/
 anschreiben.pdf
 lebenslauf.pdf
 stellenanzeige.pdf
 metadata.json
...

~/Dokumente/Bewerbung/
 Lebenslauf_Master.md
 Zeugnisse/
 Python_Zertifikat.pdf
 Scrum_Foundation.pdf
 Praktikumszeugnis_Argo_Aviation.pdf
 Templates/
 anschreiben_modern.md
 anschreiben_formal.md
 lebenslauf_template.tex
```

Diese Struktur ermöglicht maximale Flexibilität und Nachvollziehbarkeit.
