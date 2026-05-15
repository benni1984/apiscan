import Foundation

// MARK: - JSON Value (dynamic custom fields)
enum JSONValue: Codable, Hashable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let v = try? c.decode(Bool.self)   { self = .bool(v);   return }
        if let v = try? c.decode(Int.self)    { self = .int(v);    return }
        if let v = try? c.decode(Double.self) { self = .double(v); return }
        if let v = try? c.decode(String.self) { self = .string(v); return }
        throw DecodingError.typeMismatch(JSONValue.self,
            .init(codingPath: decoder.codingPath, debugDescription: "Unexpected JSON type"))
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let v): try c.encode(v)
        case .int(let v):    try c.encode(v)
        case .double(let v): try c.encode(v)
        case .bool(let v):   try c.encode(v)
        case .null:          try c.encodeNil()
        }
    }

    var displayString: String {
        switch self {
        case .string(let v): return v
        case .int(let v):    return "\(v)"
        case .double(let v): return String(format: "%.2f", v)
        case .bool(let v):   return v ? "✓" : "✗"
        case .null:          return "—"
        }
    }
}

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

// MARK: - Auth
struct RegisterRequest: Encodable {
    let email: String
    let password: String
    let name: String
    let locale: String
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RefreshRequest: Encodable {
    let refreshToken: String
    enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" }
}

struct LogoutRequest: Encodable {
    let refreshToken: String
    enum CodingKeys: String, CodingKey { case refreshToken = "refresh_token" }
}

struct TokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: UserOut
    enum CodingKeys: String, CodingKey {
        case user
        case accessToken  = "access_token"
        case refreshToken = "refresh_token"
    }
}

struct AccessTokenResponse: Decodable {
    let accessToken: String
    enum CodingKeys: String, CodingKey { case accessToken = "access_token" }
}

// MARK: - Users
struct UserOut: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let locale: String
    let createdAt: Date
    let isAdmin: Bool
    let isSupporter: Bool
    enum CodingKeys: String, CodingKey {
        case id, email, name, locale
        case createdAt   = "created_at"
        case isAdmin     = "is_admin"
        case isSupporter = "is_supporter"
    }
}

struct UserUpdateRequest: Encodable {
    let name: String?
    let locale: String?
}

// MARK: - Field Definitions
struct FieldDefinitionOut: Codable, Identifiable {
    let id: String
    let scope: String
    let apiaryId: String?
    let target: String
    let name: String
    let type: String
    let options: [String]
    let required: Bool
    let sortOrder: Int
    enum CodingKeys: String, CodingKey {
        case id, scope, target, name, options, required
        case apiaryId  = "apiary_id"
        case type      = "type"
        case sortOrder = "sort_order"
    }
}

struct FieldDefinitionCreate: Encodable {
    let target: String
    let name: String
    let type: String
    let options: [String]
    let required: Bool
    let sortOrder: Int
    enum CodingKeys: String, CodingKey {
        case target, name, options, required
        case type      = "type"
        case sortOrder = "sort_order"
    }
}

// MARK: - Apiaries
struct ApiaryOut: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let latitude: Double?
    let longitude: Double?
    let address: String?
    let hiveCount: Int
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, name, description, latitude, longitude, address
        case hiveCount = "hive_count"
        case createdAt = "created_at"
    }
}

struct ApiaryCreate: Encodable {
    let name: String
    let description: String?
    let latitude: Double?
    let longitude: Double?
    let address: String?
}

// MARK: - QR Batches
struct QrTokenOut: Codable, Identifiable {
    let token: String
    let linkedHiveId: String?
    var id: String { token }
    var isLinked: Bool { linkedHiveId != nil }
    enum CodingKeys: String, CodingKey {
        case token
        case linkedHiveId = "linked_hive_id"
    }
}

struct QrBatchOut: Codable, Identifiable {
    let id: String
    let count: Int
    let createdAt: Date
    let tokens: [QrTokenOut]
    enum CodingKeys: String, CodingKey {
        case id, count, tokens
        case createdAt = "created_at"
    }
}

struct QrBatchSummary: Codable, Identifiable {
    let id: String
    let count: Int
    let createdAt: Date
    let linkedCount: Int
    enum CodingKeys: String, CodingKey {
        case id, count
        case createdAt   = "created_at"
        case linkedCount = "linked_count"
    }
}

struct QrBatchCreate: Encodable {
    let count: Int
}

// MARK: - Hives
struct HiveOut: Codable, Identifiable {
    let id: String
    let qrToken: String
    let apiaryId: String
    let name: String
    let hiveType: String
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]
    let initializedAt: Date
    let lastInspectionAt: Date?
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, name, latitude, longitude, notes
        case qrToken        = "qr_token"
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
        case initializedAt  = "initialized_at"
        case lastInspectionAt = "last_inspection_at"
        case createdAt      = "created_at"
    }
}

struct HiveInitializeRequest: Encodable {
    let qrToken: String
    let apiaryId: String
    let name: String
    let hiveType: String
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]
    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude, notes
        case qrToken        = "qr_token"
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
    }
}

