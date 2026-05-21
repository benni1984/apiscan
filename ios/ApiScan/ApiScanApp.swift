import SwiftUI

// Setup instructions:
// 1. In Xcode: File > New > Project > App, name "ApiScan", bundle ID "com.apiscan.app"
// 2. Set minimum deployment to iOS 16
// 3. Delete auto-generated ContentView.swift
// 4. Add all files from this directory to the project (drag into navigator)
// 5. Enable capabilities: Location When In Use, Camera

@main
struct ApiScanApp: App {
    @StateObject private var authVM = AuthViewModel()

    init() {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-resetKeychain") {
            KeychainService.shared.clearAll()
        }
        if args.contains("-mockApiaryWithHive") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.apiaryWithHiveHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockAuthenticated") {
            KeychainService.shared.clearAll()
            KeychainService.shared.accessToken = "ui-test-token"
            KeychainService.shared.refreshToken = "ui-test-refresh"
            MockURLProtocol.configure(MockURLProtocol.authenticatedHandlers)
            APIClient.shared = .forUITesting()
        } else if args.contains("-mockServer") {
            MockURLProtocol.configure(MockURLProtocol.unauthenticatedHandlers)
            APIClient.shared = .forUITesting()
        }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            if authVM.isAuthenticated {
                MainTabView()
                    .environmentObject(authVM)
                    .task { await authVM.loadProfile() }
            } else {
                // Unauthenticated: ApiScan login + public Hornets tab always visible
                TabView {
                    NavigationStack {
                        LoginView()
                            .environmentObject(authVM)
                    }
                    .tabItem {
                        Label("ApiScan", systemImage: "hexagon.fill")
                    }

                    HornetView()
                    .tabItem {
                        Label(NSLocalizedString("tab.hornets", comment: ""), systemImage: "ant")
                    }
                }
                .tint(.orange)
            }
        }
    }
}
