# ApiScan — API Contract

Base URL: `http://<host>:8000/api/v1`

## Authentication
All requests require header: `Authorization: Bearer <token>`

---

## Hives

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives` | List all hives |
| POST | `/hives` | Create a hive |
| GET | `/hives/{id}` | Get hive detail |
| PUT | `/hives/{id}` | Update hive |
| DELETE | `/hives/{id}` | Delete hive |
| GET | `/hives/{id}/qr` | Generate QR code for hive |

## Inspections

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/inspections` | List inspections for a hive |
| POST | `/hives/{id}/inspections` | Add new inspection |
| GET | `/inspections/{id}` | Get single inspection |

## Stats

| Method | Path | Description |
|--------|------|-------------|
| GET | `/hives/{id}/stats` | Aggregated stats for one hive |
| GET | `/stats/overview` | Overview across all hives |

---

## Inspection object (POST body)

```json
{
  "date": "2026-04-23",
  "queen_seen": true,
  "queen_color": "white",
  "brood_frames": 4,
  "honey_frames": 3,
  "mood": "calm",
  "varroa_count": 2,
  "notes": "Free text notes"
}
```

### Field reference

| Field | Type | Values |
|-------|------|--------|
| queen_seen | bool | true / false |
| queen_color | string | white / yellow / red / green / blue |
| brood_frames | int | 0–10 |
| honey_frames | int | 0–10 |
| mood | string | calm / nervous / aggressive |
| varroa_count | int | count from sugar roll / alcohol wash |
| notes | string | free text |

### Queen color convention (SICAMM year cycle)
- White — years ending 1 or 6
- Yellow — years ending 2 or 7
- Red — years ending 3 or 8
- Green — years ending 4 or 9
- Blue — years ending 5 or 0
