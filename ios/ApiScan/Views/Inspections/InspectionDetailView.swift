import SwiftUI

struct InspectionDetailView: View {
    let inspection: InspectionOut
    let hiveId: String
    let apiaryId: String
    @ObservedObject var inspectionVM: InspectionViewModel
    @State private var showEdit = false
    @Environment(\.dismiss) var dismiss

    var body: some View {
        List {
            Section(NSLocalizedString("section.queen", comment: "")) {
                if let seen = inspection.queenSeen {
                    InfoRow(label: NSLocalizedString("field.queenSeen", comment: ""), value: seen ? NSLocalizedString("label.yes", comment: "") : NSLocalizedString("label.no", comment: ""))
                }
                if let color = inspection.queenColor {
                    InfoRow(label: NSLocalizedString("field.queenColor", comment: ""), value: color.capitalized)
                }
            }

            Section(NSLocalizedString("section.frames", comment: "")) {
                if let v = inspection.broodFrames { InfoRow(label: NSLocalizedString("field.broodFrames", comment: ""), value: "\(v)") }
                if let v = inspection.honeyFrames  { InfoRow(label: NSLocalizedString("field.honeyFrames", comment: ""), value: "\(v)") }
            }

            Section(NSLocalizedString("section.colony", comment: "")) {
                if let v = inspection.mood       { InfoRow(label: NSLocalizedString("field.mood", comment: ""), value: v.capitalized) }
                if let v = inspection.populationStrength { InfoRow(label: NSLocalizedString("field.populationStrength", comment: ""), value: "\(v)/5") }
                if let v = inspection.swarmCellsSeen { InfoRow(label: NSLocalizedString("field.swarmCellsSeen", comment: ""), value: v ? NSLocalizedString("label.yes", comment: "") : NSLocalizedString("label.no", comment: "")) }
            }

            Section(NSLocalizedString("section.varroa", comment: "")) {
                if let v = inspection.varroaCount { InfoRow(label: NSLocalizedString("field.varroaCount", comment: ""), value: "\(v)") }
            }

            Section(NSLocalizedString("section.treatment", comment: "")) {
                if let v = inspection.treatmentApplied, !v.isEmpty { InfoRow(label: NSLocalizedString("field.treatmentApplied", comment: ""), value: v) }
                if let v = inspection.feedingDone  { InfoRow(label: NSLocalizedString("field.feedingDone", comment: ""), value: v ? NSLocalizedString("label.yes", comment: "") : NSLocalizedString("label.no", comment: "")) }
                if let v = inspection.feedingType, !v.isEmpty { InfoRow(label: NSLocalizedString("field.feedingType", comment: ""), value: v) }
            }

            if let w = inspection.weightKg {
                Section { InfoRow(label: NSLocalizedString("field.weightKg", comment: ""), value: String(format: "%.1f kg", w)) }
            }

            if let notes = inspection.notes, !notes.isEmpty {
                Section(NSLocalizedString("section.notes", comment: "")) {
                    Text(notes).foregroundColor(.secondary)
                }
            }

            if !inspection.customFields.isEmpty {
                Section(NSLocalizedString("section.customFields", comment: "")) {
                    ForEach(inspection.customFields.sorted(by: { $0.key < $1.key }), id: \.key) { k, v in
                        InfoRow(label: k, value: v.displayString)
                    }
                }
            }
        }
        .navigationTitle(inspection.date)
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Button { showEdit = true } label: { Image(systemName: "pencil") }
                Button(role: .destructive) {
                    Task {
                        try? await inspectionVM.delete(inspection.id)
                        dismiss()
                    }
                } label: { Image(systemName: "trash") }
            }
        }
        .sheet(isPresented: $showEdit) {
            InspectionFormView(hiveId: hiveId, apiaryId: apiaryId, mode: .edit(inspection)) { req in
                try await inspectionVM.update(inspection.id, request: req)
                showEdit = false
            }
        }
    }
}

private struct InfoRow: View {
    let label: String
    let value: String
    var body: some View {
        HStack {
            Text(label).foregroundColor(.secondary)
            Spacer()
            Text(value).multilineTextAlignment(.trailing)
        }
    }
}
