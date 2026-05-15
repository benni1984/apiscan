#if DEBUG
import Foundation

final class MockURLProtocol: URLProtocol {
    private static let lock = NSLock()
    private static var handlers: [(pattern: String, status: Int, body: Data)] = []

    static func configure(_ entries: [(String, Int, String)]) {
        lock.lock()
        defer { lock.unlock() }
        handlers = entries.map { ($0.0, $0.1, Data($0.2.utf8)) }
    }

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let url = request.url?.absoluteString ?? ""
        Self.lock.lock()
        let match = Self.handlers.first { url.contains($0.pattern) }
        Self.lock.unlock()
        let (_, status, body) = match ?? ("", 200, Data("{}".utf8))
        let response = HTTPURLResponse(
            url: request.url!, statusCode: status,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}

// MARK: - Canned handler sets

extension MockURLProtocol {

    // Authenticated screens, all lists empty.
    static let authenticatedHandlers: [(String, Int, String)] = [
        ("inspections", 200, emptyList),
        ("hives",       200, emptyList),
        ("field-definitions", 200, "[]"),
        ("users/me",    200, userJSON),
        ("qr-batches",  200, emptyList),
        ("apiaries",    200, emptyList),
        ("auth/refresh",200, accessTokenJSON),
    ]

    // Authenticated screens, one apiary containing one hive (for deep-navigation tests).
    static let apiaryWithHiveHandlers: [(String, Int, String)] = [
        ("hives/h-1/inspections",       200, emptyList),
        ("apiaries/a-1/hives",          200, hiveListJSON),
        ("apiaries/a-1/field-definitions", 200, "[]"),
        ("hives/h-1",                   200, hiveJSON),
        ("apiaries/a-1",                200, apiaryJSON),
        ("field-definitions",           200, "[]"),
        ("users/me",                    200, userJSON),
        ("qr-batches",                  200, emptyList),
        ("apiaries",                    200, apiaryListJSON),
        ("auth/refresh",                200, accessTokenJSON),
    ]

    // Unauthenticated tests that need a working mock server (Register / Login success paths).
    static let unauthenticatedHandlers: [(String, Int, String)] = [
        ("auth/register", 200, tokenResponseJSON),
        ("auth/login",    200, tokenResponseJSON),
        ("users/me",      200, userJSON),
        ("apiaries",      200, emptyList),
    ]

    // MARK: - Canned JSON

    static let userJSON = """
    {"id":"u-1","email":"tester@example.com","name":"Test User","locale":"en","created_at":"2024-01-01T00:00:00Z","is_admin":false,"is_supporter":false}
    """

    private static let accessTokenJSON = """
    {"access_token":"ui-test-token"}
    """

    private static let tokenResponseJSON = """
    {"access_token":"ui-test-token","refresh_token":"ui-test-refresh","user":{"id":"u-1","email":"tester@example.com","name":"Test User","locale":"en","created_at":"2024-01-01T00:00:00Z","is_admin":false,"is_supporter":false}}
    """

    private static let emptyList = """
    {"items":[],"total":0,"page":1,"per_page":50,"pages":1}
    """

    private static let apiaryJSON = """
    {"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"created_at":"2024-01-01T00:00:00Z"}
    """

    private static let apiaryListJSON = """
    {"items":[{"id":"a-1","name":"Meadow","description":null,"latitude":null,"longitude":null,"address":null,"hive_count":1,"created_at":"2024-01-01T00:00:00Z"}],"total":1,"page":1,"per_page":50,"pages":1}
    """

    private static let hiveJSON = """
    {"id":"h-1","qr_token":"tok-h1","apiary_id":"a-1","name":"Hive Alpha","hive_type":"langstroth","latitude":null,"longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},"initialized_at":"2024-01-01T00:00:00Z","last_inspection_at":null,"created_at":"2024-01-01T00:00:00Z"}
    """

    private static let hiveListJSON = """
    {"items":[{"id":"h-1","qr_token":"tok-h1","apiary_id":"a-1","name":"Hive Alpha","hive_type":"langstroth","latitude":null,"longitude":null,"acquisition_date":null,"notes":null,"custom_fields":{},"initialized_at":"2024-01-01T00:00:00Z","last_inspection_at":null,"created_at":"2024-01-01T00:00:00Z"}],"total":1,"page":1,"per_page":50,"pages":1}
    """
}
#endif
