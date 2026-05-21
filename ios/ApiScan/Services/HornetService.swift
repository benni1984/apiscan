import Foundation

protocol HornetServiceProtocol {
    func getStats() async throws -> HornetStats
    func submitCatch(_ body: HornetCatchCreate) async throws -> HornetCatchOut
    func getNests() async throws -> HornetNestGeoJSON
    func submitNest(_ body: HornetNestCreate) async throws -> HornetNestOut
    func getSightings(page: Int) async throws -> PaginatedResponse<HornetSightingOut>
    func submitSighting(_ body: HornetSightingCreate) async throws -> HornetSightingOut
    func vote(sightingId: String, vote: String) async throws
}

struct HornetService: HornetServiceProtocol {
    private let client = APIClient.shared

    func getStats() async throws -> HornetStats {
        try await client.getNoAuth("hornets/stats")
    }

    func submitCatch(_ body: HornetCatchCreate) async throws -> HornetCatchOut {
        try await client.postNoAuth("hornets/catches", body: body)
    }

    func getNests() async throws -> HornetNestGeoJSON {
        try await client.getNoAuth("hornets/nests")
    }

    func submitNest(_ body: HornetNestCreate) async throws -> HornetNestOut {
        try await client.postNoAuth("hornets/nests", body: body)
    }

    func getSightings(page: Int = 1) async throws -> PaginatedResponse<HornetSightingOut> {
        try await client.getNoAuth("hornets/sightings?page=\(page)&per_page=12")
    }

    func submitSighting(_ body: HornetSightingCreate) async throws -> HornetSightingOut {
        try await client.postNoAuth("hornets/sightings", body: body)
    }

    func vote(sightingId: String, vote: String) async throws {
        try await client.postVoidNoAuth(
            "hornets/sightings/\(sightingId)/vote",
            body: HornetVote(vote: vote)
        )
    }
}
