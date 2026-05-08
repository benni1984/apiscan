# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

**ApiScan** — a beekeeping inspection app for iOS and Android.
Beekeepers scan a QR code on a hive, log inspection data, and view stats over time.

## Claude Code Plugins (project scope)

Plugins installed at project scope for this repo (`claude plugin list`). Pull them with `claude plugin install <name>@claude-plugins-official --scope project` if missing.

| Plugin | Purpose |
|--------|---------|
| `vercel@claude-plugins-official` | Next.js / Vercel guidance for the `web/` Next.js 16 app — covers App Router, Turbopack, AI SDK, AI Gateway, deploys, env, shadcn, routing middleware, and more. Skills load as `vercel:<name>`. |
| `kotlin-lsp@claude-plugins-official` | Kotlin language server for the `android/` Jetpack Compose app — completions, go-to-definition, diagnostics in Kotlin sources. |
| `swift-lsp@claude-plugins-official` | Swift language server for the `ios/` SwiftUI app — same capabilities for `.swift` sources. Note: full Xcode build/test still requires macOS. |
| `frontend-design@claude-plugins-official` (user scope) | Design-quality UI guidance for the `web/` app. |
| `code-review@claude-plugins-official` (user scope) | PR review skill (`/code-review:code-review`). |
| `code-simplifier@claude-plugins-official` (user scope) | Code simplification subagent. |

No logo-design plugin is installed — that workflow is handled ad-hoc.

## Repository Structure

