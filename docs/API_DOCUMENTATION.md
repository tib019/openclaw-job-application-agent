# API-Dokumentation

**Projekt:** OpenClaw Job Application Agent  
**Version:** 2.0.0  
**Datum:** 07. Februar 2026  
**Autor:** Tobias Heiko Buß

---

## 1. Einleitung

Diese Dokumentation beschreibt die REST-API des Agent-Service. Die API dient als Schnittstelle für den Telegram Bot und ermöglicht die Steuerung und Überwachung des Agenten.

**Basis-URL:** `http://localhost:3000`

---

## 2. Authentifizierung

Die API ist nur innerhalb des internen Docker-Netzwerks erreichbar und erfordert keine explizite Authentifizierung. Der Zugriff von außen ist nicht vorgesehen.

---

## 3. Endpunkte

### 3.1 Health Checks

#### `GET /api/health`

Liefert einen detaillierten Systemstatus.

**Antwort:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-07T15:30:00.000Z",
  "uptime": { ... },
  "system": { ... },
  "services": { ... },
  "queue": { ... },
  "errors": { ... }
}
```

#### `GET /api/health/simple`

Liefert einen einfachen Status für Load Balancer.

**Antwort:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-07T15:30:00.000Z"
}
```

### 3.2 Queue-Statistiken

#### `GET /api/queue/stats`

Liefert grundlegende Statistiken zur Application Queue.

**Antwort:**
```json
{
  "total": 50,
  "pending": 5,
  "approved": 10,
  "sent": 25,
  "rejected": 10
}
```

#### `GET /api/queue/stats/detailed`

Liefert erweiterte Statistiken.

**Antwort:**
```json
{
  "total": 50,
  "pending": 5,
  "approved": 10,
  "sent": 25,
  "rejected": 10,
  "sent_last_30_days": 15,
  "success_rate": 95
}
```

### 3.3 Queue-Operationen

#### `GET /api/queue/list/:status`

Listet alle Bewerbungen mit einem bestimmten Status auf.

- **`:status`**: `pending`, `approved`, `sent`, `rejected`

**Antwort:** `[Application]`

#### `GET /api/queue/get/:id`

Liefert eine einzelne Bewerbung anhand ihrer ID.

**Antwort:** `Application`

#### `POST /api/queue/approve/:id`

Genehmigt eine einzelne Bewerbung.

**Antwort:** `{ "success": true, "id": 123 }`

#### `POST /api/queue/approve-all`

Genehmigt alle ausstehenden Bewerbungen.

**Antwort:** `{ "success": true, "count": 5 }`

#### `POST /api/queue/reject/:id`

Lehnt eine einzelne Bewerbung ab.

**Antwort:** `{ "success": true, "id": 123 }`

#### `POST /api/queue/send-all`

Versendet alle genehmigten Bewerbungen.

**Antwort:**
```json
{
  "success": true,
  "sent": 10,
  "failed": 0,
  "total": 10
}
```

### 3.4 Batch-Operationen (für LLM)

#### `POST /api/queue/reject-batch`

Lehnt mehrere Bewerbungen anhand von Filterkriterien ab.

**Request Body:**
```json
{
  "filter": {
    "minScore": 0,
    "maxScore": 50,
    "excludeKeywords": ["PHP", "C++"]
  }
}
```

**Antwort:** `{ "success": true, "count": 3 }`

#### `POST /api/queue/approve-batch`

Genehmigt mehrere Bewerbungen anhand von Filterkriterien.

**Request Body:** (siehe oben)

**Antwort:** `{ "success": true, "count": 2 }`

#### `GET /api/queue/list-filtered`

Listet Bewerbungen anhand von Filterkriterien auf.

**Query-Parameter:** `minScore`, `maxScore`, `includeKeywords`, `excludeKeywords`, `remoteOnly`

**Antwort:** `[Application]`

### 3.5 ML-Endpunkte

#### `GET /api/ml/export-training-data`

Exportiert die gesammelten Trainingsdaten als CSV.

**Antwort:** CSV-Datei

### 3.6 Prompt-Verarbeitung

#### `POST /api/prompt/process`

Verarbeitet einen Prompt in natürlicher Sprache.

**Request Body:**
```json
{
  "prompt": "lehne alle bewerbungen mit score unter 60 ab"
}
```

**Antwort:**
```json
{
  "success": true,
  "message": "3 Bewerbungen wurden abgelehnt.",
  "action": "rejectBatch",
  "result": { "count": 3 }
}
```

---

## 4. Datenmodelle

### Application

Siehe [Technische Projektdokumentation](TECHNICAL_PROJECT_DOCUMENTATION.md#41-application-queue).

---

**Ende der API-Dokumentation**
