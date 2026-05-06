import Foundation
import CoreLocation

@MainActor
final class HiveViewModel: ObservableObject {
    @Published var hives: [HiveOut] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service: any HiveServiceProtocol

    init(service: any HiveServiceProtocol = HiveService()) {
        self.service = service
    }

    func load(apiaryId: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.listForApiary(apiaryId)
            hives = resp.items
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func initialize(
        qrToken: String,
        apiaryId: String,
        name: String,
        hiveType: String,
        latitude: Double?,
        longitude: Double?,
        acquisitionDate: String?,
        notes: String?
    ) async throws -> HiveOut {
        let req = HiveInitializeRequest(
            qrToken: qrToken,
            apiaryId: apiaryId,
            name: name,
            hiveType: hiveType,
            latitude: latitude,
            longitude: longitude,
            acquisitionDate: acquisitionDate,
            notes: notes,
            customFields: [:]
        )
        let hive = try await service.initialize(request: req)
        hives.append(hive)
        return hive
    }

    func update(_ id: String, name: String, hiveType: String, notes: String?) async throws {
        let req = HiveUpdateRequest(
            apiaryId: nil, name: name, hiveType: hiveType,
            latitude: nil, longitude: nil, acquisitionDate: nil,
            notes: notes, customFields: nil
        )
        let updated = try await service.update(id, request: req)
        if let idx = hives.firstIndex(where: { $0.id == id }) {
            hives[idx] = updated
        }
    }

    func delete(_ id: String) async throws {
        try await service.delete(id)
        hives.removeAll { $0.id == id }
    }

    func resolveQR(token: String) async throws -> QRScanResult {
        try await service.resolveQR(token: token)
    }
}