struct HiveUpdateRequest: Encodable {
    let apiaryId: String?
    let name: String?
    let hiveType: String?
    let latitude: Double?
    let longitude: Double?
    let acquisitionDate: String?
    let notes: String?
    let customFields: [String: JSONValue]?
    enum CodingKeys: String, CodingKey {
        case name, latitude, longitude, notes
        case apiaryId       = "apiary_id"
        case hiveType       = "hive_type"
        case acquisitionDate = "acquisition_date"
        case customFields   = "custom_fields"
    }
}

enum QRScanResult {
    case linked(HiveOut)
    case unlinked(token: String)
}

struct QRUnlinkedResponse: Decodable {
    let status: String
    let token: String
}

// MARK: - Inspections
struct InspectionOut: Codable, Identifiable {
    let id: String
    let hiveId: String
    let date: String
    let queenSeen: Bool?
    let queenColor: String?
    let broodFrames: Int?
    let honeyFrames: Int?
    let mood: String?
    let populationStrength: Int?
    let varroaCount: Int?
    let swarmCellsSeen: Bool?
    let treatmentApplied: String?
    let feedingDone: Bool?
    let feedingType: String?
    let weightKg: Double?
    let notes: String?
    let customFields: [String: JSONValue]
    let createdAt: Date
    enum CodingKeys: String, CodingKey {
        case id, date, notes
        case hiveId           = "hive_id"
        case queenSeen        = "queen_seen"
        case queenColor       = "queen_color"
        case broodFrames      = "brood_frames"
        case honeyFrames      = "honey_frames"
        case mood
        case populationStrength = "population_strength"
        case varroaCount      = "varroa_count"
        case swarmCellsSeen   = "swarm_cells_seen"
        case treatmentApplied = "treatment_applied"
        case feedingDone      = "feeding_done"
        case feedingType      = "feeding_type"
        case weightKg         = "weight_kg"
        case customFields     = "custom_fields"
        case createdAt        = "created_at"
    }
}

struct InspectionCreateRequest: Encodable {
    let date: String
    let queenSeen: Bool?
    let queenColor: String?
    let broodFrames: Int?
    let honeyFrames: Int?
    let mood: String?
    let populationStrength: Int?
    let varroaCount: Int?
    let swarmCellsSeen: Bool?
    let treatmentApplied: String?
    let feedingDone: Bool?
    let feedingType: String?
    let weightKg: Double?
    let notes: String?
    let customFields: [String: JSONValue]
    enum CodingKeys: String, CodingKey {
        case date, notes
        case queenSeen        = "queen_seen"
        case queenColor       = "queen_color"
        case broodFrames      = "brood_frames"
        case honeyFrames      = "honey_frames"
        case mood
        case populationStrength = "population_strength"
        case varroaCount      = "varroa_count"
        case swarmCellsSeen   = "swarm_cells_seen"
        case treatmentApplied = "treatment_applied"
        case feedingDone      = "feeding_done"
        case feedingType      = "feeding_type"
        case weightKg         = "weight_kg"
        case customFields     = "custom_fields"
    }
}

// MARK: - Stats
struct TrendPoint: Codable, Identifiable {
    let date: String
    let value: JSONValue
    var id: String { date }
}

struct StatsPeriod: Codable {
    let from: String
    let to: String
    let preset: String
}

struct HiveStats: Codable {
    let hiveId: String
    let period: StatsPeriod
    let inspectionCount: Int
    let daysSinceLastInspection: Int?
    let queenSeenRate: Double?
    let moodDistribution: [String: Int]
    let swarmCellsCount: Int
    let varroaTrend: [TrendPoint]
    let broodFramesTrend: [TrendPoint]
    let honeyFramesTrend: [TrendPoint]
    let populationStrengthTrend: [TrendPoint]
    let weightTrend: [TrendPoint]
    let customFieldStats: [String: CustomFieldStat]
    enum CodingKeys: String, CodingKey {
        case period
        case hiveId                   = "hive_id"
        case inspectionCount          = "inspection_count"
        case daysSinceLastInspection  = "days_since_last_inspection"
        case queenSeenRate            = "queen_seen_rate"
        case moodDistribution         = "mood_distribution"
        case swarmCellsCount          = "swarm_cells_count"
        case varroaTrend              = "varroa_trend"
        case broodFramesTrend         = "brood_frames_trend"
        case honeyFramesTrend         = "honey_frames_trend"
        case populationStrengthTrend  = "population_strength_trend"
        case weightTrend              = "weight_trend"
        case customFieldStats         = "custom_field_stats"
    }
}

struct CustomFieldStat: Codable {
    let fieldName: String
    let type: String
    let trend: [TrendPoint]?
    let distribution: [String: Int]?
    enum CodingKeys: String, CodingKey {
        case type, trend, distribution
        case fieldName = "field_name"
    }
}

