import Foundation

enum APIError: LocalizedError {
    case notFound(String)
    case server(String)
    case network(Error)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .notFound(let m):  return m
        case .server(let m):    return m
        case .network(let e):   return e.localizedDescription
        case .decoding(let e):  return "Decode error: \(e.localizedDescription)"
        }
    }
}

final class APIClient {
    static var shared = APIClient()

    var baseURL = URL(string: "http://localhost:8000/api/v1")!

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init(session: URLSession = .shared) {
        self.session = session
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

    func postVoid<B: Encodable>(_ path: String, body: B) async throws {
        try await performVoid(method: "POST", path: path, bodyData: try encoder.encode(body))
    }

    // MARK: - Private

    private func perform<T: Decodable>(
        method: String,
        path: String,
        bodyData: Data? = nil
    ) async throws -> T {
        let req = buildRequest(method: method, path: path, bodyData: bodyData)
        let (data, resp) = try await execute(req)
        return try decode(data, statusCode: resp.statusCode)
    }

    private func performVoid(
        method: String,
        path: String,
        bodyData: Data? = nil
    ) async throws {
        let req = buildRequest(method: method, path: path, bodyData: bodyData)
        let (data, resp) = try await execute(req)
        if !(200..<300).contains(resp.statusCode) {
            let msg = (try? decoder.decode(APIErrorEnvelope.self, from: data))?.error.message ?? "Request failed"
            throw APIError.server(msg)
        }
    }

    private func buildRequest(method: String, path: String, bodyData: Data?) -> URLRequest {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let lang = Locale.current.language.languageCode?.identifier ?? "en"
        req.setValue(lang, forHTTPHeaderField: "Accept-Language")
        if let bodyData { req.httpBody = bodyData }
        return req
    }

    private func execute(_ request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw APIError.network(URLError(.badServerResponse))
            }
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
        case 404: throw APIError.notFound(msg)
        default:  throw APIError.server(msg)
        }
    }
}

// MARK: - Error envelope

private struct APIErrorEnvelope: Decodable {
    let error: APIErrorDetail
}

private struct APIErrorDetail: Decodable {
    let message: String
}
