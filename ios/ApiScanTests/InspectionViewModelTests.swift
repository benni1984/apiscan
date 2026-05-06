import XCTest
@testable import ApiScan

@MainActor
final class InspectionViewModelTests: XCTestCase {

    private var svc: MockInspectionService!
    private var vm: InspectionViewModel!

    private let minimalRequest = InspectionCreateRequest(
        date: "2024-07-01", queenSeen: nil, queenColor: nil,
        broodFrames: nil, honeyFrames: nil, mood: nil, populationStrength: nil,
        varroaCount: nil, swarmCellsSeen: nil, treatmentApplied: nil,
        feedingDone: nil, feedingType: nil, weightKg: nil, notes: nil,
        customFields: [:]
    )

    override func setUp() {
        super.setUp()
        svc = MockInspectionService()
        vm = InspectionViewModel(service: svc)
    }

    func test_load_populatesInspections() async {
        svc.listResult = .success(makePage([makeInspection(id: "i-1"), makeInspection(id: "i-2")], perPage: 20))
        await vm.load(hiveId: "h-1")
        XCTAssertEqual(vm.inspections.count, 2)
    }

    func test_load_setsErrorOnFailure() async {
        svc.listResult = .failure(NSError(domain: "test", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Load failed"]))
        await vm.load(hiveId: "h-1")
        XCTAssertTrue(vm.inspections.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Load failed")
    }

    func test_create_insertsAtFront() async throws {
        svc.listResult = .success(makePage([makeInspection(id: "i-1")], perPage: 20))
        await vm.load(hiveId: "h-1")

        let newInsp = makeInspection(id: "i-2")
        svc.createResult = .success(newInsp)
        _ = try await vm.create(hiveId: "h-1", request: minimalRequest)

        XCTAssertEqual(vm.inspections.count, 2)
        XCTAssertEqual(vm.inspections[0].id, "i-2")
    }

    func test_delete_removesInspection() async throws {
        svc.listResult = .success(makePage([makeInspection(id: "i-1"), makeInspection(id: "i-2")], perPage: 20))
        await vm.load(hiveId: "h-1")
        try await vm.delete("i-1")
        XCTAssertEqual(vm.inspections.count, 1)
        XCTAssertEqual(vm.inspections[0].id, "i-2")
    }

    func test_update_replacesInspection() async throws {
        svc.listResult = .success(makePage([makeInspection(id: "i-1")], perPage: 20))
        await vm.load(hiveId: "h-1")

        let updated = makeInspection(id: "i-1")
        svc.updateResult = .success(updated)
        try await vm.update("i-1", request: minimalRequest)
        XCTAssertEqual(vm.inspections[0].id, "i-1")
    }

    func test_loadMore_appendsNextPage() async {
        svc.listResult = .success(PaginatedResponse(
            items: [makeInspection(id: "i-1")], total: 2, page: 1, perPage: 20, pages: 2))
        await vm.load(hiveId: "h-1")

        svc.listResult = .success(PaginatedResponse(
            items: [makeInspection(id: "i-2")], total: 2, page: 2, perPage: 20, pages: 2))
        await vm.loadMore(hiveId: "h-1")

        XCTAssertEqual(vm.inspections.count, 2)
        XCTAssertEqual(vm.inspections[1].id, "i-2")
    }

    func test_loadMore_doesNothingWhenNoMorePages() async {
        svc.listResult = .success(PaginatedResponse(
            items: [makeInspection(id: "i-1")], total: 1, page: 1, perPage: 20, pages: 1))
        await vm.load(hiveId: "h-1")
        await vm.loadMore(hiveId: "h-1")
        XCTAssertEqual(vm.inspections.count, 1)
    }
}
