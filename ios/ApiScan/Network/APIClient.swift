import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case notFound(String)
    case conflict(String)
    case validation(String)
    case server(String)
    case network(Error)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:     return NSLocalizedString("error.unauthorized", comment: "")
        case .notFound(let m):  return m
        case .conflict(let m):  return m
        case .validation(let m):return m
        case .server(let m):    return m
        case .network(let e):   return e.localizedDescription
        case .decoding(let e):  return "Decode error: \(e.localizedDescription)"
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    var baseURL = URL(string: "http://localhost:8000/api/v1")!

    private let session = URLSession.shared
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private var refreshTask: Task<Void, Error>?

    private init() {
        decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        encoder = JSONEncoder()
    }

    // MARK: - Public

    func get<T: Decodable>(_ path: String) async throws -> T {
        try await perform(method: "GET", path: path)
    }

    func post<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        try await perform(method: "POST", path: path, bodyData: try encoder.encode(body))
    }

    func put<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        try await perform(method: "PUT", path: path, bodyData: try encoder.encode(body))
    }

    func delete(_ path: String) async throws {
        try await performVoid(method: "DELETE", path: path)
    }

    func postNoAuth<B: Encodable, T: Decodable>(_ path: String, body: B) async throws -> T {
        try await perform(method: "POST", path: path, bodyData: try encoder.encode(body), requiresAuth: false)
    }

    func postVoidNoAuth<B: Encodable>(_ path: String, body: B) async throws {
        try await performVoid(method: "POST", path: path, bodyData: try encoder.encode(body), requiresAuth: false)
    }

    func getRawData(_ path: String) async throws -> Data {
        let req = try buildRequest(method: "GET", path: path, bodyData: nil, requiresAuth: true)
        let (data, resp) = try await execute(req)
        if (200..<300).contains(resp.statusCode) { return data }
        let msg = (try? decoder.decode(APIErrorEnvelope.self, from: data))?.error.message ?? "Request failed"
        throw APIError.server(msg)
    }

    // MARK: - Private

    private func perform<T: Decodable>(
        method: String,
        path: String,
        bodyData: Data? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        var req = try buildRequest(method: method, path: path, bodyData: bodyData, requiresAuth: requiresAuth)
        let (data, resp) = try await execute(req)

        if resp.statusCode == 401 && requiresAuth {
            try await ensureTokenRefreshed()
            req = try buildRequest(method: method, path: path, bodyData: bodyData, requiresAuth: true)
            let (retryData, retryResp) = try await execute(req)
            return try decode(retryData, statusCode: retryResp.statusCode)
        }

        return try decode(data, statusCode: resp.statusCode)
    }

    private func performVoid(
        method: String,
        path: String,
        bodyData: Data? = nil,
        requiresAuth: Bool = true
    ) async throws {
        let req = try buildRequest(method: method, path: path, bodyData: bodyData, requiresAuth: requiresAuth)
        let (data, resp) = try await execute(req)
        if !(200..<300).contains(resp.statusCode) {
            let msg = (try? decoder.decode(APIErrorEnvelope.self, from: data))?.error.message ?? "Request failed"
            throw APIError.server(msg)
        }
    }

    private func buildRequest(
        method: String,
        path: String,
        bodyData: Data?,
        requiresAuth: Bool
    ) throws -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let lang = Locale.current.language.languageCode?.identifier ?? "en"
        req.setValue(lang, forHTTPHeaderField: "Accept-Language")
        if let bodyData { req.httpBody = bodyData }
        if requiresAuth {
            guard let token = KeychainService.shared.accessToken else { throw APIError.unauthorized }
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return req
    }

    private func execute(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw APIError.network(URLError(.badServerResponse)) }
            return (data, http)
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.network(error)
        }
    }

    private func decode<T: Decodable>(_ data: Data, statusCode: Int) throws -> T {
        if (200..<300).contains(statusCode) {
            do { return try decoder.decode(T.self, from: data) }
            catch { throw APIError.decoding(error) }
        }
        let msg = (try? decoder.decode(APIErrorEnvelope.self, from: data))?.error.message ?? "Unknown error"
        switch statusCode {
        case 401: throw APIError.unauthorized
        case 404: throw APIError.notFound(msg)
        case 409: throw APIError.conflict(msg)
        case 422: throw APIError.validation(msg)
        default:  throw APIError.server(msg)
        }
    }

    private func ensureTokenRefreshed() async throws {
        if let existing = refreshTask {
            return try await existing.value
        }
        let task = Task<Void, Error> {
            defer { self.refreshTask = nil }
            guard let refresh = KeychainService.shared.refreshToken else { throw APIError.unauthorized }
            let body = RefreshRequest(refreshToken: refresh)
            let resp: AccessTokenResponse = try await postNoAuth("auth/refresh", body: body)
            KeychainService.shared.accessToken = resp.accessToken
        }
        refreshTask = task
        try await task.value
    }
}
