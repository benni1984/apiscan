# ApiScan — API Contract

Base URL: `http://<host>:8000/api/v1`

All endpoints require `Authorization: Bearer <access_token>` unless marked **public**.

---

## Table of Contents

1. [Conventions](#conventions)
2. [Auth](#auth)
3. [Users & Preferences](#users--preferences)
4. [Custom Field Definitions](#custom-field-definitions)
5. [Apiaries](#apiaries)
6. [QR Batches](#qr-batches)
7. [Hives](#hives)
8. [Inspections](#inspections)
9. [Stats](#stats)
10. [Public Dashboard](#public-dashboard)
11. [Object Reference](#object-reference)
12. [Error Codes](#error-codes)

---

## Conventions

### Pagination

All list endpoints accept:

| Query param | Default | Description |
|-------------|---------|-------------|
| `page` | 1 | Page number |
| `per_page` | 20 | Items per page (max 100) |

List responses wrap items in:

```json
{
  "items": [],
  "total": 42,
  "page": 1,
  "per_page": 20,
  "pages": 3
}
```

### Dates & Times

- Dates: `YYYY-MM-DD`
- Datetimes: ISO 8601 UTC, e.g. `2026-04-26T14:30:00Z`

### Localisation

The API returns error messages in the language indicated by the `Accept-Language` request header (`en`, `fr`, `de`). All other user-facing strings (field names, labels) are managed client-side. The user's preferred locale is stored on the user object.

### Error envelope

```json
{
  "error": {
    "code": "HIVE_NOT_FOUND",
    "message": "No hive found with the given ID."
  }
}
```

---

## Auth

All auth endpoints are **public** (no token required).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Obtain token pair |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |

### POST `/auth/register`

**Request**
```json
{
  "email": "user@example.com",
  "password": "string (min 8 chars)",
  "name": "string",
  "locale": "en"
}
```

**Response 201**
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "user": { /* User object */ }
}
```

### POST `/auth/login`

**Request**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Response 200** — same shape as register.

### POST `/auth/refresh`

**Request**
```json
{ "refresh_token": "string" }
```

**Response 200**
```json
{ "access_token": "string" }
```

### POST `/auth/logout`

**Request**
```json
{ "refresh_token": "string" }
```

**Response 204** — no body.

---

## Users & Preferences

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get own profile |
| PUT | `/users/me` | Update profile |

### User object

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "locale": "en | fr | de",
  "created_at": "datetime"
}
```

### PUT `/users/me`

All fields optional.

```json
{
  "name": "string",
  "locale": "en | fr | de"
}
```

---

## Custom Field Definitions

Custom fields extend the built-in hive and inspection fields. Definitions are scoped either to the **user** (apply to all hives/inspections) or to a specific **apiary** (apply only within that location). When rendering a form, merge user-scope and apiary-scope definitions; apiary-scope takes precedence on name conflicts.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/field-definitions` | List all definitions (user-scope) |
| POST | `/field-definitions` | Create user-scope definition |
| PUT | `/field-definitions/{id}` | Update definition |
| DELETE | `/field-definitions/{id}` | Delete definition |
| GET | `/apiaries/{id}/field-definitions` | List apiary-scope definitions |
| POST | `/apiaries/{id}/field-definitions` | Create apiary-scope definition |
| PUT | `/apiaries/{id}/field-definitions/{fid}` | Update apiary-scope definition |
| DELETE | `/apiaries/{id}/field-definitions/{fid}` | Delete apiary-scope definition |

### FieldDefinition object

```json
{
  "id": "uuid",
  "scope": "user | apiary",
  "apiary_id": "uuid | null",
  "target": "hive | inspection",
  "name": "string",
  "type": "text | number | boolean | date | select",
  "options": ["string"],
  "required": false,
  "default_value": "any | null",
  "sort_order": 0
}
```

`options` is only used when `type` is `select`.

### POST `/field-definitions` — Request body

```json
{
  "target": "hive | inspection",
  "name": "string",
  "type": "text | number | boolean | date | select",
  "options": ["string"],
  "required": false,
  "default_value": null,
  "sort_order": 0
}
```

---

## Apiaries

An apiary is a named location. Hives belong to exactly one apiary.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiaries` | List apiaries |
| POST | `/apiaries` | Create apiary |
| GET | `/apiaries/{id}` | Get apiary detail |
| PUT | `/apiaries/{id}` | Update apiary |
| DELETE | `/apiaries/{id}` | Delete apiary (must have no hives) |

### Apiary object

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "float | null",
  "longitude": "float | null",
  "address": "string | null",
  "hive_count": 3,
  "is_public": false,
  "created_at": "datetime"
}
```

`is_public` controls whether this apiary appears on the public map. Defaults to `false` (opt-in). Apiaries with `is_public = false` are invisible to the public endpoints even if they have GPS coordinates.

### POST / PUT `/apiaries` — Request body

```json
{
  "name": "Garden apiary",
  "description": "string | null",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "address": "string | null",
  "is_public": false
}
```

---

## QR Batches

QR codes are generated in advance ("pre-printed"), before any hive exists. Each token in a batch is an unlinked UUID. When a user scans an unlinked token for the first time, the app starts the hive initialisation wizard.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/qr-batches` | List batches |
| POST | `/qr-batches` | Generate a new batch |
| GET | `/qr-batches/{id}` | Get batch with all tokens |
| GET | `/qr-batches/{id}/pdf` | Download printable PDF (`application/pdf`) |

### POST `/qr-batches` — Request body

```json
{ "count": 5 }
```

`count` must be between 1 and 50.

### QrBatch object

```json
{
  "id": "uuid",
  "count": 5,
  "created_at": "datetime",
  "tokens": [
    {
      "token": "string (uuid)",
      "linked_hive_id": "uuid | null"
    }
  ]
}
```

The PDF endpoint returns a printable A4 document with one QR code per label.

---

## Hives

### Scan / resolve a QR token

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/by-qr/{token}` | Resolve QR token |

**Response — token is linked**

HTTP 200, returns the full Hive object.

**Response — token exists but is unlinked**

HTTP 200:
```json
{ "status": "unlinked", "token": "string" }
```

The app should start the hive initialisation wizard and call `POST /hives/initialize`.

**Response — token unknown**

HTTP 404, error code `QR_TOKEN_NOT_FOUND`.

---

### Hive CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/apiaries/{id}/hives` | List hives in an apiary |
| POST | `/hives/initialize` | Link a QR token to a new hive |
| GET | `/hives/{id}` | Get hive detail |
| PUT | `/hives/{id}` | Update hive |
| DELETE | `/hives/{id}` | Delete hive and all inspections |
| GET | `/hives/{id}/qr` | Get QR image (`image/png`) |

### Hive object

```json
{
  "id": "uuid",
  "qr_token": "string",
  "apiary_id": "uuid",
  "name": "string",
  "hive_type": "langstroth | dadant | top_bar | warre | other",
  "latitude": "float | null",
  "longitude": "float | null",
  "acquisition_date": "date | null",
  "notes": "string | null",
  "custom_fields": {
    "<field_definition_id>": "value"
  },
  "initialized_at": "datetime",
  "last_inspection_at": "datetime | null",
  "created_at": "datetime"
}
```

### POST `/hives/initialize` — Request body

GPS coordinates are captured by the mobile app on the first scan and sent here.

```json
{
  "qr_token": "string",
  "apiary_id": "uuid",
  "name": "Hive 3",
  "hive_type": "langstroth",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "acquisition_date": "2026-04-01",
  "notes": "string | null",
  "custom_fields": {}
}
```

**Response 201** — full Hive object.

Errors: `QR_TOKEN_NOT_FOUND`, `QR_TOKEN_ALREADY_LINKED`.

### PUT `/hives/{id}` — Request body

All fields optional.

```json
{
  "apiary_id": "uuid",
  "name": "string",
  "hive_type": "langstroth | dadant | top_bar | warre | other",
  "latitude": "float | null",
  "longitude": "float | null",
  "acquisition_date": "date | null",
  "notes": "string | null",
  "custom_fields": {}
}
```

---

## Inspections

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/inspections` | List inspections (paginated, newest first) |
| POST | `/hives/{id}/inspections` | Add inspection |
| GET | `/inspections/{id}` | Get single inspection |
| PUT | `/inspections/{id}` | Update inspection |
| DELETE | `/inspections/{id}` | Delete inspection |

### Inspection object

```json
{
  "id": "uuid",
  "hive_id": "uuid",
  "date": "2026-04-23",
  "queen_seen": "boolean | null",
  "queen_color": "white | yellow | red | green | blue | null",
  "brood_frames": "integer 0–10 | null",
  "honey_frames": "integer 0–10 | null",
  "mood": "calm | nervous | aggressive | null",
  "population_strength": "integer 1–5 | null",
  "varroa_count": "integer | null",
  "swarm_cells_seen": "boolean | null",
  "treatment_applied": "string | null",
  "feeding_done": "boolean | null",
  "feeding_type": "string | null",
  "weight_kg": "float | null",
  "notes": "string | null",
  "custom_fields": {
    "<field_definition_id>": "value"
  },
  "created_at": "datetime"
}
```

### Queen color — SICAMM year cycle

| Color | Years ending |
|-------|-------------|
| White | 1 or 6 |
| Yellow | 2 or 7 |
| Red | 3 or 8 |
| Green | 4 or 9 |
| Blue | 5 or 0 |

### POST / PUT `/hives/{id}/inspections` — Request body

All inspection fields are optional. Send only what was recorded during the visit.

```json
{
  "date": "2026-04-23",
  "queen_seen": true,
  "queen_color": "white",
  "brood_frames": 4,
  "honey_frames": 3,
  "mood": "calm",
  "population_strength": 4,
  "varroa_count": 2,
  "swarm_cells_seen": false,
  "treatment_applied": "Oxalic acid",
  "feeding_done": false,
  "feeding_type": null,
  "weight_kg": 34.5,
  "notes": "Free text notes",
  "custom_fields": {}
}
```

---

## Stats

Stats can be filtered by a preset window or an explicit date range. Both query parameters are optional; if neither is supplied the full history is used.

| Query param | Values | Description |
|-------------|--------|-------------|
| `preset` | `30d \| 90d \| 365d \| all` | Preset time window |
| `from` | `YYYY-MM-DD` | Start of custom range |
| `to` | `YYYY-MM-DD` | End of custom range |

`preset` and `from`/`to` are mutually exclusive. `from`/`to` take precedence.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/stats` | Stats for one hive |
| GET | `/apiaries/{id}/stats` | Aggregated stats for all hives in apiary |
| GET | `/stats/overview` | Overview across all apiaries |

### HiveStats object

```json
{
  "hive_id": "uuid",
  "period": {
    "from": "date",
    "to": "date",
    "preset": "30d | 90d | 365d | all | custom"
  },
  "inspection_count": 12,
  "days_since_last_inspection": 7,
  "queen_seen_rate": 0.83,
  "mood_distribution": {
    "calm": 9,
    "nervous": 2,
    "aggressive": 1
  },
  "swarm_cells_count": 1,
  "treatments": [
    { "date": "2026-03-01", "treatment": "Oxalic acid" }
  ],
  "varroa_trend": [
    { "date": "2026-04-01", "value": 3 }
  ],
  "brood_frames_trend": [{ "date": "date", "value": "int" }],
  "honey_frames_trend": [{ "date": "date", "value": "int" }],
  "population_strength_trend": [{ "date": "date", "value": "int" }],
  "weight_trend": [{ "date": "date", "value": "float" }],
  "custom_field_stats": {
    "<field_definition_id>": {
      "field_name": "string",
      "type": "number | boolean | select | text | date",
      "trend": [{ "date": "date", "value": "any" }],
      "distribution": { "option_a": 4, "option_b": 2 }
    }
  }
}
```

`trend` is returned for `number` and `date` types. `distribution` is returned for `boolean` and `select` types. `text` fields are omitted from stats.

### ApiaryStats object

```json
{
  "apiary_id": "uuid",
  "period": { "from": "date", "to": "date", "preset": "string" },
  "hive_count": 5,
  "inspections_total": 48,
  "hives_inspected_last_30d": 4,
  "hives_not_inspected_30d": 1,
  "average_varroa": 2.1,
  "average_brood_frames": 4.8,
  "average_honey_frames": 3.2,
  "mood_distribution": { "calm": 40, "nervous": 6, "aggressive": 2 },
  "swarm_alerts": 2,
  "per_hive": [ /* array of HiveStats summary */ ]
}
```

### OverviewStats object

```json
{
  "period": { "from": "date", "to": "date", "preset": "string" },
  "apiary_count": 3,
  "hive_count": 14,
  "inspections_total": 130,
  "per_apiary": [ /* array of ApiaryStats summary */ ]
}
```

---

## Export

All export endpoints require authentication. The authenticated user must own the hive or apiary.

### `GET /hives/{hive_id}/inspections/export`

Download all inspections for a single hive.

| Query param | Type | Default | Values |
|-------------|------|---------|--------|
| `format` | string | `json` | `json`, `csv` |

**JSON response** (`application/json`, `Content-Disposition: attachment; filename="hive_{id}_inspections.json"`):
```json
[ /* array of InspectionOut objects, newest first */ ]
```

**CSV response** (`text/csv`, `Content-Disposition: attachment; filename="hive_{id}_inspections.csv"`):
Flat rows with columns: `id`, `hive_id`, `date`, `queen_seen`, `queen_color`, `brood_frames`, `honey_frames`, `mood`, `population_strength`, `varroa_count`, `swarm_cells_seen`, `treatment_applied`, `feeding_done`, `feeding_type`, `weight_kg`, `notes`, `created_at`, followed by one column per distinct custom-field key found across all inspections.

---

### `GET /apiaries/{apiary_id}/inspections/export`

Download all inspections for every hive in an apiary.

| Query param | Type | Default | Values |
|-------------|------|---------|--------|
| `format` | string | `json` | `json`, `csv` |

**JSON response**: same structure as the hive endpoint — flat array of `InspectionOut` objects.

**CSV response**: same columns as the hive endpoint plus a leading `hive_name` column identifying which hive each row belongs to.

---

## Public Dashboard

All endpoints in this section are **public** — no `Authorization` header required.
They expose only aggregate, anonymised data. Individual inspection records and user identity are never exposed.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/stats` | Global aggregate stats + all apiary pins |
| GET | `/public/apiaries/{id}` | Public detail for one apiary |

---

### GET `/public/stats`

Returns platform-wide aggregate numbers and the coordinates of every apiary that has opted in to the public map, for use as map markers.

**Response 200**

```json
{
  "apiary_count": 12,
  "hive_count": 87,
  "inspection_count": 634,
  "apiaries": [
    {
      "id": "uuid",
      "name": "string",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "hive_count": 7
    }
  ]
}
```

All counts (`apiary_count`, `hive_count`, `inspection_count`) and the `apiaries` pin list include **only** apiaries where `is_public = true AND latitude != null AND longitude != null`.

---

### GET `/public/apiaries/{id}`

Returns a public summary of one apiary: location, hives, and aggregated inspection activity. No user-identifiable information is included.

**Response 200**

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "latitude": "float | null",
  "longitude": "float | null",
  "address": "string | null",
  "hive_count": 7,
  "inspection_count": 52,
  "last_inspection_date": "date | null",
  "average_varroa": 2.1,
  "mood_distribution": { "calm": 40, "nervous": 8, "aggressive": 2 },
  "hives": [
    {
      "id": "uuid",
      "name": "string",
      "hive_type": "langstroth",
      "last_inspection_date": "date | null"
    }
  ]
}
```

**Response 404** — `APIARY_NOT_FOUND` (also returned when the apiary exists but `is_public = false`)

---

## Object Reference

### Enums

| Enum | Values |
|------|--------|
| `locale` | `en`, `fr`, `de` |
| `hive_type` | `langstroth`, `dadant`, `top_bar`, `warre`, `other` |
| `queen_color` | `white`, `yellow`, `red`, `green`, `blue` |
| `mood` | `calm`, `nervous`, `aggressive` |
| `field_type` | `text`, `number`, `boolean`, `date`, `select` |
| `field_scope` | `user`, `apiary` |
| `field_target` | `hive`, `inspection` |
| `stats_preset` | `30d`, `90d`, `365d`, `all` |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `TOKEN_INVALID` | 401 | Token cannot be verified |
| `FORBIDDEN` | 403 | Resource belongs to another user |
| `USER_NOT_FOUND` | 404 | — |
| `APIARY_NOT_FOUND` | 404 | — |
| `HIVE_NOT_FOUND` | 404 | — |
| `INSPECTION_NOT_FOUND` | 404 | — |
| `FIELD_DEFINITION_NOT_FOUND` | 404 | — |
| `QR_BATCH_NOT_FOUND` | 404 | — |
| `QR_TOKEN_NOT_FOUND` | 404 | Token does not exist in any batch |
| `QR_TOKEN_ALREADY_LINKED` | 409 | Token is already assigned to a hive |
| `APIARY_HAS_HIVES` | 409 | Cannot delete apiary while hives exist |
| `EMAIL_ALREADY_REGISTERED` | 409 | — |
| `VALIDATION_ERROR` | 422 | Request body failed validation (details in `error.fields`) |
| `QR_BATCH_LIMIT_EXCEEDED` | 422 | Requested count > 50 |
