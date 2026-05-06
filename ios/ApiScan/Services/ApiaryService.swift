import Foundation

protocol ApiaryServiceProtocol {
    func list(page: Int) async throws -> PaginatedResponse<ApiaryOut>
    func get(_ id: String) async throws -> ApiaryOut
    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut
    func update(_ id: String, name: String?, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut
    func delete(_ id: String) async throws
    func fieldDefinitions(_ apiaryId: String) async throws -> [FieldDefinitionOut]
    func createFieldDefinition(_ apiaryId: String, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut
    func deleteFieldDefinition(_ apiaryId: String, fieldId: String) async throws
}

extension ApiaryServiceProtocol {
    func list() async throws -> PaginatedResponse<ApiaryOut> { try await list(page: 1) }
}

struct ApiaryService: ApiaryServiceProtocol {
    private let client = APIClient.shared

    func list(page: Int = 1) async throws -> PaginatedResponse<ApiaryOut> {
        try await client.get("apiaries?page=\(page)&per_page=50")
    }

    func get(_ id: String) async throws -> ApiaryOut {
        try await client.get("apiaries/\(id)")
    }

    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut {
        let body = ApiaryCreate(name: name, description: description, latitude: latitude, longitude: longitude, address: address)
        return try await client.post("apiaries", body: body)
    }

    func update(_ id: String, name: String?, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut {
        let body = ApiaryCreate(name: name ?? "", description: description, latitude: latitude, longitude: longitude, address: address)
        return try await client.put("apiaries/\(id)", body: body)
    }

    func delete(_ id: String) async throws {
        try await client.delete("apiaries/\(id)")
    }

    func fieldDefinitions(_ apiaryId: String) async throws -> [FieldDefinitionOut] {
        try await client.get("apiaries/\(apiaryId)/field-definitions")
    }

    func createFieldDefinition(_ apiaryId: String, body: FieldDefinitionCreate) async throws -> FieldDefinitionOut {
        try await client.post("apiaries/\(apiaryId)/field-definitions", body: body)
    }

    func deleteFieldDefinition(_ apiaryId: String, fieldId: String) async throws {
        try await client.delete("apiaries/\(apiaryId)/field-definitions/\(fieldId)")
    }
}
