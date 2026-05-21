import SwiftUI

struct HornetInfoView: View {
    @EnvironmentObject var vm: HornetViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {

                // Live stats
                if let stats = vm.stats {
                    HornetStatsGrid(stats: stats)
                }

                // Info cards
                InfoCard(
                    systemImage: "exclamationmark.triangle.fill",
                    color: .orange,
                    title: NSLocalizedString("hornets.info.problem", comment: ""),
                    body: NSLocalizedString("hornets.info.problemText", comment: "")
                )

                InfoCard(
                    systemImage: "arrow.triangle.2.circlepath",
                    color: .yellow,
                    title: NSLocalizedString("hornets.info.whyCatch", comment: ""),
                    body: NSLocalizedString("hornets.info.whyCatchText", comment: "")
                )

                InfoCard(
                    systemImage: "mappin.and.ellipse",
                    color: .red,
                    title: NSLocalizedString("hornets.info.reportNest", comment: ""),
                    body: NSLocalizedString("hornets.info.reportNestText", comment: "")
                )
            }
            .padding()
        }
        .task { await vm.loadStats() }
    }
}

private struct HornetStatsGrid: View {
    let stats: HornetStats

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(NSLocalizedString("hornets.stats.title", comment: ""))
                .font(.headline)

            LazyVGrid(columns: [
                GridItem(.flexible()), GridItem(.flexible())
            ], spacing: 12) {
                StatTile(
                    value: "\(stats.totalCaught)",
                    label: NSLocalizedString("hornets.stats.caught", comment: ""),
                    color: .orange
                )
                StatTile(
                    value: "\(stats.totalNests)",
                    label: NSLocalizedString("hornets.stats.nests", comment: ""),
                    color: .red
                )
                StatTile(
                    value: "\(stats.destroyedNests)",
                    label: NSLocalizedString("hornets.stats.destroyed", comment: ""),
                    color: .green
                )
                StatTile(
                    value: "\(stats.confirmedSightings)",
                    label: NSLocalizedString("hornets.stats.sightings", comment: ""),
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

private struct StatTile: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2.bold())
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

private struct InfoCard: View {
    let systemImage: String
    let color: Color
    let title: String
    let body: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .foregroundColor(color)
                Text(title)
                    .font(.headline)
            }
            Text(body)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}
