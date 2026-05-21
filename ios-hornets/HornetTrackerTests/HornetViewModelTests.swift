import XCTest
@testable import HornetTracker

@MainActor
final class HornetViewModelTests: XCTestCase {

    private var svc: MockHornetService!
    private var vm: HornetViewModel!

    override func setUp() {
        super.setUp()
        svc = MockHornetService()
        vm = HornetViewModel(service: svc)
    }

    // MARK: - loadStats

    func test_loadStats_populatesStats() async {
        await vm.loadStats()
        XCTAssertEqual(vm.stats?.totalCaught, 42)
        XCTAssertNil(vm.errorMessage)
    }

    func test_loadStats_failure_setsError() async {
        svc.statsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Stats failed"]))
        await vm.loadStats()
        XCTAssertNil(vm.stats)
        XCTAssertEqual(vm.errorMessage, "Stats failed")
    }

    // MARK: - loadNests

    func test_loadNests_populatesNests() async {
        await vm.loadNests()
        XCTAssertNotNil(vm.nests)
        XCTAssertEqual(vm.nests?.features.count, 1)
        XCTAssertNil(vm.errorMessage)
    }

    func test_loadNests_failure_setsError() async {
        svc.nestsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Nests failed"]))
        await vm.loadNests()
        XCTAssertNil(vm.nests)
        XCTAssertEqual(vm.errorMessage, "Nests failed")
    }

    // MARK: - loadSightings

    func test_loadSightings_populatesSightings() async {
        await vm.loadSightings()
        XCTAssertEqual(vm.sightings.count, 1)
        XCTAssertEqual(vm.sightings[0].id, "s-1")
    }

    func test_loadSightings_page2_appendsSightings() async {
        await vm.loadSightings(page: 1)
        let s2 = makeHornetSighting(id: "s-2")
        svc.sightingsResult = .success(PaginatedResponse(items: [s2], total: 2, page: 2, perPage: 12, pages: 2))
        await vm.loadSightings(page: 2)
        XCTAssertEqual(vm.sightings.count, 2)
    }

    func test_loadSightings_page1_replacesSightings() async {
        await vm.loadSightings(page: 1)
        let s2 = makeHornetSighting(id: "s-fresh")
        svc.sightingsResult = .success(makePage([s2]))
        await vm.loadSightings(page: 1)
        XCTAssertEqual(vm.sightings.count, 1)
        XCTAssertEqual(vm.sightings[0].id, "s-fresh")
    }

    func test_loadSightings_failure_setsError() async {
        svc.sightingsResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Sightings failed"]))
        await vm.loadSightings()
        XCTAssertTrue(vm.sightings.isEmpty)
        XCTAssertEqual(vm.errorMessage, "Sightings failed")
    }

    // MARK: - submitCatch

    func test_submitCatch_success_clearsError() async {
        vm.errorMessage = "old error"
        await vm.submitCatch(count: 3)
        XCTAssertNil(vm.errorMessage)
    }

    func test_submitCatch_failure_setsError() async {
        svc.submitCatchResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Submit failed"]))
        await vm.submitCatch(count: 1)
        XCTAssertEqual(vm.errorMessage, "Submit failed")
    }

    // MARK: - submitNest

    func test_submitNest_success() async {
        await vm.submitNest(latitude: 48.85, longitude: 2.35)
        XCTAssertNil(vm.errorMessage)
    }

    func test_submitNest_failure_setsError() async {
        svc.submitNestResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Nest failed"]))
        await vm.submitNest(latitude: 48.85, longitude: 2.35)
        XCTAssertEqual(vm.errorMessage, "Nest failed")
    }

    // MARK: - submitSighting

    func test_submitSighting_prependsSightingToList() async {
        await vm.loadSightings()
        let existing = vm.sightings.count
        let newSighting = makeHornetSighting(id: "s-new")
        svc.submitSightingResult = .success(newSighting)
        await vm.submitSighting(photoUrl: "https://example.com/x.jpg")
        XCTAssertEqual(vm.sightings.count, existing + 1)
        XCTAssertEqual(vm.sightings[0].id, "s-new")
    }

    func test_submitSighting_failure_setsError() async {
        svc.submitSightingResult = .failure(NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Upload failed"]))
        await vm.submitSighting(photoUrl: "")
        XCTAssertEqual(vm.errorMessage, "Upload failed")
    }

    // MARK: - vote

    func test_vote_success_reloadsSightings() async {
        await vm.loadSightings()
        let refreshed = makeHornetSighting(id: "s-1")
        svc.sightingsResult = .success(makePage([refreshed]))
        await vm.vote(sightingId: "s-1", vote: "yes")
        XCTAssertNil(vm.errorMessage)
        XCTAssertEqual(vm.sightings.count, 1)
    }

    func test_vote_failure_setsError() async {
        svc.voteError = NSError(domain: "t", code: 1,
            userInfo: [NSLocalizedDescriptionKey: "Vote failed"])
        await vm.vote(sightingId: "s-1", vote: "yes")
        XCTAssertEqual(vm.errorMessage, "Vote failed")
    }

    // MARK: - loadingState

    func test_isLoading_falseAfterLoad() async {
        await vm.loadNests()
        XCTAssertFalse(vm.isLoading)
    }
}
