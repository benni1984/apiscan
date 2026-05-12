import SwiftUI

struct HiveDetailView: View {
    let hive: HiveOut
    let apiaryId: String
    @StateObject private var inspectionVM = InspectionViewModel()
    @State private var showAddInspection = false
    @State private var showStats = false
    @State private var showQR = false

    var body: some View {
        List {
            Section {
                HiveInfoRow(icon: "hexagon", label: NSLocalizedString("field.hiveType", comment: ""), value: hive.hiveType.capitalized)
                if let date = hive.acquisitionDate {
                    HiveInfoRow(icon: "calendar", label: NSLocalizedString("field.acquisitionDate", comment: ""), value: date)
                }
                if let lat = hive.latitude, let lon = hive.longitude {
                    HiveInfoRow(icon: "location", label: NSLocalizedString("field.location", comment: ""), value: String(format: "%.4f, %.4f", lat, lon))
                }
                if let notes = hive.notes, !notes.isEmpty {
                    HiveInfoRow(icon: "note.text", label: NSLocalizedString("field.notes", comment: ""), value: notes)
                }
            }

            if !hive.customFields.isEmpty {
                Section(NSLocalizedString("section.customFields", comment: "")) {
                    ForEach(hive.customFields.sorted(by: { $0.key < $1.key }), id: \.key) { key, value in
                        HiveInfoRow(icon: "tag", label: key, value: value.displayString)
                    }
                }
            }

            Section(NSLocalizedString("section.inspections", comment: "")) {
                if inspectionVM.inspections.isEmpty && !inspectionVM.isLoading {
                    Text(NSLocalizedString("empty.inspections", comment: ""))
                        .foregroundColor(.secondary)
                } else {
                    ForEach(inspectionVM.inspections) { insp in
                        NavigationLink(destination: InspectionDetailView(inspection: insp, hiveId: hive.id, apiaryId: apiaryId, inspectionVM: inspectionVM)) {
                            InspectionRow(inspection: insp)
                        }
                    }
                    .onDelete { indices in
                        Task {
                            for i in indices { try? await inspectionVM.delete(inspectionVM.inspections[i].id) }
                        }
                    }
                    if inspectionVM.isLoading {
                        HStack { Spacer(); ProgressView(); Spacer() }
                    }
                }
            }
        }
        .navigationTitle(hive.name)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button { showQR = true } label: { Image(systemName: "qrcode") }
                Button { showStats = true } label: { Image(systemName: "chart.xyaxis.line") }
                Button { showAddInspection = true } label: { Image(systemName: "plus") }
                    .accessibilityLabel(NSLocalizedString("action.newInspection", comment: ""))
            }
        }
        .task { await inspectionVM.load(hiveId: hive.id) }
        .refreshable { await inspectionVM.load(hiveId: hive.id) }
        .sheet(isPresented: $showAddInspection) {
            InspectionFormView(hiveId: hive.id, apiaryId: apiaryId, mode: .create) { req in
                _ = try await inspectionVM.create(hiveId: hive.id, request: req)
                showAddInspection = false
            }
        }
        .sheet(isPresented: $showStats) {
            NavigationStack { HiveStatsView(hiveId: hive.id, hiveName: hive.name) }
        }
        .sheet(isPresented: $showQR) {
            NavigationStack { HiveQRView(hive: hive) }
        }
    }
}

private struct HiveInfoRow: View {
    let icon: String
    let label: String
    let value: String
    var body: some View {
        Label {
            HStack {
                Text(label).foregroundColor(.secondary)
                Spacer()
                Text(value).multilineTextAlignment(.trailing)
            }
        } icon: {
            Image(systemName: icon).foregroundColor(.orange)
        }
    }
}

private struct InspectionRow: View {
    let inspection: InspectionOut
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(inspection.date).font(.headline)
            HStack(spacing: 12) {
                if let mood = inspection.mood {
                    Label(mood.capitalized, systemImage: moodIcon(mood))
                        .font(.caption).foregroundColor(moodColor(mood))
                }
                if let varroa = inspection.varroaCount {
                    Label("\(varroa)", systemImage: "ant").font(.caption).foregroundColor(.secondary)
                }
                if inspection.queenSeen == true {
                    Label(NSLocalizedString("label.queenSeen", comment: ""), systemImage: "crown")
                        .font(.caption).foregroundColor(.yellow)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func moodIcon(_ mood: String) -> String {
        switch mood {
        case "calm": return "face.smiling"
        case "nervous": return "face.dashed"
        case "aggressive": return "bolt.circle"
        default: return "face.smiling"
        }
    }

    private func moodColor(_ mood: String) -> Color {
        switch mood {
        case "calm": return .green
        case "nervous": return .orange
        case "aggressive": return .red
        default: return .secondary
        }
    }
}
