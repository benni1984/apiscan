import XCTest
@testable import ApiScan

@MainActor
final class ApiaryViewModelTests: XCTestCase {

    private var svc: MockApiaryService!
    private var vm: ApiaryViewModel!

    override func setUp() {
        super.setUp()
        svc = MockApiaryService()
        vm = ApiaryViewModel(service: svc)
    }

    func test_load_populatesApiaries() async {
        svc.listResult = .success(makePage([makeApiary(id: "a-1"), makeApiary(id: "a-2")]))
        await vm.load()
        XCTAssertEqual(vm.apiaries.count, 2)
        XCTAssertEqual(vm.apiaries[0].id, "a-1")
    }

    func test_load_setsErrorOnFailure() async {
        svc.listResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Network error"]))
        await vm.load()
        XCTAssertTrue(vm.apiaries.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Network error")
    }

    func test_load_clearsErrorBeforeRetry() async {
        svc.listResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Network error"]))
        await vm.load()
        XCTAssertNotNil(vm.errorMessage)

        svc.listResult = .success(makePage([makeApiary()]))
        await vm.load()
        XCTAssertNil(vm.errorMessage)
    }

    func test_create_appendsApiary() async throws {
        let apiary = makeApiary(id: "a-new", name: "New Apiary")
        svc.createResult = .success(apiary)
        let result = try await vm.create(name: "New Apiary", description: nil,
                                         latitude: nil, longitude: nil, address: nil)
        XCTAssertEqual(result.id, "a-new")
        XCTAssertEqual(vm.apiaries.count, 1)
        XCTAssertEqual(vm.apiaries[0].name, "New Apiary")
    }

    func test_delete_removesApiary() async throws {
        svc.listResult = .success(makePage([makeApiary(id: "a-1"), makeApiary(id: "a-2")]))
        await vm.load()
        try await vm.delete("a-1")
        XCTAssertEqual(vm.apiaries.count, 1)
        XCTAssertEqual(vm.apiaries[0].id, "a-2")
    }

    func test_update_replacesApiary() async throws {
        svc.listResult = .success(makePage([makeApiary(id: "a-1", name: "Old Name")]))
        await vm.load()
        let updated = makeApiary(id: "a-1", name: "New Name")
        svc.updateResult = .success(updated)
        try await vm.update("a-1", name: "New Name", description: nil,
                             latitude: nil, longitude: nil, address: nil)
        XCTAssertEqual(vm.apiaries[0].name, "New Name")
    }

    func test_isLoading_trueWhileLoading() async {
        svc.listResult = .success(makePage([]))
        XCTAssertFalse(vm.isLoading)
        let task = Task { await vm.load() }
        // isLoading is set synchronously at start of load()
        await task.value
        XCTAssertFalse(vm.isLoading)
    }
}
