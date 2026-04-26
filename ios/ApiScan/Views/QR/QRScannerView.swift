import SwiftUI
import VisionKit

struct QRScannerView: UIViewControllerRepresentable {
    let onScan: (String) -> Void

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let vc = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            isHighlightingEnabled: true
        )
        vc.delegate = context.coordinator
        try? vc.startScanning()
        return vc
    }

    func updateUIViewController(_ vc: DataScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onScan: onScan) }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        let onScan: (String) -> Void
        private var scanned = false

        init(onScan: @escaping (String) -> Void) { self.onScan = onScan }

        func dataScanner(_ dataScanner: DataScannerViewController, didTapOn item: RecognizedItem) {
            guard !scanned, case .barcode(let barcode) = item, let value = barcode.payloadStringValue else { return }
            scanned = true
            dataScanner.stopScanning()
            onScan(value)
        }
    }
}

struct QRScanEntryView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @StateObject private var hiveVM = HiveViewModel()
    @State private var isScanning = false
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var scannedToken: String?
    @State private var showInitialize = false
    @State private var linkedHive: HiveOut?
    @State private var navigateToHive = false

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "qrcode.viewfinder")
                .font(.system(size: 96))
                .foregroundColor(.orange)

            Text(NSLocalizedString("scan.instruction", comment: ""))
                .font(.title3)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            if let err = errorMessage {
                ErrorBanner(message: err) { errorMessage = nil }
            }

            Button {
                if DataScannerViewController.isSupported && DataScannerViewController.isAvailable {
                    isScanning = true
                } else {
                    errorMessage = NSLocalizedString("error.cameraNotAvailable", comment: "")
                }
            } label: {
                Label(NSLocalizedString("action.scanQR", comment: ""), systemImage: "qrcode.viewfinder")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(14)
                    .padding(.horizontal)
            }

            Spacer()
        }
        .navigationTitle(NSLocalizedString("tab.scan", comment: ""))
        .sheet(isPresented: $isScanning) {
            QRScannerView { token in
                isScanning = false
                Task { await handleScan(token: token) }
            }
            .ignoresSafeArea()
        }
        .sheet(isPresented: $showInitialize) {
            if let token = scannedToken {
                HiveInitializeView(qrToken: token, apiaries: apiaryVM.apiaries) { newHive in
                    linkedHive = newHive
                    navigateToHive = true
                }
            }
        }
        .navigationDestination(isPresented: $navigateToHive) {
            if let hive = linkedHive {
                HiveDetailView(hive: hive, apiaryId: hive.apiaryId)
            }
        }
        .overlay { if isLoading { LoadingOverlay() } }
    }

    private func handleScan(token: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let result = try await HiveService().resolveQR(token: token)
            switch result {
            case .linked(let hive):
                linkedHive = hive
                navigateToHive = true
            case .unlinked(let t):
                scannedToken = t
                showInitialize = true
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }
}
