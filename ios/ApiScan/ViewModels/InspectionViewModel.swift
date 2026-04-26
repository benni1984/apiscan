import Foundation

@MainActor
final class InspectionViewModel: ObservableObject {
    @Published var inspections: [InspectionOut] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private var currentPage = 1
    private var hasMore = true
    private let service = InspectionService()

    func load(hiveId: String) async {
        guard !isLoading else { return }
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.list(hiveId: hiveId, page: 1)
            inspections = resp.items
            currentPage = 1
            hasMore = resp.page < resp.pages
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadMore(hiveId: String) async {
        guard !isLoading, hasMore else { return }
        isLoading = true
        do {
            let resp = try await service.list(hiveId: hiveId, page: currentPage + 1)
            inspections.append(contentsOf: resp.items)
            currentPage += 1
            hasMore = currentPage < resp.pages
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func create(hiveId: String, request: InspectionCreateRequest) async throws -> InspectionOut {
        let insp = try await service.create(hiveId: hiveId, request: request)
        inspections.insert(insp, at: 0)
        return insp
    }

    func update(_ id: String, request: InspectionCreateRequest) async throws {
        let updated = try await service.update(id, request: request)
        if let idx = inspections.firstIndex(where: { $0.id == id }) {
            inspections[idx] = updated
        }
    }

    func delete(_ id: String) async throws {
        try await service.delete(id)
        inspections.removeAll { $0.id == id }
    }
}
