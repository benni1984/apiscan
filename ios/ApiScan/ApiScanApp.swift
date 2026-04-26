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

    var body: some Scene {
        WindowGroup {
            Group {
                if authVM.isAuthenticated {
                    MainTabView()
                        .environmentObject(authVM)
                        .task { await authVM.loadProfile() }
                } else {
                    LoginView()
                        .environmentObject(authVM)
                }
            }
        }
    }
}
