import Foundation

struct InspectionService {
    private let client = APIClient.shared

    func list(hiveId: String, page: Int = 1) async throws -> PaginatedResponse<InspectionOut> {
        try await client.get("hives/\(hiveId)/inspections?page=\(page)&per_page=20")
    }

    func get(_ id: String) async throws -> InspectionOut {
        try await client.get("inspections/\(id)")
    }

    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await client.post("hives/\(hiveId)/inspections", body: request)
    }

    func update(_ id: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        try await client.put("inspections/\(id)", body: request)
    }

    func delete(_ id: String) async throws {
        try await client.delete("inspections/\(id)")
    }
}
