import SwiftUI

enum InspectionFormMode {
    case create
    case edit(InspectionOut)
}

struct InspectionFormView: View {
    let hiveId: String
    let mode: InspectionFormMode
    let onSave: (InspectionCreateRequest) async throws -> Void

    @Environment(\.dismiss) var dismiss
    @State private var date = Date()
    @State private var queenSeen: Bool? = nil
    @State private var queenColor: String? = nil
    @State private var broodFrames: Int? = nil
    @State private var honeyFrames: Int? = nil
    @State private var mood: String? = nil
    @State private var populationStrength: Int? = nil
    @State private var varroaCount: Int? = nil
    @State private var swarmCellsSeen: Bool? = nil
    @State private var treatmentApplied = ""
    @State private var feedingDone: Bool? = nil
    @State private var feedingType = ""
    @State private var weightKg = ""
    @State private var notes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let moods = ["calm", "nervous", "aggressive"]
    private let queenColors = ["white", "yellow", "red", "green", "blue"]
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    var body: some View {
        NavigationStack {
            Form {
                Section(NSLocalizedString("section.date", comment: "")) {
                    DatePicker(NSLocalizedString("field.date", comment: ""), selection: $date, displayedComponents: .date)
                }

                Section(NSLocalizedString("section.queen", comment: "")) {
                    OptionalToggle(label: NSLocalizedString("field.queenSeen", comment: ""), value: $queenSeen)

                    if queenSeen == true {
                        Picker(NSLocalizedString("field.queenColor", comment: ""), selection: Binding(
                            get: { queenColor ?? "" },
                            set: { queenColor = $0.isEmpty ? nil : $0 }
                        )) {
                            Text(NSLocalizedString("label.unknown", comment: "")).tag("")
                            ForEach(queenColors, id: \.self) { c in
                                Text(c.capitalized).tag(c)
                            }
                        }
                    }
                }

                Section(NSLocalizedString("section.frames", comment: "")) {
                    OptionalStepper(label: NSLocalizedString("field.broodFrames", comment: ""), value: $broodFrames, range: 0...10)
                    OptionalStepper(label: NSLocalizedString("field.honeyFrames", comment: ""), value: $honeyFrames, range: 0...10)
                }

                Section(NSLocalizedString("section.colony", comment: "")) {
                    Picker(NSLocalizedString("field.mood", comment: ""), selection: Binding(
                        get: { mood ?? "" },
                        set: { mood = $0.isEmpty ? nil : $0 }
                    )) {
                        Text(NSLocalizedString("label.notRecorded", comment: "")).tag("")
                        ForEach(moods, id: \.self) { m in Text(m.capitalized).tag(m) }
                    }

                    OptionalStepper(label: NSLocalizedString("field.populationStrength", comment: ""), value: $populationStrength, range: 1...5)
                    OptionalToggle(label: NSLocalizedString("field.swarmCellsSeen", comment: ""), value: $swarmCellsSeen)
                }

                Section(NSLocalizedString("section.varroa", comment: "")) {
                    OptionalIntField(label: NSLocalizedString("field.varroaCount", comment: ""), value: $varroaCount)
                }

                Section(NSLocalizedString("section.treatment", comment: "")) {
                    TextField(NSLocalizedString("field.treatmentApplied", comment: ""), text: $treatmentApplied)
                    OptionalToggle(label: NSLocalizedString("field.feedingDone", comment: ""), value: $feedingDone)
                    if feedingDone == true {
                        TextField(NSLocalizedString("field.feedingType", comment: ""), text: $feedingType)
                    }
                }

                Section(NSLocalizedString("section.weight", comment: "")) {
                    TextField(NSLocalizedString("field.weightKg", comment: ""), text: $weightKg)
                        .keyboardType(.decimalPad)
                }

                Section(NSLocalizedString("section.notes", comment: "")) {
                    TextField(NSLocalizedString("field.notes", comment: ""), text: $notes, axis: .vertical)
                        .lineLimit(4)
                }

                if let err = errorMessage {
                    Section {
                        ErrorBanner(message: err) { errorMessage = nil }
                    }
                    .listRowBackground(Color.clear).listRowInsets(.init())
                }
            }
            .navigationTitle(isEdit ? NSLocalizedString("action.editInspection", comment: "") : NSLocalizedString("action.newInspection", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(NSLocalizedString("action.save", comment: "")) {
                        Task { await save() }
                    }
                    .disabled(isSaving)
                }
            }
            .onAppear { prefill() }
        }
    }

    private var isEdit: Bool {
        if case .edit = mode { return true }
        return false
    }

    private func prefill() {
        if case .edit(let i) = mode {
            date = dateFormatter.date(from: i.date) ?? Date()
            queenSeen         = i.queenSeen
            queenColor        = i.queenColor
            broodFrames       = i.broodFrames
            honeyFrames       = i.honeyFrames
            mood              = i.mood
            populationStrength = i.populationStrength
            varroaCount       = i.varroaCount
            swarmCellsSeen    = i.swarmCellsSeen
            treatmentApplied  = i.treatmentApplied ?? ""
            feedingDone       = i.feedingDone
            feedingType       = i.feedingType ?? ""
            weightKg          = i.weightKg.map { String($0) } ?? ""
            notes             = i.notes ?? ""
        }
    }

    private func save() async {
        isSaving = true
        let req = InspectionCreateRequest(
            date:               dateFormatter.string(from: date),
            queenSeen:          queenSeen,
            queenColor:         queenColor,
            broodFrames:        broodFrames,
            honeyFrames:        honeyFrames,
            mood:               mood,
            populationStrength: populationStrength,
            varroaCount:        varroaCount,
            swarmCellsSeen:     swarmCellsSeen,
            treatmentApplied:   treatmentApplied.isEmpty ? nil : treatmentApplied,
            feedingDone:        feedingDone,
            feedingType:        feedingType.isEmpty ? nil : feedingType,
            weightKg:           Double(weightKg),
            notes:              notes.isEmpty ? nil : notes,
            customFields:       [:]
        )
        do {
            try await onSave(req)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}

// MARK: - Helper components

private struct OptionalToggle: View {
    let label: String
    @Binding var value: Bool?

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            Menu {
                Button(NSLocalizedString("label.yes", comment: "")) { value = true }
                Button(NSLocalizedString("label.no", comment: ""))  { value = false }
                Button(NSLocalizedString("label.notRecorded", comment: "")) { value = nil }
            } label: {
                Text(value == nil ? NSLocalizedString("label.notRecorded", comment: "") : (value! ? NSLocalizedString("label.yes", comment: "") : NSLocalizedString("label.no", comment: "")))
                    .foregroundColor(value == nil ? .secondary : .primary)
            }
        }
    }
}

private struct OptionalStepper: View {
    let label: String
    @Binding var value: Int?
    let range: ClosedRange<Int>

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            if let v = value {
                Stepper("\(v)", value: Binding(get: { v }, set: { value = $0 }), in: range)
                    .labelsHidden()
                Button { value = nil } label: {
                    Image(systemName: "xmark.circle").foregroundColor(.secondary)
                }
            } else {
                Button(NSLocalizedString("label.add", comment: "")) { value = range.lowerBound }
                    .foregroundColor(.orange)
            }
        }
    }
}

private struct OptionalIntField: View {
    let label: String
    @Binding var value: Int?

    var body: some View {
        HStack {
            Text(label)
            Spacer()
            TextField("0", value: $value, format: .number)
                .keyboardType(.numberPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 80)
        }
    }
}
