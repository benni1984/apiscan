import XCTest
@testable import ApiScan

// MARK: - AdminStatsViewModel Tests

@MainActor
final class AdminStatsViewModelTests: XCTestCase {
    private var svc: MockAdminService!
    private var vm: AdminStatsViewModel!

    override func setUp() {
        super.setUp()
        svc = MockAdminService()
        vm = AdminStatsViewModel(service: svc)
    }

    func test_load_populatesStats() async {
        svc.statsResult = .success(makePlatformStats())
        svc.tokenStatsResult = .success(makeAdminTokenStats())
        await vm.load()
        XCTAssertNotNil(vm.stats)
        XCTAssertNotNil(vm.tokenStats)
        XCTAssertEqual(vm.stats?.totalUsers, 10)
        XCTAssertEqual(vm.tokenStats?.totalActiveSessions, 8)
    }

    func test_load_setsErrorOnFailure() async {
        svc.statsResult = .failure(NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "stats error"]))
        await vm.load()
        XCTAssertNil(vm.stats)
        XCTAssertNotNil(vm.errorMessage)
    }

    func test_load_clearsErrorOnRetry() async {
        svc.statsResult = .failure(NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "err"]))
        await vm.load()
        XCTAssertNotNil(vm.errorMessage)
        svc.statsResult = .success(makePlatformStats())
        await vm.load()
        XCTAssertNil(vm.errorMessage)
    }

    func test_isLoading_falseAfterLoad() async {
        await vm.load()
        XCTAssertFalse(vm.isLoading)
    }
}

// MARK: - AdminUsersViewModel Tests

@MainActor
final class AdminUsersViewModelTests: XCTestCase {
    private var svc: MockAdminService!
    private var vm: AdminUsersViewModel!

    override func setUp() {
        super.setUp()
        svc = MockAdminService()
        vm = AdminUsersViewModel(service: svc)
    }

    func test_load_populatesUsers() async {
        svc.usersResult = .success(makePage([makeAdminUser(id: "u-1"), makeAdminUser(id: "u-2")]))
        await vm.load()
        XCTAssertEqual(vm.users.count, 2)
    }

    func test_load_setsErrorOnFailure() async {
        svc.usersResult = .failure(NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "fail"]))
        await vm.load()
        XCTAssertTrue(vm.users.isEmpty)
        XCTAssertNotNil(vm.errorMessage)
    }

    func test_toggleSupporter_updatesUser() async {
        let user = makeAdminUser(id: "u-1", isSupporter: false)
        svc.usersResult = .success(makePage([user]))
        await vm.load()
        svc.setSupporterResult = .success(makeAdminUser(id: "u-1", isSupporter: true))
        await vm.toggleSupporter(user)
        XCTAssertTrue(vm.users.first?.isSupporter == true)
    }

    func test_deleteUser_removesFromList() async {
        svc.usersResult = .success(makePage([makeAdminUser(id: "u-1"), makeAdminUser(id: "u-2")]))
        await vm.load()
        await vm.deleteUser("u-1")
        XCTAssertEqual(vm.users.count, 1)
        XCTAssertEqual(vm.users.first?.id, "u-2")
    }

    func test_revokeTokens_setsErrorOnFailure() async {
        svc.revokeError = NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "revoke failed"])
        await vm.revokeTokens("u-1")
        XCTAssertNotNil(vm.errorMessage)
    }
}

// MARK: - AdminMapViewModel Tests

@MainActor
final class AdminMapViewModelTests: XCTestCase {
    private var svc: MockAdminService!
    private var vm: AdminMapViewModel!

    override func setUp() {
        super.setUp()
        svc = MockAdminService()
        vm = AdminMapViewModel(service: svc)
    }

    func test_load_populatesApiaries() async {
        svc.apiariedResult = .success(makePage([makeAdminApiary(id: "ap-1"), makeAdminApiary(id: "ap-2")]))
        await vm.load()
        XCTAssertEqual(vm.apiaries.count, 2)
    }

    func test_load_setsErrorOnFailure() async {
        svc.apiariedResult = .failure(NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "err"]))
        await vm.load()
        XCTAssertTrue(vm.apiaries.isEmpty)
        XCTAssertNotNil(vm.errorMessage)
    }

    func test_setPrivate_removesFromList() async {
        let apiary = makeAdminApiary(id: "ap-1")
        svc.apiariedResult = .success(makePage([apiary, makeAdminApiary(id: "ap-2")]))
        await vm.load()
        await vm.setPrivate(apiary)
        XCTAssertEqual(vm.apiaries.count, 1)
        XCTAssertEqual(vm.apiaries.first?.id, "ap-2")
    }

    func test_setPrivate_setsErrorOnFailure() async {
        let apiary = makeAdminApiary()
        svc.apiariedResult = .success(makePage([apiary]))
        await vm.load()
        svc.setPrivateError = NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "err"])
        await vm.setPrivate(apiary)
        XCTAssertNotNil(vm.errorMessage)
        XCTAssertEqual(vm.apiaries.count, 1) // not removed on error
    }
}

