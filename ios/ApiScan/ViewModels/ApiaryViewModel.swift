import Foundation

@MainActor
final class ApiaryViewModel: ObservableObject {
    @Published var apiaries: [ApiaryOut] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service = ApiaryService()

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.list()
            apiaries = resp.items
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func create(name: String, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws -> ApiaryOut {
        let apiary = try await service.create(name: name, description: description, latitude: latitude, longitude: longitude, address: address)
        apiaries.append(apiary)
        return apiary
    }

    func update(_ id: String, name: String, description: String?, latitude: Double?, longitude: Double?, address: String?) async throws {
        let updated = try await service.update(id, name: name, description: description, latitude: latitude, longitude: longitude, address: address)
        if let idx = apiaries.firstIndex(where: { $0.id == id }) {
            apiaries[idx] = updated
        }
    }

    func delete(_ id: String) async throws {
        try await service.delete(id)
        apiaries.removeAll { $0.id == id }
    }
}
