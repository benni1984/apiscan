import Foundation

struct ExportService {
    private let client = APIClient.shared

    func exportApiary(apiaryId: String, format: String) async throws -> Data {
        try await client.getRawData("apiaries/\(apiaryId)/inspections/export?format=\(format)")
    }

    func exportHive(hiveId: String, format: String) async throws -> Data {
        try await client.getRawData("hives/\(hiveId)/inspections/export?format=\(format)")
    }
}
