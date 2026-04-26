import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var showRegister = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                Image(systemName: "hexagon.fill")
                    .font(.system(size: 72))
                    .foregroundColor(.orange)

                Text("ApiScan")
                    .font(.largeTitle.bold())

                Text(NSLocalizedString("login.subtitle", comment: ""))
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)

                Spacer()

                VStack(spacing: 16) {
                    TextField(NSLocalizedString("field.email", comment: ""), text: $email)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .textFieldStyle(.roundedBorder)

                    SecureField(NSLocalizedString("field.password", comment: ""), text: $password)
                        .textFieldStyle(.roundedBorder)
                }

                if let error = authVM.errorMessage {
                    ErrorBanner(message: error) { authVM.errorMessage = nil }
                }

                Button {
                    Task { await authVM.login(email: email, password: password) }
                } label: {
                    HStack {
                        if authVM.isLoading { ProgressView().tint(.white) }
                        Text(NSLocalizedString("action.login", comment: ""))
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(authVM.isLoading || email.isEmpty || password.isEmpty)

                Button(NSLocalizedString("action.register", comment: "")) {
                    showRegister = true
                }
                .foregroundColor(.orange)

                Spacer()
            }
            .padding()
            .navigationDestination(isPresented: $showRegister) {
                RegisterView().environmentObject(authVM)
            }
        }
    }
}
