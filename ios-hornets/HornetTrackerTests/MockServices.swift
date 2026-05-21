import Foundation
@testable import HornetTracker

// MARK: - Test helpers

func makeHornetStats() -> HornetStats {
    HornetStats(totalCaught: 42, totalNests: 7, destroyedNests: 2,
                pendingSightings: 3, confirmedSightings: 5)
}

func makeHornetNestGeoJSON() -> HornetNestGeoJSON {
    HornetNestGeoJSON(type: "FeatureCollection", features: [
        HornetNestFeature(
            type: "Feature",
            geometry: HornetNestGeometry(type: "Point", coordinates: [2.35, 48.85]),
            properties: HornetNestProperties(
                id: "n-1", status: "found",
                reporterName: nil, notes: nil, photoUrl: nil,
                createdAt: "2026-05-01T10:00:00"
            )
        )
    ])
}

func makeHornetSighting(id: String = "s-1") -> HornetSightingOut {
    HornetSightingOut(id: id, photoUrl: "https://example.com/s.jpg",
                      description: "Near flowers", reporterName: "Alice",
                      status: "pending", yesVotes: 2, noVotes: 1,
                      createdAt: Date(), latitude: 48.85, longitude: 2.35)
}

func makePage<T>(_ items: [T], page: Int = 1, pages: Int = 1, perPage: Int = 12) -> PaginatedResponse<T> where T: Codable {
    PaginatedResponse(items: items, total: items.count, page: page, perPage: perPage, pages: pages)
}

// MARK: - MockHornetService

final class MockHornetService: HornetServiceProtocol {
    var statsResult: Result<HornetStats, Error> = .success(makeHornetStats())
    var nestsResult: Result<HornetNestGeoJSON, Error> = .success(makeHornetNestGeoJSON())
    var sightingsResult: Result<PaginatedResponse<HornetSightingOut>, Error> = .success(makePage([makeHornetSighting()]))
    var submitCatchResult: Result<HornetCatchOut, Error> = .success(
        HornetCatchOut(id: "c-1", count: 3, latitude: nil, longitude: nil, createdAt: Date()))
    var submitNestResult: Result<HornetNestOut, Error> = .success(
        HornetNestOut(id: "n-new", latitude: 48.85, longitude: 2.35, status: "found",
                      reporterName: nil, notes: nil, photoUrl: nil,
                      createdAt: Date(), updatedAt: Date()))
    var submitSightingResult: Result<HornetSightingOut, Error> = .success(makeHornetSighting())
    var voteError: Error? = nil

    func getStats() async throws -> HornetStats { try statsResult.get() }
    func submitCatch(_ body: HornetCatchCreate) async throws -> HornetCatchOut { try submitCatchResult.get() }
    func getNests() async throws -> HornetNestGeoJSON { try nestsResult.get() }
    func submitNest(_ body: HornetNestCreate) async throws -> HornetNestOut { try submitNestResult.get() }
    func getSightings(page: Int) async throws -> PaginatedResponse<HornetSightingOut> { try sightingsResult.get() }
    func submitSighting(_ body: HornetSightingCreate) async throws -> HornetSightingOut { try submitSightingResult.get() }
    func vote(sightingId: String, vote: String) async throws { if let e = voteError { throw e } }
}
