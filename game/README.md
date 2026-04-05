# GeoStrategy 2000

Grand-Strategy-Spiel im Stil von Hearts of Iron IV, historisch 2000–2025.

## Tech-Stack
- **Java 11** + **LibGDX 1.12.1**
- **Gradle** Build-System
- **JSON** für Länderdaten und Events

## Starten

```bash
cd game
./gradlew desktop:run
```

Oder JAR bauen:
```bash
./gradlew desktop:jar
java -jar desktop/build/libs/geostrategy-desktop.jar
```

## Projektstruktur

```
game/
  core/           # Plattformunabhängige Spiellogik
    models/       # Country, PoliticalSystem, Military, Economy, ...
    engine/       # GameState, TurnSystem, EspionageSystem, ...
    data/         # CountryLoader (JSON → Java)
    ui/           # MapRenderer, CountryPanel, HUD
  desktop/        # Desktop-Launcher (LWJGL3)
  assets/
    data/
      countries.json         # 15 Kernländer (Jahr 2000)
      events_2000_2005.json  # Historische Events
```

## Politisches System (Zwei-Schichten-Modell)

**Schicht 1 — Politisch-ökonomisches System:**
- `IdeologicalFamily` — breite Tradition (ML, Liberal-Demokratisch, Islamisch, ...)
- `nationalAdaptation` — konkrete nationale Form ("Dengismus", "Juche", "Putinismus", ...)
- `PoliticalMechanics` — Zahlenwerte (Marktfreiheit, Parteikontr., Repression, ...)

**Schicht 2 — Geopolitische Ausrichtung (Spektrum, nicht Blöcke):**
- `usInfluence`, `chinaInfluence`, `russiaInfluence`, `euInfluence`, `autonomy`
- Unabhängige Achsen, können gleichzeitig hoch sein (z.B. Indien)

## 15 Kernländer (Phase 1)
USA, Russland, China, Deutschland, UK, Frankreich, Indien, Brasilien,
Iran, Saudi-Arabien, Israel, Türkei, Nordkorea, Venezuela, Südafrika

## Roadmap

- **Phase 1** (jetzt): Karte, Länderdaten, Zugsystem, Grundpolitik
- **Phase 2**: Provinzkarte (SVG), Fokus-Bäume, Event-Dialoge
- **Phase 3**: Militärkampfsystem, Espionage-UI
- **Phase 4**: Alle 195 Länder (generisch), KI-Verhalten
- **Phase 5**: Echtzeit-Modus
