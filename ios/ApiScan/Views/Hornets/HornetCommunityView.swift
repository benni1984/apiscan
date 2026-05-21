import SwiftUI

struct HornetCommunityView: View {
    @EnvironmentObject var vm: HornetViewModel

    var body: some View {
        Group {
            if vm.isLoading && vm.sightings.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if vm.sightings.isEmpty {
                ContentUnavailableView(
                    NSLocalizedString("hornets.community.empty", comment: ""),
                    systemImage: "photo.on.rectangle.angled"
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(vm.sightings) { sighting in
                            SightingCard(sighting: sighting)
                                .environmentObject(vm)
                        }

                        if vm.sightingsPage < vm.sightingsPages {
                            Button(NSLocalizedString("action.loadMore", comment: "")) {
                                Task { await vm.loadSightings(page: vm.sightingsPage + 1) }
                            }
                            .padding()
                        }
                    }
                    .padding()
                }
            }
        }
        .task { await vm.loadSightings() }
    }
}

private struct SightingCard: View {
    @EnvironmentObject var vm: HornetViewModel
    let sighting: HornetSightingOut

    var statusColor: Color {
        switch sighting.status {
        case "confirmed": return .green
        case "rejected":  return .red
        default:          return .secondary
        }
    }

    var statusLabel: String {
        switch sighting.status {
        case "confirmed": return NSLocalizedString("hornets.community.confirmed", comment: "")
        case "rejected":  return NSLocalizedString("hornets.community.rejected", comment: "")
        default:          return NSLocalizedString("hornets.community.pending", comment: "")
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Photo
            AsyncImage(url: URL(string: sighting.photoUrl)) { phase in
                switch phase {
                case .success(let img):
                    img.resizable()
                        .scaledToFill()
                        .frame(maxWidth: .infinity)
                        .frame(height: 200)
                        .clipped()
                        .cornerRadius(10)
                case .failure:
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(.secondarySystemBackground))
                        .frame(height: 200)
                        .overlay(Image(systemName: "photo").foregroundColor(.secondary))
                case .empty:
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color(.secondarySystemBackground))
                        .frame(height: 200)
                        .overlay(ProgressView())
                @unknown default:
                    EmptyView()
                }
            }

            // Description + status
            HStack {
                if let desc = sighting.description {
                    Text(desc)
                        .font(.subheadline)
                        .lineLimit(2)
                }
                Spacer()
                Text(statusLabel)
                    .font(.caption.bold())
                    .foregroundColor(statusColor)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.15))
                    .cornerRadius(6)
            }

            // Reporter
            if let reporter = sighting.reporterName {
                Text(reporter)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Vote buttons (only for pending sightings)
            if sighting.status == "pending" {
                HStack(spacing: 12) {
                    VoteButton(
                        label: NSLocalizedString("hornets.community.vote.yes", comment: ""),
                        count: sighting.yesVotes,
                        color: .orange
                    ) {
                        Task { await vm.vote(sightingId: sighting.id, vote: "yes") }
                    }
                    VoteButton(
                        label: NSLocalizedString("hornets.community.vote.no", comment: ""),
                        count: sighting.noVotes,
                        color: .secondary
                    ) {
                        Task { await vm.vote(sightingId: sighting.id, vote: "no") }
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

private struct VoteButton: View {
    let label: String
    let count: Int
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(label).font(.subheadline)
                Text("(\(count))").font(.caption).foregroundColor(.secondary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(color.opacity(0.15))
            .cornerRadius(8)
        }
        .buttonStyle(.plain)
    }
}
