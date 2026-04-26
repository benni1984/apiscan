import SwiftUI

struct QRBatchListView: View {
    @State private var batches: [QrBatchSummary] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showCreate = false
    @State private var newCount = 5

    private let service = QrBatchService()

    var body: some View {
        Group {
            if isLoading && batches.isEmpty {
                ProgressView()
            } else if batches.isEmpty {
                ContentUnavailableView(
                    NSLocalizedString("empty.batches.title", comment: ""),
                    systemImage: "printer",
                    description: Text(NSLocalizedString("empty.batches.description", comment: ""))
                )
            } else {
                List(batches) { batch in
                    NavigationLink(destination: QRBatchDetailView(batchId: batch.id)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(batch.createdAt, style: .date).font(.headline)
                            Text("\(batch.linkedCount)/\(batch.count) \(NSLocalizedString("label.linked", comment: ""))")
                                .font(.subheadline).foregroundColor(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.qrBatches", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button { showCreate = true } label: { Image(systemName: "plus") }
            }
        }
        .task { await load() }
        .refreshable { await load() }
        .alert(NSLocalizedString("action.newBatch", comment: ""), isPresented: $showCreate) {
            TextField(NSLocalizedString("field.count", comment: ""), value: $newCount, format: .number)
                .keyboardType(.numberPad)
            Button(NSLocalizedString("action.generate", comment: "")) {
                Task { await createBatch() }
            }
            Button(NSLocalizedString("action.cancel", comment: ""), role: .cancel) {}
        } message: {
            Text(NSLocalizedString("alert.batchCountHint", comment: ""))
        }
    }

    private func load() async {
        isLoading = true
        do {
            batches = try await service.list().items
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func createBatch() async {
        do {
            _ = try await service.create(count: max(1, min(50, newCount)))
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct QRBatchDetailView: View {
    let batchId: String
    @State private var batch: QrBatchOut?
    @State private var isLoading = true

    private let service = QrBatchService()

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else if let batch {
                List(batch.tokens) { token in
                    HStack {
                        Image(systemName: token.isLinked ? "link.circle.fill" : "link.circle")
                            .foregroundColor(token.isLinked ? .green : .secondary)
                        Text(token.token)
                            .font(.caption)
                            .lineLimit(1)
                        Spacer()
                        if token.isLinked {
                            Text(NSLocalizedString("label.linked", comment: ""))
                                .font(.caption2).foregroundColor(.green)
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("screen.batchDetail", comment: ""))
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Link(destination: service.pdfURL(batchId: batchId)) {
                    Label(NSLocalizedString("action.downloadPDF", comment: ""), systemImage: "arrow.down.doc")
                }
            }
        }
        .task {
            batch = try? await service.get(batchId)
            isLoading = false
        }
    }
}
