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

### Android — IMPLEMENTED ✓ / FULLY TESTED ✓

All screens and ViewModels implemented and tested. Unit tests run with `./gradlew test`. UI/instrumented tests run with `./gradlew connectedAndroidTest` (requires emulator or device, also run in CI via `android-ui` job).

**Unit tests** (`./gradlew test`) — all passing:

| File | What it covers |
|------|---------------|
| AuthViewModelTest | login/register success + failure, clearError |
| AuthRepositoryTest | token storage, logout edge cases, delegation |
| ApiaryViewModelTest | load, create, update, delete, error states |
| ApiaryRepositoryTest | list, get, create, update, delete, fieldDefinitions |
| HiveRepositoryTest | QR resolve (linked/unlinked), list, get, delete |
| HiveDetailViewModelTest | initial load, delete inspection, error |
| InspectionRepositoryTest | list with pagination, create, update, delete |
| InspectionFormViewModelTest | create vs. update mode, saved state, errors |
| QrBatchRepositoryTest | list, get, create |
| StatsRepositoryTest | hiveStats, apiaryStats with all params |
| QRViewModelTest | QRScan resolve linked/unlinked/error, QRBatchList load/create |
| SettingsViewModelTest | load user, update name/locale, logout |
| DtoTest | QrTokenOut, QRScanResult, PaginatedResponse |

**UI / instrumented tests** (`./gradlew connectedAndroidTest`) — all passing:

| File | What it covers |
|------|---------------|
| LoginScreenTest | fields shown, button disabled when empty, navigate to register, error banner on failure, successful login navigates to apiary list |
| RegisterScreenTest | fields shown, button state, error banner, success navigates to apiary list |
| ApiaryScreenTest | empty state (title, empty message, FAB), Settings nav, sign-out dialog, email shown |
| ApiaryWithDataTest | two apiaries rendered, hive counts correct |
| HiveDetailScreenTest | hive name, hive type, empty inspections, inspection date, FAB navigates to form |
| InspectionFormScreenTest | form sections shown, save success, save error banner |
| QRBatchListScreenTest | nav title, empty state, FAB, batch creation |
| SettingsScreenTest | email shown, language section, save on name edit, error banner |

### iOS — IMPLEMENTED ✓ / TESTED VIA CI ✓

Full feature parity with Android. Tests run via GitHub Actions CI on `macos-latest` whenever `ios/` changes (both PRs and pushes to main). Tests can be authored on any OS and run in CI without needing a local macOS machine.

**How iOS CI works:**
- `ci.yml` `ios` job: path-filtered, uses `macos-latest` when `ios/` changed
- XcodeGen regenerates the `.xcodeproj` from `ios/project.yml` on the runner
- `xcodebuild test` runs both unit tests (`ApiScanTests`) and UI tests (`ApiScanUITests`) on an iPhone 16 simulator
- Results uploaded as `ios-test-results.xcresult` artifact

**Mock infrastructure for UI tests** (`ios/ApiScan/Testing/MockURLProtocol.swift`, `#if DEBUG` only):
- Register `MockURLProtocol` via `URLSessionConfiguration.protocolClasses` to intercept all URLSession requests
- Pre-configured handler sets: `authenticatedHandlers`, `apiaryWithHiveHandlers`, `unauthenticatedHandlers`
- Activated via launch arguments in `ApiScanApp.init()`:
  - `-mockAuthenticated` — sets fake keychain token + empty-list mock responses
  - `-mockApiaryWithHive` — sets token + one apiary with one hive for deep-navigation tests
  - `-mockServer` — mock responses only, no token (for Login/Register success-path tests)

**Unit tests** (XCTest, `ApiScanTests/`) — all passing in CI:

| File | What it covers |
|------|---------------|
| AuthViewModelTests | login/register success + failure, logout, loadProfile, updateProfile |
| ApiaryViewModelTests | load, create, update, delete, errorMessage |
| HiveViewModelTests | load, initialize, delete, update, resolveQR linked/unlinked |
| InspectionViewModelTests | load, create, delete, update, loadMore pagination |
| DTOTests | JSONValue roundtrip, PaginatedResponse snake_case, QrTokenOut, UserOut, InspectionOut |

**UI tests** (XCUITest, `ApiScanUITests/`) — all passing in CI:

| File | What it covers |
|------|---------------|
| LoginUITests | fields shown, button state, navigate to register |
| RegisterUITests | fields shown, button state, success navigates to Apiaries |
| ApiaryListUITests | title, empty state, FAB, apiary name shown, navigate into apiary |
| HiveDetailUITests | hive name, hive type, empty inspections, New Inspection button opens form |
| InspectionFormUITests | title, date/queen/frames sections, Save/Cancel buttons, Cancel dismisses |
| SettingsUITests | email shown, language options, Save Profile button, Log Out button |
| QRBatchListUITests | title, empty state, FAB |

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

## iOS Testing Notes (Lessons Learned)

### Running iOS tests without macOS
Write test files locally (any OS), push to a branch, open a PR — the `ios` CI job on `macos-latest` compiles and runs everything via `xcodebuild test`. The `.xcresult` bundle is uploaded as an artifact for inspection.

### MockURLProtocol pattern
`MockURLProtocol` intercepts all requests for a `URLSession` built with `URLSessionConfiguration.ephemeral` + `protocolClasses = [MockURLProtocol.self]`. The handler list is ordered: **most-specific patterns first**. Example for paths that share prefixes:
```
("hives/h-1/inspections", ...) // before "hives/h-1"
("apiaries/a-1/hives",    ...) // before "apiaries/a-1"
("apiaries/a-1",          ...) // before "apiaries"
("apiaries",              ...) // catch-all
```

### Launch argument contract
| Argument | Effect |
|----------|--------|
| `-resetKeychain` | Clears all tokens — app starts at Login |
| `-mockAuthenticated` | Clears keychain, sets fake token, mounts empty-list mock — app starts at Apiaries |
| `-mockApiaryWithHive` | Same as above but mock returns one apiary + one hive |
| `-mockServer` | Mounts mock only (no token) — app starts at Login, auth calls return real-looking responses |

Do NOT mix `-mockAuthenticated` / `-mockApiaryWithHive` with `-resetKeychain` (the mock flags already clear the keychain first).

### coVerify for confirming mock calls
Add `coVerify(timeout = 3_000) { apiService.login(any()) }` before the `waitUntil` check. If it passes, the mock was reached — helps distinguish "click not registered" from "state not reflected in UI".
