import Foundation

protocol AdminServiceProtocol {
    func getStats(preset: String) async throws -> PlatformStats
    func getTokenStats() async throws -> AdminTokenStats
    func getUsers(page: Int, search: String?, isSupporter: Bool?) async throws -> PaginatedResponse<AdminUserOut>
    func setSupporter(userId: String, isSupporter: Bool) async throws -> AdminUserOut
    func deleteUser(userId: String) async throws
    func revokeTokens(userId: String) async throws
    func getApiaries(page: Int) async throws -> PaginatedResponse<AdminApiary>
    func getFlaggedApiaries(page: Int) async throws -> PaginatedResponse<AdminApiary>
    func setPrivate(apiaryId: String) async throws
    func getHealthSummary() async throws -> HealthSummary
    func getInactiveUsers(page: Int) async throws -> PaginatedResponse<InactiveUser>
    func getNoVarroaApiaries() async throws -> [NoVarroaApiary]
    func getZeroInspectionHives(page: Int) async throws -> PaginatedResponse<ZeroInspectionHive>
}

struct AdminService: AdminServiceProtocol {
    private let client = APIClient.shared

    func getStats(preset: String) async throws -> PlatformStats {
        try await client.get("admin/stats?preset=\(preset)")
    }

    func getTokenStats() async throws -> AdminTokenStats {
        try await client.get("admin/tokens/stats")
    }

    func getUsers(page: Int, search: String?, isSupporter: Bool?) async throws -> PaginatedResponse<AdminUserOut> {
        var query = "page=\(page)&per_page=20"
        if let s = search, !s.isEmpty { query += "&search=\(s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s)" }
        if let sup = isSupporter { query += "&is_supporter=\(sup)" }
        return try await client.get("admin/users?\(query)")
    }

    func setSupporter(userId: String, isSupporter: Bool) async throws -> AdminUserOut {
        try await client.put("admin/users/\(userId)/supporter", body: SetSupporterRequest(isSupporter: isSupporter))
    }

    func deleteUser(userId: String) async throws {
        try await client.delete("admin/users/\(userId)")
    }

    func revokeTokens(userId: String) async throws {
        try await client.delete("admin/users/\(userId)/tokens")
    }

    func getApiaries(page: Int) async throws -> PaginatedResponse<AdminApiary> {
        try await client.get("admin/apiaries?page=\(page)&per_page=20")
    }

    func getFlaggedApiaries(page: Int) async throws -> PaginatedResponse<AdminApiary> {
        try await client.get("admin/apiaries/flagged?page=\(page)&per_page=20")
    }

    func setPrivate(apiaryId: String) async throws {
        let _: AdminApiary = try await client.put("admin/apiaries/\(apiaryId)/set-private", body: EmptyBody())
    }

    func getHealthSummary() async throws -> HealthSummary {
        try await client.get("admin/health/summary")
    }

    func getInactiveUsers(page: Int) async throws -> PaginatedResponse<InactiveUser> {
        try await client.get("admin/health/inactive-users?page=\(page)&per_page=20")
    }

    func getNoVarroaApiaries() async throws -> [NoVarroaApiary] {
        try await client.get("admin/health/no-varroa-inspections")
    }

    func getZeroInspectionHives(page: Int) async throws -> PaginatedResponse<ZeroInspectionHive> {
        try await client.get("admin/health/zero-inspection-hives?page=\(page)&per_page=20")
    }
}

private struct EmptyBody: Encodable {}
