import XCTest
@testable import ApiScan

final class DTOTests: XCTestCase {

    // MARK: - JSONValue

    func test_jsonValue_string_roundtrip() throws {
        let value = JSONValue.string("hello")
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_int_roundtrip() throws {
        let value = JSONValue.int(42)
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_double_roundtrip() throws {
        let value = JSONValue.double(3.14)
        let decoded = try roundtrip(value)
        XCTAssertEqual(decoded, value)
    }

    func test_jsonValue_bool_roundtrip() throws {
        XCTAssertEqual(try roundtrip(JSONValue.bool(true)), .bool(true))
        XCTAssertEqual(try roundtrip(JSONValue.bool(false)), .bool(false))
    }

    func test_jsonValue_null_roundtrip() throws {
        XCTAssertEqual(try roundtrip(JSONValue.null), .null)
    }

    func test_jsonValue_displayString_null() {
        XCTAssertEqual(JSONValue.null.displayString, "—")
    }

    func test_jsonValue_displayString_bool_true() {
        XCTAssertEqual(JSONValue.bool(true).displayString, "✓")
    }

    func test_jsonValue_displayString_string() {
        XCTAssertEqual(JSONValue.string("abc").displayString, "abc")
    }

    // MARK: - PaginatedResponse

    func test_paginatedResponse_decodesPerPageSnakeCase() throws {
        let json = #"{"items":[],"total":0,"page":1,"per_page":50,"pages":1}"#.data(using: .utf8)!
        let resp = try JSONDecoder().decode(PaginatedResponse<ApiaryOut>.self, from: json)
        XCTAssertEqual(resp.perPage, 50)
        XCTAssertEqual(resp.pages, 1)
        XCTAssertTrue(resp.items.isEmpty)
    }

    // MARK: - QrTokenOut

    func test_qrTokenOut_isLinked_true() {
        let token = QrTokenOut(token: "abc", linkedHiveId: "h-1")
        XCTAssertTrue(token.isLinked)
        XCTAssertEqual(token.id, "abc")
    }

    func test_qrTokenOut_isLinked_false() {
        let token = QrTokenOut(token: "abc", linkedHiveId: nil)
        XCTAssertFalse(token.isLinked)
    }

    // MARK: - UserOut

    func test_userOut_decodesSnakeCaseCreatedAt() throws {
        let json = #"{"id":"u-1","email":"a@b.com","name":"Alice","locale":"en","created_at":"2024-01-01T00:00:00Z","is_admin":false,"is_supporter":false}"#.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let user = try decoder.decode(UserOut.self, from: json)
        XCTAssertEqual(user.id, "u-1")
        XCTAssertEqual(user.name, "Alice")
        XCTAssertEqual(user.locale, "en")
    }

    // MARK: - InspectionOut

    func test_inspectionOut_dateIsStringNotDate() throws {
        let json = """
        {"id":"i-1","hive_id":"h-1","date":"2024-06-15","queen_seen":true,
         "queen_color":null,"brood_frames":3,"honey_frames":2,"mood":null,
         "population_strength":null,"varroa_count":null,"swarm_cells_seen":null,
         "treatment_applied":null,"feeding_done":null,"feeding_type":null,
         "weight_kg":null,"notes":null,"custom_fields":{},"created_at":"2024-01-01T00:00:00Z"}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let insp = try decoder.decode(InspectionOut.self, from: json)
        XCTAssertEqual(insp.date, "2024-06-15")
        XCTAssertEqual(insp.queenSeen, true)
        XCTAssertEqual(insp.broodFrames, 3)
    }

    // MARK: - AdminUserOut

    func test_adminUserOut_decodesSnakeCaseKeys() throws {
        let json = """
        {"id":"u-1","email":"a@b.com","name":"Alice","created_at":"2024-01-01T00:00:00Z",
         "is_supporter":true,"apiary_count":2,"hive_count":5,"inspection_count":10}
        """.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let user = try decoder.decode(AdminUserOut.self, from: json)
        XCTAssertEqual(user.id, "u-1")
        XCTAssertTrue(user.isSupporter)
        XCTAssertEqual(user.apiaryCount, 2)
        XCTAssertEqual(user.hiveCount, 5)
        XCTAssertEqual(user.inspectionCount, 10)
    }

    // MARK: - PlatformStats

    func test_platformStats_decodesSnakeCaseKeys() throws {
        let json = """
        {"total_users":100,"new_users_in_period":5,"supporter_count":12,
         "total_apiaries":30,"public_apiaries":10,"total_hives":80,
         "total_inspections":500,"active_users_30d":25,
         "signups_by_day":[{"date":"2024-01-01","count":3}]}
        """.data(using: .utf8)!
        let stats = try JSONDecoder().decode(PlatformStats.self, from: json)
        XCTAssertEqual(stats.totalUsers, 100)
        XCTAssertEqual(stats.newUsersInPeriod, 5)
        XCTAssertEqual(stats.supporterCount, 12)
        XCTAssertEqual(stats.activeUsers30d, 25)
        XCTAssertEqual(stats.signupsByDay.count, 1)
        XCTAssertEqual(stats.signupsByDay.first?.date, "2024-01-01")
    }

    // MARK: - HealthSummary

    func test_healthSummary_decodesSnakeCaseKeys() throws {
        let json = """
        {"inactive_users_count":3,"no_varroa_apiaries_count":7,"zero_inspection_hives_count":2}
        """.data(using: .utf8)!
        let summary = try JSONDecoder().decode(HealthSummary.self, from: json)
        XCTAssertEqual(summary.inactiveUsersCount, 3)
        XCTAssertEqual(summary.noVarroaApiariesCount, 7)
        XCTAssertEqual(summary.zeroInspectionHivesCount, 2)
    }

    // MARK: - Helpers

    private func roundtrip<T: Codable>(_ value: T) throws -> T {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(T.self, from: data)
    }
}