struct ApiaryStats: Codable {
    let apiaryId: String
    let period: StatsPeriod
    let hiveCount: Int
    let inspectionsTotal: Int
    let hivesInspectedLast30d: Int
    let hivesNotInspected30d: Int
    let averageVarroa: Double?
    let averageBroodFrames: Double?
    let averageHoneyFrames: Double?
    let moodDistribution: [String: Int]
    let swarmAlerts: Int
    enum CodingKeys: String, CodingKey {
        case period
        case apiaryId              = "apiary_id"
        case hiveCount             = "hive_count"
        case inspectionsTotal      = "inspections_total"
        case hivesInspectedLast30d = "hives_inspected_last_30d"
        case hivesNotInspected30d  = "hives_not_inspected_30d"
        case averageVarroa         = "average_varroa"
        case averageBroodFrames    = "average_brood_frames"
        case averageHoneyFrames    = "average_honey_frames"
        case moodDistribution      = "mood_distribution"
        case swarmAlerts           = "swarm_alerts"
    }
}

struct OverviewStats: Codable {
    let period: StatsPeriod
    let apiaryCount: Int
    let hiveCount: Int
    let inspectionsTotal: Int
    enum CodingKeys: String, CodingKey {
        case period
        case apiaryCount      = "apiary_count"
        case hiveCount        = "hive_count"
        case inspectionsTotal = "inspections_total"
    }
}

// MARK: - Admin
struct AdminUserOut: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let createdAt: Date
    let isSupporter: Bool
    let apiaryCount: Int
    let hiveCount: Int
    let inspectionCount: Int
    enum CodingKeys: String, CodingKey {
        case id, email, name
        case createdAt       = "created_at"
        case isSupporter     = "is_supporter"
        case apiaryCount     = "apiary_count"
        case hiveCount       = "hive_count"
        case inspectionCount = "inspection_count"
    }
}

struct SignupDay: Codable, Identifiable {
    let date: String
    let count: Int
    var id: String { date }
}

struct PlatformStats: Codable {
    let totalUsers: Int
    let newUsersInPeriod: Int
    let supporterCount: Int
    let totalApiaries: Int
    let publicApiaries: Int
    let totalHives: Int
    let totalInspections: Int
    let activeUsers30d: Int
    let signupsByDay: [SignupDay]
    enum CodingKeys: String, CodingKey {
        case totalUsers          = "total_users"
        case newUsersInPeriod    = "new_users_in_period"
        case supporterCount      = "supporter_count"
        case totalApiaries       = "total_apiaries"
        case publicApiaries      = "public_apiaries"
        case totalHives          = "total_hives"
        case totalInspections    = "total_inspections"
        case activeUsers30d      = "active_users_30d"
        case signupsByDay        = "signups_by_day"
    }
}

struct AdminTokenStats: Codable {
    let totalActiveSessions: Int
    let usersWithActiveSessions: Int
    let avgSessionsPerUser: Double
    enum CodingKeys: String, CodingKey {
        case totalActiveSessions      = "total_active_sessions"
        case usersWithActiveSessions  = "users_with_active_sessions"
        case avgSessionsPerUser       = "avg_sessions_per_user"
    }
}

struct AdminApiary: Codable, Identifiable {
    let id: String
    let name: String
    let ownerEmail: String
    let latitude: Double?
    let longitude: Double?
    let hiveCount: Int
    enum CodingKeys: String, CodingKey {
        case id, name, latitude, longitude
        case ownerEmail = "owner_email"
        case hiveCount  = "hive_count"
    }
}

struct HealthSummary: Codable {
    let inactiveUsersCount: Int
    let noVarroaApiariesCount: Int
    let zeroInspectionHivesCount: Int
    enum CodingKeys: String, CodingKey {
        case inactiveUsersCount       = "inactive_users_count"
        case noVarroaApiariesCount    = "no_varroa_apiaries_count"
        case zeroInspectionHivesCount = "zero_inspection_hives_count"
    }
}

struct InactiveUser: Codable, Identifiable {
    let id: String
    let email: String
    let createdAt: Date
    let daysSinceRegistration: Int
    enum CodingKeys: String, CodingKey {
        case id, email
        case createdAt             = "created_at"
        case daysSinceRegistration = "days_since_registration"
    }
}

struct NoVarroaApiary: Codable, Identifiable {
    let apiaryId: String
    let apiaryName: String
    let count: Int
    var id: String { apiaryId }
    enum CodingKeys: String, CodingKey {
        case count
        case apiaryId   = "apiary_id"
        case apiaryName = "apiary_name"
    }
}

struct ZeroInspectionHive: Codable, Identifiable {
    let hiveId: String
    let hiveName: String
    let apiaryName: String
    let initializedAt: Date
    var id: String { hiveId }
    enum CodingKeys: String, CodingKey {
        case hiveName    = "hive_name"
        case apiaryName  = "apiary_name"
        case hiveId      = "hive_id"
        case initializedAt = "initialized_at"
    }
}

struct SetSupporterRequest: Encodable {
    let isSupporter: Bool
    enum CodingKeys: String, CodingKey { case isSupporter = "is_supporter" }
}

// MARK: - Error
struct APIErrorEnvelope: Decodable {
    let error: ErrorDetail
    struct ErrorDetail: Decodable {
        let code: String
        let message: String
    }
}
