import Foundation

// MARK: - Stats

@MainActor
final class AdminStatsViewModel: ObservableObject {
    @Published var stats: PlatformStats?
    @Published var tokenStats: AdminTokenStats?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var preset = "30d"

    private let service: any AdminServiceProtocol

    init(service: any AdminServiceProtocol = AdminService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            async let s = service.getStats(preset: preset)
            async let t = service.getTokenStats()
            (stats, tokenStats) = try await (s, t)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}

// MARK: - Users

@MainActor
final class AdminUsersViewModel: ObservableObject {
    @Published var users: [AdminUserOut] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var search = ""
    @Published var filterSupporter: Bool? = nil
    @Published var page = 1
    @Published var pages = 1

    private let service: any AdminServiceProtocol

    init(service: any AdminServiceProtocol = AdminService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.getUsers(page: page, search: search, isSupporter: filterSupporter)
            users = resp.items
            pages = resp.pages
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func toggleSupporter(_ user: AdminUserOut) async {
        do {
            let updated = try await service.setSupporter(userId: user.id, isSupporter: !user.isSupporter)
            if let idx = users.firstIndex(where: { $0.id == user.id }) {
                users[idx] = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func revokeTokens(_ userId: String) async {
        do {
            try await service.revokeTokens(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deleteUser(_ userId: String) async {
        do {
            try await service.deleteUser(userId: userId)
            users.removeAll { $0.id == userId }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Map

@MainActor
final class AdminMapViewModel: ObservableObject {
    @Published var apiaries: [AdminApiary] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showFlagged = false
    @Published var page = 1
    @Published var pages = 1

    private let service: any AdminServiceProtocol

    init(service: any AdminServiceProtocol = AdminService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = showFlagged
                ? try await service.getFlaggedApiaries(page: page)
                : try await service.getApiaries(page: page)
            apiaries = resp.items
            pages = resp.pages
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func setPrivate(_ apiary: AdminApiary) async {
        do {
            try await service.setPrivate(apiaryId: apiary.id)
            apiaries.removeAll { $0.id == apiary.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Health

@MainActor
final class AdminHealthViewModel: ObservableObject {
    @Published var summary: HealthSummary?
    @Published var inactiveUsers: [InactiveUser] = []
    @Published var noVarroaApiaries: [NoVarroaApiary] = []
    @Published var zeroInspectionHives: [ZeroInspectionHive] = []
    @Published var isLoading = false
    @Published var isDrillLoading = false
    @Published var errorMessage: String?
    @Published var activeDetail: HealthDetail? = nil
    @Published var inactivePage = 1
    @Published var inactivePages = 1

    enum HealthDetail { case inactive, noVarroa, zeroHives }

    private let service: any AdminServiceProtocol

    init(service: any AdminServiceProtocol = AdminService()) {
        self.service = service
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            summary = try await service.getHealthSummary()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func toggleDetail(_ detail: HealthDetail) async {
        if activeDetail == detail {
            activeDetail = nil
            return
        }
        activeDetail = detail
        isDrillLoading = true
        defer { isDrillLoading = false }
        do {
            switch detail {
            case .inactive:
                let resp = try await service.getInactiveUsers(page: inactivePage)
                inactiveUsers = resp.items
                inactivePages = resp.pages
            case .noVarroa:
                noVarroaApiaries = try await service.getNoVarroaApiaries()
            case .zeroHives:
                let resp = try await service.getZeroInspectionHives(page: 1)
                zeroInspectionHives = resp.items
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadMoreInactive() async {
        guard inactivePage < inactivePages else { return }
        inactivePage += 1
        isDrillLoading = true
        do {
            let resp = try await service.getInactiveUsers(page: inactivePage)
            inactiveUsers += resp.items
            inactivePages = resp.pages
        } catch {
            errorMessage = error.localizedDescription
        }
        isDrillLoading = false
    }
}
