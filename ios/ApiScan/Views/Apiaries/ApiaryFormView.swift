import SwiftUI
import CoreLocation

enum ApiaryFormMode {
    case create
    case edit(ApiaryOut)
}

struct ApiaryFormView: View {
    let mode: ApiaryFormMode
    let onSave: (String, String?, Double?, Double?, String?) async throws -> Void

    @Environment(\.dismiss) var dismiss
    @State private var name = ""
    @State private var description = ""
    @State private var address = ""
    @State private var latitude: Double?
    @State private var longitude: Double?
    @State private var isLocating = false
    @State private var errorMessage: String?
    @State private var isSaving = false

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(NSLocalizedString("section.details", comment: "")) {
                    TextField(NSLocalizedString("field.name", comment: ""), text: $name)
                    TextField(NSLocalizedString("field.description", comment: ""), text: $description, axis: .vertical)
                        .lineLimit(3)
                }

                Section(NSLocalizedString("section.location", comment: "")) {
                    TextField(NSLocalizedString("field.address", comment: ""), text: $address)

                    if let lat = latitude, let lon = longitude {
                        Label(String(format: "%.5f, %.5f", lat, lon), systemImage: "location.fill")
                            .foregroundColor(.green)
                    }

                    Button {
                        Task { await locateMe() }
                    } label: {
                        HStack {
                            if isLocating { ProgressView() }
                            Text(NSLocalizedString("action.useMyLocation", comment: ""))
                        }
                    }
                    .disabled(isLocating)
                }

                if let err = errorMessage {
                    Section {
                        ErrorBanner(message: err) { errorMessage = nil }
                    }
                    .listRowBackground(Color.clear).listRowInsets(.init())
                }
            }
            .navigationTitle(isEdit ? NSLocalizedString("action.editApiary", comment: "") : NSLocalizedString("action.newApiary", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("action.save", comment: "")) {
                        Task { await save() }
                    }
                    .disabled(name.isEmpty || isSaving)
                }
            }
            .onAppear {
                if case .edit(let a) = mode {
                    name        = a.name
                    description = a.description ?? ""
                    address     = a.address ?? ""
                    latitude    = a.latitude
                    longitude   = a.longitude
                }
            }
        }
    }

    private func save() async {
        isSaving = true
        do {
            try await onSave(
                name,
                description.isEmpty ? nil : description,
                latitude,
                longitude,
                address.isEmpty ? nil : address
            )
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }

    private func locateMe() async {
        isLocating = true
        let locator = OneTimeLocator()
        if let loc = await locator.locate() {
            latitude  = loc.coordinate.latitude
            longitude = loc.coordinate.longitude
        }
        isLocating = false
    }
}

// Minimal one-shot location helper
final class OneTimeLocator: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocation?, Never>?

    func locate() async -> CLLocation? {
        await withCheckedContinuation { cont in
            continuation = cont
            manager.delegate = self
            manager.requestWhenInUseAuthorization()
            manager.requestLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        continuation?.resume(returning: locations.first)
        continuation = nil
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        continuation?.resume(returning: nil)
        continuation = nil
    }
}
