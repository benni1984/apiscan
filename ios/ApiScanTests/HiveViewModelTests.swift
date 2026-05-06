import XCTest
@testable import ApiScan

@MainActor
final class HiveViewModelTests: XCTestCase {

    private var svc: MockHiveService!
    private var vm: HiveViewModel!

    override func setUp() {
        super.setUp()
        svc = MockHiveService()
        vm = HiveViewModel(service: svc)
    }

    func test_load_populatesHives() async {
        svc.listResult = .success(makePage([makeHive(id: "h-1"), makeHive(id: "h-2")]))
        await vm.load(apiaryId: "a-1")
        XCTAssertEqual(vm.hives.count, 2)
        XCTAssertEqual(vm.hives[0].id, "h-1")
    }

    func test_load_setsErrorOnFailure() async {
        svc.listResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Load failed"]))
        await vm.load(apiaryId: "a-1")
        XCTAssertTrue(vm.hives.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Load failed")
    }

    func test_initialize_appendsHive() async throws {
        let hive = try await vm.initialize(
            qrToken: "tok", apiaryId: "a-1", name: "New Hive",
            hiveType: "langstroth", latitude: nil, longitude: nil,
            acquisitionDate: nil, notes: nil
        )
        XCTAssertEqual(hive.name, "New Hive")
        XCTAssertEqual(vm.hives.count, 1)
        XCTAssertEqual(vm.hives[0].id, "h-new")
    }

    func test_delete_removesHive() async throws {
        svc.listResult = .success(makePage([makeHive(id: "h-1"), makeHive(id: "h-2")]))
        await vm.load(apiaryId: "a-1")
        try await vm.delete("h-1")
        XCTAssertEqual(vm.hives.count, 1)
        XCTAssertEqual(vm.hives[0].id, "h-2")
    }

    func test_update_replacesHive() async throws {
        svc.listResult = .success(makePage([makeHive(id: "h-1", name: "Old")]))
        await vm.load(apiaryId: "a-1")
        try await vm.update("h-1", name: "Updated", hiveType: "dadant", notes: nil)
        XCTAssertEqual(vm.hives[0].name, "Updated")
    }

    func test_resolveQR_returnsLinked() async throws {
        let hive = makeHive()
        svc.resolveResult = .linked(hive)
        let result = try await vm.resolveQR(token: "tok")
        guard case .linked(let h) = result else {
            return XCTFail("Expected .linked")
        }
        XCTAssertEqual(h.id, hive.id)
    }

    func test_resolveQR_returnsUnlinked() async throws {
        svc.resolveResult = .unlinked(token: "free-token")
        let result = try await vm.resolveQR(token: "free-token")
        guard case .unlinked(let tok) = result else {
            return XCTFail("Expected .unlinked")
        }
        XCTAssertEqual(tok, "free-token")
    }
}
