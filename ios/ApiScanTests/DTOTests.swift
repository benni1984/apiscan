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

    // MARK: - Helpers

    private func roundtrip<T: Codable>(_ value: T) throws -> T {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(T.self, from: data)
    }
}