// MARK: - AdminHealthViewModel Tests

@MainActor
final class AdminHealthViewModelTests: XCTestCase {
    private var svc: MockAdminService!
    private var vm: AdminHealthViewModel!

    override func setUp() {
        super.setUp()
        svc = MockAdminService()
        vm = AdminHealthViewModel(service: svc)
    }

    func test_load_populatesSummary() async {
        svc.healthSummaryResult = .success(makeHealthSummary())
        await vm.load()
        XCTAssertNotNil(vm.summary)
        XCTAssertEqual(vm.summary?.inactiveUsersCount, 3)
    }

    func test_load_setsErrorOnFailure() async {
        svc.healthSummaryResult = .failure(NSError(domain: "t", code: 1, userInfo: [NSLocalizedDescriptionKey: "err"]))
        await vm.load()
        XCTAssertNil(vm.summary)
        XCTAssertNotNil(vm.errorMessage)
    }

    func test_toggleDetail_loadsInactiveUsers() async {
        let inactive = InactiveUser(id: "u-1", email: "a@b.com", createdAt: Date(), daysSinceRegistration: 45)
        svc.inactiveUsersResult = .success(makePage([inactive]))
        await vm.toggleDetail(.inactive)
        XCTAssertEqual(vm.activeDetail, .inactive)
        XCTAssertEqual(vm.inactiveUsers.count, 1)
    }

    func test_toggleDetail_collapsesWhenSameDetail() async {
        svc.inactiveUsersResult = .success(makePage([]))
        await vm.toggleDetail(.inactive)
        XCTAssertEqual(vm.activeDetail, .inactive)
        await vm.toggleDetail(.inactive)
        XCTAssertNil(vm.activeDetail)
    }

    func test_toggleDetail_loadsNoVarroaApiaries() async {
        let noVarroa = NoVarroaApiary(apiaryId: "a-1", apiaryName: "Test", count: 3)
        svc.noVarroaResult = .success([noVarroa])
        await vm.toggleDetail(.noVarroa)
        XCTAssertEqual(vm.activeDetail, .noVarroa)
        XCTAssertEqual(vm.noVarroaApiaries.count, 1)
    }

    func test_toggleDetail_loadsZeroInspectionHives() async {
        let hive = ZeroInspectionHive(hiveId: "h-1", hiveName: "Hive One", apiaryName: "My Apiary", initializedAt: Date())
        svc.zeroHivesResult = .success(makePage([hive]))
        await vm.toggleDetail(.zeroHives)
        XCTAssertEqual(vm.activeDetail, .zeroHives)
        XCTAssertEqual(vm.zeroInspectionHives.count, 1)
        XCTAssertEqual(vm.zeroInspectionHives.first?.hiveName, "Hive One")
    }

    func test_loadMoreInactive_appendsItems() async {
        let first  = InactiveUser(id: "u-1", email: "a@b.com", createdAt: Date(), daysSinceRegistration: 10)
        let second = InactiveUser(id: "u-2", email: "b@b.com", createdAt: Date(), daysSinceRegistration: 20)
        svc.inactiveUsersResult = .success(makePage([first], page: 1, pages: 2))
        await vm.toggleDetail(.inactive)
        XCTAssertEqual(vm.inactiveUsers.count, 1)
        svc.inactiveUsersResult = .success(makePage([second], page: 2, pages: 2))
        await vm.loadMoreInactive()
        XCTAssertEqual(vm.inactiveUsers.count, 2)
        XCTAssertEqual(vm.inactiveUsers.last?.id, "u-2")
    }

    func test_loadMoreInactive_doesNothingAtLastPage() async {
        let user = InactiveUser(id: "u-1", email: "a@b.com", createdAt: Date(), daysSinceRegistration: 5)
        svc.inactiveUsersResult = .success(makePage([user], page: 1, pages: 1))
        await vm.toggleDetail(.inactive)
        XCTAssertEqual(vm.inactivePage, 1)
        XCTAssertEqual(vm.inactivePages, 1)
        await vm.loadMoreInactive() // guard fires — page stays at 1
        XCTAssertEqual(vm.inactiveUsers.count, 1)
        XCTAssertEqual(vm.inactivePage, 1)
    }
}
