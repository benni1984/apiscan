import Foundation

@MainActor
final class HornetViewModel: ObservableObject {
    @Published var stats: HornetStats? = nil
    @Published var nests: HornetNestGeoJSON? = nil
    @Published var sightings: [HornetSightingOut] = []
    @Published var sightingsPage = 1
    @Published var sightingsPages = 1
    @Published var isLoading = false
    @Published var errorMessage: String? = nil

    private let service: HornetServiceProtocol

    init(service: HornetServiceProtocol = HornetService()) {
        self.service = service
    }

    // MARK: - Load

    func loadStats() async {
        do { stats = try await service.getStats() }
        catch { errorMessage = error.localizedDescription }
    }

    func loadNests() async {
        isLoading = true
        defer { isLoading = false }
        do { nests = try await service.getNests() }
        catch { errorMessage = error.localizedDescription }
    }

    func loadSightings(page: Int = 1) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result = try await service.getSightings(page: page)
            sightings = page == 1 ? result.items : sightings + result.items
            sightingsPage = result.page
            sightingsPages = result.pages
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Submit

    func submitCatch(count: Int, latitude: Double? = nil, longitude: Double? = nil,
                     reporterName: String? = nil) async {
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await service.submitCatch(HornetCatchCreate(
                latitude: latitude, longitude: longitude,
                count: count, reporterName: reporterName))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submitNest(latitude: Double, longitude: Double, notes: String? = nil,
                    photoUrl: String? = nil, reporterName: String? = nil) async {
        isLoading = true
        defer { isLoading = false }
        do {
            _ = try await service.submitNest(HornetNestCreate(
                latitude: latitude, longitude: longitude,
                reporterName: reporterName, notes: notes, photoUrl: photoUrl))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submitSighting(photoUrl: String, description: String? = nil,
                        latitude: Double? = nil, longitude: Double? = nil,
                        reporterName: String? = nil) async {
        isLoading = true
        defer { isLoading = false }
        do {
            let sighting = try await service.submitSighting(HornetSightingCreate(
                photoUrl: photoUrl, description: description,
                reporterName: reporterName, latitude: latitude, longitude: longitude))
            sightings.insert(sighting, at: 0)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func vote(sightingId: String, vote: String) async {
        do {
            try await service.vote(sightingId: sightingId, vote: vote)
            await loadSightings(page: 1)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
