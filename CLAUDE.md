# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**ApiScan** — a beekeeping inspection app for iOS and Android.
Beekeepers scan a QR code on a hive, log inspection data, and view stats over time.

## Repository Structure

```
apiscan/
  backend/    Python (FastAPI) REST API — shared by both apps
  ios/        Swift / SwiftUI iPhone app
  android/    Kotlin / Jetpack Compose Android app
  docs/       API contract and architecture notes
```

## API Contract

The source of truth for all endpoints, request/response shapes, and field enums is `docs/api-contract.md`. Both app sessions must stay in sync with this file. When adding a new endpoint, update the contract first, then implement in backend, then consume in apps.

## Backend (FastAPI / Python)

- Entry point: `backend/main.py`
- Run dev server: `uvicorn main:app --reload` (from `backend/`)
- Run tests: `pytest` (from `backend/`)
- Database: SQLite for development, PostgreSQL for production
- ORM: SQLAlchemy with Alembic for migrations
- QR code generation: `qrcode` library, encodes hive UUID

## iOS (Swift / SwiftUI)

- Minimum deployment target: iOS 16
- UI framework: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` with async/await
- Local persistence: SwiftData
- Build: open `ios/ApiScan.xcodeproj` in Xcode (requires macOS)

## Android (Kotlin / Jetpack Compose)

- Minimum SDK: 26 (Android 8)
- Target SDK: 35
- UI framework: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: Room
- Build: `./gradlew assembleDebug` (from `android/`)
- Test: `./gradlew test` (from `android/`)

## Domain Vocabulary

- **Hive** — a single beehive, identified by UUID, has a QR code
- **Inspection** — one visit to a hive with logged data
- **Queen color** — follows SICAMM year cycle (see docs/api-contract.md)
- **Brood frames** — number of frames with brood (0–10)
- **Varroa count** — mite count from sugar roll or alcohol wash

## Session Discipline

Always work in one component per session. Do not mix backend, iOS, and Android in the same context window. Start each session by stating which component you are working on.

## Build Order for New Features

1. Update `docs/api-contract.md` first
2. Implement and test backend endpoint
3. Implement iOS consumer
4. Implement Android consumer
5. Commit each step separately
