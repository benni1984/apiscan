import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showLogoutConfirm = false
    @State private var name = ""
    @State private var locale = "en"
    @State private var isSaving = false

    private let locales = [("en", "English"), ("fr", "Français"), ("de", "Deutsch")]

    var body: some View {
        Form {
            Section(NSLocalizedString("section.profile", comment: "")) {
                if let user = authVM.currentUser {
                    Text(user.email).foregroundColor(.secondary)
                }
                TextField(NSLocalizedString("field.name", comment: ""), text: $name)
                Picker(NSLocalizedString("field.language", comment: ""), selection: $locale) {
                    ForEach(locales, id: \.0) { code, label in
                        Text(label).tag(code)
                    }
                }
            }

            Section {
                Button {
                    Task { await save() }
                } label: {
                    HStack {
                        if isSaving { ProgressView() }
                        Text(NSLocalizedString("action.saveProfile", comment: ""))
                    }
                }
                .disabled(isSaving)
            }

            Section {
                Button(role: .destructive) {
                    showLogoutConfirm = true
                } label: {
                    Label(NSLocalizedString("action.logout", comment: ""), systemImage: "rectangle.portrait.and.arrow.right")
                }
            }

            Section {
                HStack {
                    Text("ApiScan").foregroundColor(.secondary)
                    Spacer()
                    Text("v1.0").foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle(NSLocalizedString("tab.settings", comment: ""))
        .onAppear {
            name   = authVM.currentUser?.name ?? ""
            locale = authVM.currentUser?.locale ?? "en"
        }
        .confirmationDialog(
            NSLocalizedString("alert.logoutConfirm", comment: ""),
            isPresented: $showLogoutConfirm,
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.logout", comment: ""), role: .destructive) {
                Task { await authVM.logout() }
            }
        }
    }

    private func save() async {
        isSaving = true
        await authVM.updateProfile(name: name, locale: locale)
        isSaving = false
    }
}
