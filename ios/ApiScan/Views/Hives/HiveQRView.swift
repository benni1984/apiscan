import SwiftUI

struct HiveQRView: View {
    let hive: HiveOut
    @Environment(\.dismiss) var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Text(hive.name).font(.title2.bold())

            AsyncImage(url: HiveService().qrImageURL(hiveId: hive.id)) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFit().frame(width: 250, height: 250)
                case .failure:
                    Image(systemName: "qrcode").font(.system(size: 100)).foregroundColor(.secondary)
                case .empty:
                    ProgressView().frame(width: 250, height: 250)
                @unknown default:
                    EmptyView()
                }
            }
            .padding()
            .background(Color.white)
            .cornerRadius(16)
            .shadow(radius: 4)

            Text(hive.qrToken)
                .font(.caption2)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Spacer()
        }
        .padding()
        .navigationTitle(NSLocalizedString("screen.qrCode", comment: ""))
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button(NSLocalizedString("action.done", comment: "")) { dismiss() }
            }
        }
    }
}
