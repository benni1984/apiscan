import Foundation

struct QrBatchService {
    private let client = APIClient.shared

    func list(page: Int = 1) async throws -> PaginatedResponse<QrBatchSummary> {
        try await client.get("qr-batches?page=\(page)&per_page=20")
    }

    func get(_ id: String) async throws -> QrBatchOut {
        try await client.get("qr-batches/\(id)")
    }

    func create(count: Int) async throws -> QrBatchOut {
        try await client.post("qr-batches", body: QrBatchCreate(count: count))
    }

    func pdfURL(batchId: String) -> URL {
        APIClient.shared.baseURL.appendingPathComponent("qr-batches/\(batchId)/pdf")
    }
}
