import Foundation

// MARK: - Pagination

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let perPage: Int
    let pages: Int

    enum CodingKeys: String, CodingKey {
        case items, total, page, pages
        case perPage = "per_page"
    }
}

// MARK: - Stats

struct HornetStats: Codable {
    let totalCaught: Int
    let totalNests: Int
    let destroyedNests: Int
    let pendingSightings: Int
    let confirmedSightings: Int

    enum CodingKeys: String, CodingKey {
        case totalCaught = "total_caught"
        case totalNests = "total_nests"
        case destroyedNests = "destroyed_nests"
        case pendingSightings = "pending_sightings"
        case confirmedSightings = "confirmed_sightings"
    }
}

// MARK: - Catches

struct HornetCatchCreate: Codable {
    let latitude: Double?
    let longitude: Double?
    let count: Int
    let reporterName: String?

    enum CodingKeys: String, CodingKey {
        case latitude, longitude, count
        case reporterName = "reporter_name"
    }
}

struct HornetCatchOut: Codable {
    let id: String
    let count: Int
    let latitude: Double?
    let longitude: Double?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, count, latitude, longitude
        case createdAt = "created_at"
    }
}

// MARK: - Nests

struct HornetNestCreate: Codable {
    let latitude: Double
    let longitude: Double
    let reporterName: String?
    let notes: String?
    let photoUrl: String?

    enum CodingKeys: String, CodingKey {
        case latitude, longitude, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
    }
}

struct HornetNestOut: Codable, Identifiable {
    let id: String
    let latitude: Double
    let longitude: Double
    let status: String
    let reporterName: String?
    let notes: String?
    let photoUrl: String?
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, latitude, longitude, status, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Nests GeoJSON

struct HornetNestGeoJSON: Codable {
    let type: String
    let features: [HornetNestFeature]
}

struct HornetNestFeature: Codable {
    let type: String
    let geometry: HornetNestGeometry
    let properties: HornetNestProperties
}

struct HornetNestGeometry: Codable {
    let type: String
    let coordinates: [Double] // [longitude, latitude]
}

struct HornetNestProperties: Codable, Identifiable {
    let id: String
    let status: String
    let reporterName: String?
    let notes: String?
    let photoUrl: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, status, notes
        case reporterName = "reporter_name"
        case photoUrl = "photo_url"
        case createdAt = "created_at"
    }
}

// MARK: - Sightings

struct HornetSightingCreate: Codable {
    let photoUrl: String
    let description: String?
    let reporterName: String?
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case description, latitude, longitude
        case photoUrl = "photo_url"
        case reporterName = "reporter_name"
    }
}

struct HornetSightingOut: Codable, Identifiable {
    let id: String
    let photoUrl: String
    let description: String?
    let reporterName: String?
    let status: String
    let yesVotes: Int
    let noVotes: Int
    let createdAt: Date
    let latitude: Double?
    let longitude: Double?

    enum CodingKeys: String, CodingKey {
        case id, description, status, latitude, longitude
        case photoUrl = "photo_url"
        case reporterName = "reporter_name"
        case yesVotes = "yes_votes"
        case noVotes = "no_votes"
        case createdAt = "created_at"
    }
}

struct HornetVote: Codable {
    let vote: String
}