```
apiscan/
  backend/    Python (FastAPI) REST API — shared by both apps
  ios/        Swift / SwiftUI iPhone app
  android/    Kotlin / Jetpack Compose Android app
  web/        Static public map (Leaflet.js, no build step)
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

- Minimum deployment target: iOS 17
- UI framework: SwiftUI
- QR scanning: `AVFoundation` / `DataScannerViewController`
- Networking: `URLSession` with async/await
- Local persistence: SwiftData
- Build: open `ios/ApiScan.xcodeproj` in Xcode (requires macOS)
- Run tests: Cmd+U in Xcode (requires macOS)

## Android (Kotlin / Jetpack Compose)

- Minimum SDK: 26 (Android 8), Target SDK: 35
- UI framework: Jetpack Compose + Material Design 3
- QR scanning: ML Kit Barcode Scanning
- Networking: Retrofit + OkHttp
- Local persistence: Room
- Build: `./gradlew assembleDebug` (from `android/`)
- Run unit tests: `./gradlew test` (from `android/`)
- Run UI tests (requires emulator or device): `./gradlew connectedAndroidTest` (from `android/`)
- Run single UI test class: `./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.apiscan.app.screen.LoginScreenTest`

## Domain Vocabulary

- **Hive** — a single beehive, identified by UUID, has a QR code
- **Inspection** — one visit to a hive with logged data
- **Queen color** — follows SICAMM year cycle (see docs/api-contract.md)
- **Brood frames** — number of frames with brood (0–10)
- **Varroa count** — mite count from sugar roll or alcohol wash

## Git & PR Workflow

After pushing a branch, always open a PR immediately. Once all CI checks are green, merge it — no need to ask first.

## Session Discipline

Always work in one component per session. Do not mix backend, iOS, and Android in the same context window. Start each session by stating which component you are working on.

## Build Order for New Features

1. Update `docs/api-contract.md` first
2. Implement and test backend endpoint
3. Implement iOS consumer
4. Implement Android consumer
5. Commit each step separately

---

## Implementation & Test Status

### Backend — COMPLETE ✓

All routes implemented and tested. Run `pytest` from `backend/`.

| Domain | Endpoints | Tests |
|--------|-----------|-------|
| Auth | POST /auth/register, login, refresh, logout | ✓ test_auth.py |
| Users | GET/PUT /users/me | ✓ test_users.py |
| Apiaries | CRUD /apiaries | ✓ test_apiaries.py |
| Hives | CRUD + QR resolve + QR image | ✓ test_hives.py |
| Inspections | CRUD /hives/{id}/inspections | ✓ test_inspections.py |
| Field Definitions | CRUD, user-scope and apiary-scope | ✓ test_field_definitions.py |
| QR Batches | Generate + PDF download | ✓ test_qr_batches.py |
| Stats | Hive / apiary / overview | ✓ test_stats.py |
| Public API | Global stats + apiary map pins | ✓ test_public.py |

### Android — IMPLEMENTED ✓ / PARTIALLY TESTED

All screens and ViewModels implemented. Unit tests cover all ViewModels and key repositories. UI tests cover the auth and apiary flows.

**Unit tests** (`./gradlew test`) — all passing:

| File | What it covers |
|------|---------------|
| AuthViewModelTest | login/register success + failure, clearError |
| AuthRepositoryTest | token storage, logout edge cases, delegation |
| ApiaryViewModelTest | load, create, update, delete, error states |
| HiveRepositoryTest | QR resolve (linked/unlinked), list, get, delete |
| HiveDetailViewModelTest | initial load, delete inspection, error |
| InspectionRepositoryTest | list with pagination, create, update, delete |
| InspectionFormViewModelTest | create vs. update mode, saved state, errors |
| SettingsViewModelTest | load user, update name/locale, logout |
| DtoTest | QrTokenOut, QRScanResult, PaginatedResponse |

**Missing unit tests** (write next):
- ApiaryRepositoryTest
- QrBatchRepositoryTest
- StatsRepositoryTest
- QRViewModel test

**UI / instrumented tests** (`./gradlew connectedAndroidTest`) — all passing:

| File | What it covers |
|------|---------------|
| LoginScreenTest | fields shown, button disabled when empty, navigate to register, error banner on failure, successful login navigates to apiary list |
| ApiaryScreenTest | empty state (title, empty message, FAB), Settings nav, sign-out dialog, email shown |
| ApiaryWithDataTest | two apiaries rendered, hive counts correct |

**Missing UI tests** (write next):
- RegisterScreenTest
- HiveDetailScreenTest
- InspectionFormScreenTest
- QRBatchListScreenTest
- SettingsScreenTest (update profile, locale)

### iOS — IMPLEMENTED ✓ / NOT TESTED

Full feature parity with Android — all screens and services implemented. **Zero automated tests.** Tests must be written in a macOS session using Xcode / XCTest.

Screens: Login, Register, ApiaryList, ApiaryDetail, ApiaryForm, HiveDetail, HiveInitialize, HiveQR, InspectionForm, InspectionDetail, QRScanner, QRBatchList, HiveStats, Settings.

### Web — COMPLETE ✓

Static public map (`web/`). No build step, no automated tests. Shows apiary pins from `/api/v1/public/stats` and drill-down via `/api/v1/public/apiaries/{id}`.

---

## Android Testing Notes (Lessons Learned)

### MockK + checked exceptions in instrumented tests
**Rule: always throw `RuntimeException` (or a subclass) from MockK stubs in Android instrumented tests, never plain `Exception`.**

When MockK mocks a `suspend fun` via the Android Java proxy and the stub uses `throws Exception("msg")`, the Java proxy wraps the checked exception in `java.lang.reflect.UndeclaredThrowableException`. That wrapper has `message = null`, so any ViewModel code that reads `e.message` silently gets `null` — no error banner, no error state.

Fix in tests: `coEvery { apiService.login(any()) } throws RuntimeException("Invalid credentials")`

Fix in ViewModels for robustness: `e.message ?: e.cause?.message` instead of just `e.message`.

### Hilt test rule ordering
The three rules must be ordered exactly:
```kotlin
@get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
@get:Rule(order = 1) val clearStore  = object : ExternalResource() {
    override fun before() { hiltRule.inject(); tokenStore.clear() }
}
@get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()
```
Order 1 runs `hiltRule.inject()` so `@Inject` fields are available before the activity starts at order 2.

### UI tests do NOT need a running backend
`@UninstallModules(NetworkModule::class)` + `@BindValue val apiService: ApiService = mockk(relaxed = true)` replaces the entire network stack with a MockK mock. No emulator port forwarding or backend process needed.

### Waiting for async results
Use `composeRule.waitUntil(timeoutMillis = 5_000) { onAllNodesWithText("...").fetchSemanticsNodes().isNotEmpty() }` before `assertIsDisplayed()`. Do not rely on `waitForIdle()` alone for ViewModel coroutine results.

### coVerify for confirming mock calls
Add `coVerify(timeout = 3_000) { apiService.login(any()) }` before the `waitUntil` check. If it passes, the mock was reached — helps distinguish "click not registered" from "state not reflected in UI".
