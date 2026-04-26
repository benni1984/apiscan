import SwiftUI

struct ApiaryListView: View {
    @EnvironmentObject var apiaryVM: ApiaryViewModel
    @State private var showCreate = false

    var body: some View {
        Group {
            if apiaryVM.isLoading && apiaryVM.apiaries.isEmpty {
                ProgressView()
            } else if apiaryVM.apiaries.isEmpty {
                ContentUnavailableView(
                    NSLocalizedString("empty.apiaries.title", comment: ""),
                    systemImage: "map",
                    description: Text(NSLocalizedString("empty.apiaries.description", comment: ""))
                )
            } else {
                List {
                    ForEach(apiaryVM.apiaries) { apiary in
                        NavigationLink(destination: ApiaryDetailView(apiary: apiary)) {
                            ApiaryRow(apiary: apiary)
                        }
                    }
                    .onDelete { indices in
                        Task {
                            for i in indices {
                                try? await apiaryVM.delete(apiaryVM.apiaries[i].id)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.apiaries", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showCreate = true } label: { Image(systemName: "plus") }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                if apiaryVM.isLoading { ProgressView() }
            }
        }
        .refreshable { await apiaryVM.load() }
        .sheet(isPresented: $showCreate) {
            ApiaryFormView(mode: .create) { name, desc, lat, lon, addr in
                try await apiaryVM.create(name: name, description: desc, latitude: lat, longitude: lon, address: addr)
                showCreate = false
            }
        }
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { apiaryVM.errorMessage != nil },
            set: { if !$0 { apiaryVM.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { apiaryVM.errorMessage = nil }
        } message: {
            Text(apiaryVM.errorMessage ?? "")
        }
    }
}

private struct ApiaryRow: View {
    let apiary: ApiaryOut
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(apiary.name).font(.headline)
            HStack {
                Image(systemName: "hexagon").foregroundColor(.orange)
                Text("\(apiary.hiveCount) \(NSLocalizedString("label.hives", comment: ""))")
                    .font(.subheadline).foregroundColor(.secondary)
                if let addr = apiary.address {
                    Text("·").foregroundColor(.secondary)
                    Text(addr).font(.subheadline).foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
