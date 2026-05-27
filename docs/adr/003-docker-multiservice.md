# ADR-003: Docker 3-Service-Architektur (Agent · Telegram · Browser)

**Status:** Accepted  
**Datum:** 2024

## Kontext

Das System besteht aus drei funktional unterschiedlichen Teilen:
1. **Agent:** Haupt-Logik, LLM-Koordination, Datenpersistenz
2. **Telegram Bot:** User-Interface, Push-Benachrichtigungen
3. **Browser (Selenium + Chrome):** Web-Scraping der Job-Portale

Diese könnten als ein einzelner Prozess laufen oder als separate Container.

## Entscheidung

Wir verwenden **drei separate Docker-Container** in einem `docker-compose.yml`.

```yaml
services:
  agent:    # Node.js Haupt-Prozess
  telegram: # Telegram Bot (separater Node.js Prozess)
  browser:  # Selenium + Chrome
```

Der ausschlaggebende Grund: **Browser-Isolation**. Chrome/Selenium ist ressourcenintensiv, speicherleckgefährdet und crasht häufiger als reine Node.js-Prozesse. Wenn der Browser-Service abstürzt, läuft der Agent-Service weiter — Telegram-Benachrichtigungen funktionieren, Jobs können manuell freigegeben werden, nur das Scraping ist unterbrochen.

Ohne Isolation würde ein Browser-Crash den gesamten Agent-Prozess mitreißen.

```yaml
# Restart-Policy pro Service unabhängig konfigurierbar
agent:
  restart: unless-stopped
browser:
  restart: on-failure  # Browser kann häufiger neu starten
  mem_limit: 1g        # Browser-Speicher begrenzen
```

## Abgewogene Alternativen

**Monolithisch (ein Prozess):** Einfacher zu deployen und zu debuggen. Scheitert an der Browser-Crash-Problematik.

**Microservices mit API-Gateway:** Für diesen Use Case Overkill. 3 Container in docker-compose bieten genug Isolation ohne den Overhead eines Service-Mesh.

## Konsequenzen

**Positiv:**
- Browser-Crashes isoliert; Agent und Telegram bleiben stabil
- Jeder Service hat eigene Ressourcenlimits und Restart-Policies
- Sicherheit: Chrome läuft in eigenem Container ohne Zugriff auf Agent-Secrets
- Unabhängige Skalierung möglich (z.B. mehrere Browser-Instanzen)

**Negativ:**
- Inter-Container-Kommunikation via REST-API statt direktem Funktionsaufruf — etwas mehr Latenz
- Debugging erfordert `docker logs <service>` statt eines einzelnen Log-Streams
- Erhöhter Ressourcenverbrauch durch drei separate Container-Prozesse
