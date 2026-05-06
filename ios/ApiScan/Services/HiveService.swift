import Foundation

protocol HiveServiceProtocol {
    func listForApiary(_ apiaryId: String, page: Int) async throws -> PaginatedResponse<HiveOut>
    func get(_ id: String) async throws -> HiveOut
    func initialize(request: HiveInitializeRequest) async throws -> HiveOut
    func update(_ id: String, request: HiveUpdateRequest) async throws -> HiveOut
    func delete(_ id: String) async throws
    func resolveQR(token: String) async throws -> QRScanResult
    func qrImageURL(hiveId: String) -> URL
}

extension HiveServiceProtocol {
    func listForApiary(_ apiaryId: String) async throws -> PaginatedResponse<HiveOut> {
        try await listForApiary(apiaryId, page: 1)
    }
}

struct HiveService: HiveServiceProtocol {
    private let client = APIClient.shared

    func listForApiary(_ apiaryId: String, page: Int = 1) async throws -> PaginatedResponse<HiveOut> {
        try await client.get("apiaries/\(apiaryId)/hives?page=\(page)&per_page=50")
    }

    func get(_ id: String) async throws -> HiveOut {
        try await client.get("hives/\(id)")
    }

    func initialize(request: HiveInitializeRequest) async throws -> HiveOut {
        try await client.post("hives/initialize", body: request)
    }

    func update(_ id: String, request: HiveUpdateRequest) async throws -> HiveOut {
        try await client.put("hives/\(id)", body: request)
    }

    func delete(_ id: String) async throws {
        try await client.delete("hives/\(id)")
    }

    func resolveQR(token: String) async throws -> QRScanResult {
        let url = "hives/by-qr/\(token)"
        let data: Data = try await client.get(url)

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        if let unlinked = try? decoder.decode(QRUnlinkedResponse.self, from: data), unlinked.status == "unlinked" {
            return .unlinked(token: unlinked.token)
        }
        let hive = try decoder.decode(HiveOut.self, from: data)
        return .linked(hive)
    }

    func qrImageURL(hiveId: String) -> URL {
        APIClient.shared.baseURL.appendingPathComponent("hives/\(hiveId)/qr")
    }
}
