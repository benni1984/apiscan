import SwiftUI

struct ErrorBanner: View {
    let message: String
    var onDismiss: (() -> Void)?

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.white)
            Text(message)
                .foregroundColor(.white)
                .font(.subheadline)
            Spacer()
            if let dismiss = onDismiss {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .foregroundColor(.white)
                }
            }
        }
        .padding()
        .background(Color.red.opacity(0.85))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3).ignoresSafeArea()
            ProgressView()
                .progressViewStyle(.circular)
                .scaleEffect(1.5)
                .tint(.white)
        }
    }
}
