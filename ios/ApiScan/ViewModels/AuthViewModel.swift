import Foundation
import SwiftUI

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: UserOut?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let service = AuthService()

    init() {
        isAuthenticated = KeychainService.shared.accessToken != nil
    }

    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.login(email: email, password: password)
            store(resp)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func register(email: String, password: String, name: String, locale: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let resp = try await service.register(email: email, password: password, name: name, locale: locale)
            store(resp)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func logout() async {
        if let refresh = KeychainService.shared.refreshToken {
            try? await service.logout(refreshToken: refresh)
        }
        KeychainService.shared.clearAll()
        currentUser = nil
        isAuthenticated = false
    }

    func loadProfile() async {
        do {
            currentUser = try await service.getMe()
        } catch {}
    }

    func updateProfile(name: String, locale: String) async {
        isLoading = true
        do {
            currentUser = try await service.updateMe(name: name, locale: locale)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func store(_ resp: TokenResponse) {
        KeychainService.shared.accessToken  = resp.accessToken
        KeychainService.shared.refreshToken = resp.refreshToken
        currentUser = resp.user
        isAuthenticated = true
        UserDefaults.standard.set(resp.user.locale, forKey: "appLocale")
    }
}
