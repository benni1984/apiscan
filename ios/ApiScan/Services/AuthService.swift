import Foundation

protocol AuthServiceProtocol {
    func register(email: String, password: String, name: String, locale: String) async throws -> TokenResponse
    func login(email: String, password: String) async throws -> TokenResponse
    func logout(refreshToken: String) async throws
    func getMe() async throws -> UserOut
    func updateMe(name: String?, locale: String?) async throws -> UserOut
}

struct AuthService: AuthServiceProtocol {
    private let client = APIClient.shared

    func register(email: String, password: String, name: String, locale: String) async throws -> TokenResponse {
        let body = RegisterRequest(email: email, password: password, name: name, locale: locale)
        return try await client.postNoAuth("auth/register", body: body)
    }

    func login(email: String, password: String) async throws -> TokenResponse {
        let body = LoginRequest(email: email, password: password)
        return try await client.postNoAuth("auth/login", body: body)
    }

    func logout(refreshToken: String) async throws {
        try await client.postVoidNoAuth("auth/logout", body: LogoutRequest(refreshToken: refreshToken))
    }

    func getMe() async throws -> UserOut {
        try await client.get("users/me")
    }

    func updateMe(name: String?, locale: String?) async throws -> UserOut {
        try await client.put("users/me", body: UserUpdateRequest(name: name, locale: locale))
    }
}
