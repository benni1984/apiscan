import Foundation
@testable import ApiScan

// MARK: - Test helpers

func makeUser(id: String = "u-1", name: String = "Test User") -> UserOut {
    UserOut(id: id, email: "test@example.com", name: name, locale: "en", createdAt: Date())
}

func makeApiary(id: String = "a-1", name: String = "Test Apiary") -> ApiaryOut {
    ApiaryOut(id: id, name: name, description: nil, latitude: nil, longitude: nil,
              address: nil, hiveCount: 0, createdAt: Date())
}

func makeHive(id: String = "h-1", name: String = "Test Hive") -> HiveOut {
    HiveOut(id: id, qrToken: "tok-\(id)", apiaryId: "a-1", name: name,
            hiveType: "langstroth", latitude: nil, longitude: nil,
            acquisitionDate: nil, notes: nil, customFields: [:],
            initializedAt: Date(), lastInspectionAt: nil, createdAt: Date())
}

func makeInspection(id: String = "i-1") -> InspectionOut {
    InspectionOut(id: id, hiveId: "h-1", date: "2024-06-01",
                  queenSeen: nil, queenColor: nil, broodFrames: nil, honeyFrames: nil,
                  mood: nil, populationStrength: nil, varroaCount: nil,
                  swarmCellsSeen: nil, treatmentApplied: nil, feedingDone: nil,
                  feedingType: nil, weightKg: nil, notes: nil,
                  customFields: [:], createdAt: Date())
}

func makeTokenResponse() -> TokenResponse {
    TokenResponse(accessToken: "access-tok", refreshToken: "refresh-tok", user: makeUser())
}

func makePage<T>(_ items: [T], page: Int = 1, pages: Int = 1, perPage: Int = 50) -> PaginatedResponse<T> where T: Codable {
    PaginatedResponse(items: items, total: items.count, page: page, perPage: perPage, pages: pages)
}

// MARK: - MockAuthService

final class MockAuthService: AuthServiceProtocol {
    var loginResult: Result<TokenResponse, Error> = .success(makeTokenResponse())
    var registerResult: Result<TokenResponse, Error> = .success(makeTokenResponse())
    var getMeResult: Result<UserOut, Error> = .success(makeUser())
    var updateMeResult: Result<UserOut, Error> = .success(makeUser())

    func login(email: String, password: String) async throws -> TokenResponse { try loginResult.get() }
    func register(email: String, password: String, name: String, locale: String) async throws -> TokenResponse { try registerResult.get() }
    func logout(refreshToken: String) async throws {}
    func getMe() async throws -> UserOut { try getMeResult.get() }
    func updateMe(name: String?, locale: String?) async throws -> UserOut { try updateMeResult.get() }
}

// MARK: - MockApiaryService

final class MockApiaryService: ApiaryServiceProtocol {
    var listResult: Result<PaginatedResponse<ApiaryOut>, Error> = .success(makePage([]))
    var createResult: Result<ApiaryOut, Error> = .success(makeApiary())
    var updateResult: Result<ApiaryOut, Error> = .success(makeApiary())
    var deleteError: Error? = nil

    func list(page: Int) async throws -> PaginatedResponse<ApiaryOut> { try listResult.get() }
    func get(_ id: String) async throws -> ApiaryOut { makeApiary(id: id) }
    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut { try createResult.get() }
    func update(_ id: String, name: String?, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut { try updateResult.get() }
    func delete(_ id: String) async throws { if let err = deleteError { throw err } }
    func fieldDefinitions(_ apiaryId: String) async throws -> [FieldDefinitionOut] { [] }
    func userFieldDefinitions() async throws -> [FieldDefinitionOut] { [] }
    func createFieldDefinition(_ apiaryId: String, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut {
        FieldDefinitionOut(id: "fd-1", scope: "apiary", apiaryId: apiaryId,
                           target: body.target, name: body.name, type: body.type,
                           options: body.options, required: body.required, sortOrder: body.sortOrder)
    }
    func deleteFieldDefinition(_ apiaryId: String, fieldId: String) async throws {}
}

// MARK: - MockHiveService

final class MockHiveService: HiveServiceProtocol {
    var listResult: Result<PaginatedResponse<HiveOut>, Error> = .success(makePage([]))
    var resolveResult: QRScanResult = .unlinked(token: "test-token")
    var deleteError: Error? = nil

    func listForApiary(_ apiaryId: String, page: Int) async throws -> PaginatedResponse<HiveOut> { try listResult.get() }
    func get(_ id: String) async throws -> HiveOut { makeHive(id: id) }
    func initialize(request: HiveInitializeRequest) async throws -> HiveOut { makeHive(id: "h-new", name: request.name) }
    func update(_ id: String, request: HiveUpdateRequest) async throws -> HiveOut { makeHive(id: id, name: request.name ?? "Updated") }
    func delete(_ id: String) async throws { if let err = deleteError { throw err } }
    func resolveQR(token: String) async throws -> QRScanResult { resolveResult }
    func qrImageURL(hiveId: String) -> URL { URL(string: "https://example.com/hives/\(hiveId)/qr")! }
}

// MARK: - MockInspectionService

final class MockInspectionService: InspectionServiceProtocol {
    var listResult: Result<PaginatedResponse<InspectionOut>, Error> = .success(makePage([], perPage: 20))
    var createResult: Result<InspectionOut, Error> = .success(makeInspection())
    var updateResult: Result<InspectionOut, Error> = .success(makeInspection())
    var deleteError: Error? = nil

    func list(hiveId: String, page: Int) async throws -> PaginatedResponse<InspectionOut> { try listResult.get() }
    func get(_ id: String) async throws -> InspectionOut { makeInspection(id: id) }
    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut { try createResult.get() }
    func update(_ id: String, request: InspectionCreateRequest) async throws -> InspectionOut { try updateResult.get() }
    func delete(_ id: String) async throws { if let err = deleteError { throw err } }
}
