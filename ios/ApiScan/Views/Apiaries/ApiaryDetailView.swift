import SwiftUI

struct ApiaryDetailView: View {
    let apiary: ApiaryOut
    @StateObject private var hiveVM = HiveViewModel()
    @State private var showEdit = false
    @State private var showAddHive = false

    var body: some View {
        Group {
            if hiveVM.isLoading && hiveVM.hives.isEmpty {
                ProgressView()
            } else if hiveVM.hives.isEmpty {
                ContentUnavailableView(
                    NSLocalizedString("empty.hives.title", comment: ""),
                    systemImage: "hexagon",
                    description: Text(NSLocalizedString("empty.hives.description", comment: ""))
                )
            } else {
                List {
                    if let lat = apiary.latitude, let lon = apiary.longitude {
                        Section {
                            Label(
                                String(format: "%.4f, %.4f", lat, lon),
                                systemImage: "location"
                            ).foregroundColor(.secondary)
                        }
                    }

                    Section(NSLocalizedString("section.hives", comment: "")) {
                        ForEach(hiveVM.hives) { hive in
                            NavigationLink(destination: HiveDetailView(hive: hive, apiaryId: apiary.id)) {
                                HiveRow(hive: hive)
                            }
                        }
                        .onDelete { indices in
                            Task {
                                for i in indices { try? await hiveVM.delete(hiveVM.hives[i].id) }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(apiary.name)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showEdit = true } label: {
                    Image(systemName: "pencil")
                }
            }
        }
        .task { await hiveVM.load(apiaryId: apiary.id) }
        .refreshable { await hiveVM.load(apiaryId: apiary.id) }
        .sheet(isPresented: $showEdit) {
            ApiaryFormView(mode: .edit(apiary)) { name, desc, lat, lon, addr in
                showEdit = false
            }
        }
    }
}

struct HiveRow: View {
    let hive: HiveOut
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(hive.name).font(.headline)
            HStack(spacing: 8) {
                Text(hive.hiveType.capitalized)
                    .font(.caption)
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(Color.orange.opacity(0.15))
                    .foregroundColor(.orange)
                    .cornerRadius(6)
                if let last = hive.lastInspectionAt {
                    Text(last, style: .relative)
                        .font(.caption).foregroundColor(.secondary)
                } else {
                    Text(NSLocalizedString("label.neverInspected", comment: ""))
                        .font(.caption).foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
