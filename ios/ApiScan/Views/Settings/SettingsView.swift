import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var showLogoutConfirm = false
    @State private var name = ""
    @State private var locale = "en"
    @State private var isSaving = false

    // Export
    @State private var apiaries: [ApiaryOut] = []
    @State private var showExportSheet = false
    @State private var exportApiaryIndex = 0
    @State private var exportFormat = "json"
    @State private var isExporting = false
    @State private var exportError: String?
    @State private var shareItems: [Any] = []
    @State private var showShareSheet = false

    private let locales = [("en", "English"), ("fr", "Français"), ("de", "Deutsch")]
    private let apiaryService = ApiaryService()
    private let exportService = ExportService()

    var body: some View {
        Form {
            Section(NSLocalizedString("section.profile", comment: "")) {
                if let user = authVM.currentUser {
                    Text(user.email).foregroundColor(.secondary)
                }
                TextField(NSLocalizedString("field.name", comment: ""), text: $name)
                Picker(NSLocalizedString("field.language", comment: ""), selection: $locale) {
                    ForEach(locales, id: \.0) { code, label in
                        Text(label).tag(code)
                    }
                }
            }

            Section {
                Button {
                    Task { await save() }
                } label: {
                    HStack {
                        if isSaving { ProgressView() }
                        Text(NSLocalizedString("action.saveProfile", comment: ""))
                    }
                }
                .disabled(isSaving)
            }

            if !apiaries.isEmpty {
                Section(NSLocalizedString("section.export", comment: "")) {
                    Button {
                        showExportSheet = true
                    } label: {
                        Label(NSLocalizedString("action.exportData", comment: ""), systemImage: "square.and.arrow.up")
                    }
                }
            }

            if let err = exportError {
                Section {
                    Text(err).foregroundColor(.red).font(.caption)
                }
            }

            if authVM.currentUser?.isAdmin == true {
                Section {
                    NavigationLink(destination: AdminView()) {
                        Label(NSLocalizedString("admin.title", comment: ""), systemImage: "shield.lefthalf.filled")
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    showLogoutConfirm = true
                } label: {
                    Label(NSLocalizedString("action.logout", comment: ""), systemImage: "rectangle.portrait.and.arrow.right")
                }
            }

            Section {
                HStack {
                    Text("ApiScan").foregroundColor(.secondary)
                    Spacer()
                    Text("v1.0").foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle(NSLocalizedString("tab.settings", comment: ""))
        .task {
            name   = authVM.currentUser?.name ?? ""
            locale = authVM.currentUser?.locale ?? "en"
            apiaries = (try? await apiaryService.list().items) ?? []
        }
        .confirmationDialog(
            NSLocalizedString("alert.logoutConfirm", comment: ""),
            isPresented: $showLogoutConfirm,
            titleVisibility: .visible
        ) {
            Button(NSLocalizedString("action.logout", comment: ""), role: .destructive) {
                Task { await authVM.logout() }
            }
        }
        .sheet(isPresented: $showExportSheet) {
            ExportPickerView(
                apiaries: apiaries,
                selectedIndex: $exportApiaryIndex,
                format: $exportFormat,
                isExporting: isExporting,
                onExport: {
                    Task { await doExport() }
                }
            )
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(items: shareItems)
        }
    }

    private func save() async {
        isSaving = true
        await authVM.updateProfile(name: name, locale: locale)
        isSaving = false
    }

    private func doExport() async {
        guard exportApiaryIndex < apiaries.count else { return }
        let apiary = apiaries[exportApiaryIndex]
        isExporting = true
        exportError = nil
        showExportSheet = false
        do {
            let data = try await exportService.exportApiary(apiaryId: apiary.id, format: exportFormat)
            let ext = exportFormat == "csv" ? "csv" : "json"
            let safe = apiary.name.replacingOccurrences(of: "[^a-zA-Z0-9_-]", with: "_", options: .regularExpression)
            let filename = "apiscan_\(safe)_inspections.\(ext)"
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
            try data.write(to: url)
            shareItems = [url]
            showShareSheet = true
        } catch {
            exportError = error.localizedDescription
        }
        isExporting = false
    }
}

// MARK: - Export picker sheet

private struct ExportPickerView: View {
    let apiaries: [ApiaryOut]
    @Binding var selectedIndex: Int
    @Binding var format: String
    let isExporting: Bool
    let onExport: () -> Void
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            Form {
                if apiaries.count > 1 {
                    Section(NSLocalizedString("label.selectApiary", comment: "")) {
                        Picker("", selection: $selectedIndex) {
                            ForEach(apiaries.indices, id: \.self) { i in
                                Text(apiaries[i].name).tag(i)
                            }
                        }
                        .pickerStyle(.wheel)
                        .labelsHidden()
                    }
                }

                Section(NSLocalizedString("label.selectFormat", comment: "")) {
                    Picker("", selection: $format) {
                        Text("JSON").tag("json")
                        Text("CSV").tag("csv")
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                }

                Section {
                    Button {
                        onExport()
                    } label: {
                        HStack {
                            if isExporting { ProgressView() }
                            Text(NSLocalizedString("action.download", comment: ""))
                        }
                    }
                    .disabled(isExporting)
                }
            }
            .navigationTitle(NSLocalizedString("action.exportData", comment: ""))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(NSLocalizedString("action.cancel", comment: "")) { dismiss() }
                }
            }
        }
    }
}

// MARK: - UIActivityViewController wrapper

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
