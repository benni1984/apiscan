import Foundation

struct StatsService {
    private let client = APIClient.shared

    func hiveStats(hiveId: String, preset: String? = nil, from: String? = nil, to: String? = nil) async throws -> HiveStats {
        var params: [String] = []
        if let p = preset { params.append("preset=\(p)") }
        if let f = from   { params.append("from=\(f)") }
        if let t = to     { params.append("to=\(t)") }
        let query = params.isEmpty ? "" : "?" + params.joined(separator: "&")
        return try await client.get("hives/\(hiveId)/stats\(query)")
    }

    func apiaryStats(apiaryId: String, preset: String? = nil, from: String? = nil, to: String? = nil) async throws -> ApiaryStats {
        var params: [String] = []
        if let p = preset { params.append("preset=\(p)") }
        if let f = from   { params.append("from=\(f)") }
        if let t = to     { params.append("to=\(t)") }
        let query = params.isEmpty ? "" : "?" + params.joined(separator: "&")
        return try await client.get("apiaries/\(apiaryId)/stats\(query)")
    }

    func overview(preset: String? = nil, from: String? = nil, to: String? = nil) async throws -> OverviewStats {
        var params: [String] = []
        if let p = preset { params.append("preset=\(p)") }
        if let f = from   { params.append("from=\(f)") }
        if let t = to     { params.append("to=\(t)") }
        let query = params.isEmpty ? "" : "?" + params.joined(separator: "&")
        return try await client.get("stats/overview\(query)")
    }
}
