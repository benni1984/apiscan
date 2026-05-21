import SwiftUI
import CoreLocation

private enum ReportTab: Int, CaseIterable {
    case catch_, nest

    var label: String {
        switch self {
        case .catch_: return NSLocalizedString("hornets.report.catchTab", comment: "")
        case .nest:   return NSLocalizedString("hornets.report.nestTab", comment: "")
        }
    }
}

struct HornetReportView: View {
    @EnvironmentObject var vm: HornetViewModel
    @State private var selectedTab: ReportTab = .catch_

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Picker("", selection: $selectedTab) {
                    ForEach(ReportTab.allCases, id: \.self) { tab in
                        Text(tab.label).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                switch selectedTab {
                case .catch_:
                    CatchForm()
                        .environmentObject(vm)
                case .nest:
                    NestForm()
                        .environmentObject(vm)
                }
            }
            .padding(.top, 8)
        }
    }
}

// MARK: - Catch Form

private struct CatchForm: View {
    @EnvironmentObject var vm: HornetViewModel
    @State private var count = 1
    @State private var lat: Double? = nil
    @State private var lon: Double? = nil
    @State private var reporterName = ""
    @State private var locationLoading = false
    @State private var showSuccess = false

    var body: some View {
        VStack(spacing: 16) {
            GroupBox {
                Stepper(
                    "\(NSLocalizedString("hornets.report.count", comment: "")): \(count)",
                    value: $count, in: 1...1000
                )
            }

            GroupBox(label: Text(NSLocalizedString("hornets.report.location", comment: ""))) {
                VStack(alignment: .leading, spacing: 8) {
                    if let lat, let lon {
                        Text(String(format: "%.5f, %.5f", lat, lon))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Button {
                        requestLocation { c in lat = c.latitude; lon = c.longitude }
                    } label: {
                        HStack {
                            if locationLoading { ProgressView().scaleEffect(0.8) }
                            else { Image(systemName: "location") }
                            Text(NSLocalizedString("action.useMyLocation", comment: ""))
                        }
                    }
                    .disabled(locationLoading)
                }
            }

            GroupBox {
                TextField(
                    NSLocalizedString("hornets.report.reporterName", comment: ""),
                    text: $reporterName
                )
            }

            Button {
                Task {
                    await vm.submitCatch(
                        count: count,
                        latitude: lat, longitude: lon,
                        reporterName: reporterName.isEmpty ? nil : reporterName
                    )
                    if vm.errorMessage == nil {
                        count = 1; lat = nil; lon = nil; reporterName = ""
                        showSuccess = true
                    }
                }
            } label: {
                if vm.isLoading {
                    ProgressView()
                } else {
                    Text(NSLocalizedString("hornets.report.submit", comment: ""))
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(vm.isLoading)
        }
        .padding(.horizontal)
        .alert(
            NSLocalizedString("hornets.report.success", comment: ""),
            isPresented: $showSuccess
        ) {
            Button("OK", role: .cancel) {}
        }
    }

    private func requestLocation(completion: @escaping (CLLocationCoordinate2D) -> Void) {
        locationLoading = true
        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        let loc = manager.location
        locationLoading = false
        if let loc { completion(loc.coordinate) }
    }
}

// MARK: - Nest Form

private struct NestForm: View {
    @EnvironmentObject var vm: HornetViewModel
    @State private var lat: Double? = nil
    @State private var lon: Double? = nil
    @State private var notes = ""
    @State private var reporterName = ""
    @State private var locationLoading = false
    @State private var showSuccess = false

    var canSubmit: Bool { lat != nil && lon != nil }

    var body: some View {
        VStack(spacing: 16) {
            GroupBox(label: Text(NSLocalizedString("hornets.report.location", comment: ""))) {
                VStack(alignment: .leading, spacing: 8) {
                    if let lat, let lon {
                        Text(String(format: "%.5f, %.5f", lat, lon))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    } else {
                        Text(NSLocalizedString("hornets.report.locationRequired", comment: ""))
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    Button {
                        requestLocation { c in lat = c.latitude; lon = c.longitude }
                    } label: {
                        HStack {
                            if locationLoading { ProgressView().scaleEffect(0.8) }
                            else { Image(systemName: "location") }
                            Text(NSLocalizedString("action.useMyLocation", comment: ""))
                        }
                    }
                    .disabled(locationLoading)
                }
            }

            GroupBox(label: Text(NSLocalizedString("field.notes", comment: ""))) {
                TextField(
                    NSLocalizedString("hornets.report.notesPlaceholder", comment: ""),
                    text: $notes,
                    axis: .vertical
                )
                .lineLimit(3...6)
            }

            GroupBox {
                TextField(
                    NSLocalizedString("hornets.report.reporterName", comment: ""),
                    text: $reporterName
                )
            }

            Button {
                guard let lat, let lon else { return }
                Task {
                    await vm.submitNest(
                        latitude: lat, longitude: lon,
                        notes: notes.isEmpty ? nil : notes,
                        reporterName: reporterName.isEmpty ? nil : reporterName
                    )
                    if vm.errorMessage == nil {
                        self.lat = nil; self.lon = nil
                        notes = ""; reporterName = ""
                        showSuccess = true
                    }
                }
            } label: {
                if vm.isLoading {
                    ProgressView()
                } else {
                    Text(NSLocalizedString("hornets.report.submit", comment: ""))
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!canSubmit || vm.isLoading)
        }
        .padding(.horizontal)
        .alert(
            NSLocalizedString("hornets.report.success", comment: ""),
            isPresented: $showSuccess
        ) {
            Button("OK", role: .cancel) {}
        }
    }

    private func requestLocation(completion: @escaping (CLLocationCoordinate2D) -> Void) {
        locationLoading = true
        let manager = CLLocationManager()
        manager.requestWhenInUseAuthorization()
        let loc = manager.location
        locationLoading = false
        if let loc { completion(loc.coordinate) }
    }
}
