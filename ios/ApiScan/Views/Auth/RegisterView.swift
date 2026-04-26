import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var locale = "en"

    private let locales = ["en", "fr", "de"]
    private let localeLabels = ["English", "Français", "Deutsch"]

    var body: some View {
        Form {
            Section(NSLocalizedString("section.profile", comment: "")) {
                TextField(NSLocalizedString("field.name", comment: ""), text: $name)
                TextField(NSLocalizedString("field.email", comment: ""), text: $email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                SecureField(NSLocalizedString("field.password", comment: ""), text: $password)
            }

            Section(NSLocalizedString("section.language", comment: "")) {
                Picker(NSLocalizedString("field.language", comment: ""), selection: $locale) {
                    ForEach(Array(zip(locales, localeLabels)), id: \.0) { code, label in
                        Text(label).tag(code)
                    }
                }
            }

            if let error = authVM.errorMessage {
                Section {
                    ErrorBanner(message: error) { authVM.errorMessage = nil }
                }
                .listRowBackground(Color.clear)
                .listRowInsets(.init())
            }

            Section {
                Button {
                    Task { await authVM.register(email: email, password: password, name: name, locale: locale) }
                } label: {
                    HStack {
                        Spacer()
                        if authVM.isLoading { ProgressView().tint(.white) }
                        Text(NSLocalizedString("action.createAccount", comment: ""))
                        Spacer()
                    }
                }
                .disabled(authVM.isLoading || name.isEmpty || email.isEmpty || password.count < 8)
            }
        }
        .navigationTitle(NSLocalizedString("screen.register", comment: ""))
    }
}
