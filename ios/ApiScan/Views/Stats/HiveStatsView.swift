import SwiftUI
import Charts

struct HiveStatsView: View {
    let hiveId: String
    let hiveName: String

    @State private var stats: HiveStats?
    @State private var isLoading = false
    @State private var preset = "90d"
    @State private var fromDate = Calendar.current.date(byAdding: .month, value: -3, to: Date()) ?? Date()
    @State private var toDate = Date()
    @State private var useCustomRange = false

    private let presets = ["30d", "90d", "365d", "all"]
    private let service = StatsService()

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().padding(.top, 60)
            } else if let s = stats {
                VStack(spacing: 20) {
                    // Period picker
                    periodPicker

                    // Summary cards
                    summaryCards(s)

                    // Mood
                    if !s.moodDistribution.isEmpty {
                        ChartCard(title: NSLocalizedString("stat.moodDistribution", comment: "")) {
                            if #available(iOS 17, *) {
                                Chart(s.moodDistribution.sorted(by: { $0.key < $1.key }), id: \.key) { entry in
                                    SectorMark(angle: .value("Count", entry.value), innerRadius: .ratio(0.6))
                                        .foregroundStyle(by: .value("Mood", entry.key.capitalized))
                                }
                                .frame(height: 180)
                            } else {
                                Chart(s.moodDistribution.sorted(by: { $0.key < $1.key }), id: \.key) { entry in
                                    BarMark(x: .value("Mood", entry.key.capitalized), y: .value("Count", entry.value))
                                        .foregroundStyle(by: .value("Mood", entry.key.capitalized))
                                }
                                .frame(height: 180)
                            }
                        }
                    }

                    // Varroa trend
                    if !s.varroaTrend.isEmpty {
                        TrendChartCard(title: NSLocalizedString("stat.varroaTrend", comment: ""), points: s.varroaTrend, color: .red)
                    }

                    // Brood frames
                    if !s.broodFramesTrend.isEmpty {
                        TrendChartCard(title: NSLocalizedString("stat.broodFrames", comment: ""), points: s.broodFramesTrend, color: .orange)
                    }

                    // Honey frames
                    if !s.honeyFramesTrend.isEmpty {
                        TrendChartCard(title: NSLocalizedString("stat.honeyFrames", comment: ""), points: s.honeyFramesTrend, color: .yellow)
                    }

                    // Weight
                    if !s.weightTrend.isEmpty {
                        TrendChartCard(title: NSLocalizedString("stat.weight", comment: ""), points: s.weightTrend, color: .blue)
                    }
                }
                .padding()
            }
        }
        .navigationTitle(hiveName)
        .task { await load() }
        .onChange(of: preset) { _ in Task { await load() } }
        .onChange(of: useCustomRange) { _ in Task { await load() } }
    }

    private var periodPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Toggle(NSLocalizedString("stat.customRange", comment: ""), isOn: $useCustomRange)
                .padding(.horizontal)

            if useCustomRange {
                DatePicker(NSLocalizedString("stat.from", comment: ""), selection: $fromDate, displayedComponents: .date)
                    .padding(.horizontal)
                DatePicker(NSLocalizedString("stat.to", comment: ""), selection: $toDate, displayedComponents: .date)
                    .padding(.horizontal)
            } else {
                Picker("", selection: $preset) {
                    ForEach(presets, id: \.self) { p in Text(p).tag(p) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
            }
        }
    }

    private func summaryCards(_ s: HiveStats) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            StatCard(title: NSLocalizedString("stat.inspections", comment: ""), value: "\(s.inspectionCount)", icon: "list.clipboard", color: .orange)
            if let days = s.daysSinceLastInspection {
                StatCard(title: NSLocalizedString("stat.daysSinceLast", comment: ""), value: "\(days)", icon: "calendar", color: .blue)
            }
            if let rate = s.queenSeenRate {
                StatCard(title: NSLocalizedString("stat.queenSeenRate", comment: ""), value: String(format: "%.0f%%", rate * 100), icon: "crown", color: .yellow)
            }
            StatCard(title: NSLocalizedString("stat.swarmAlerts", comment: ""), value: "\(s.swarmCellsCount)", icon: "exclamationmark.triangle", color: s.swarmCellsCount > 0 ? .red : .green)
        }
    }

    private func load() async {
        isLoading = true
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        do {
            if useCustomRange {
                stats = try await service.hiveStats(hiveId: hiveId, from: df.string(from: fromDate), to: df.string(from: toDate))
            } else {
                stats = try await service.hiveStats(hiveId: hiveId, preset: preset)
            }
        } catch {}
        isLoading = false
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.title2).foregroundColor(color)
            Text(value).font(.title.bold())
            Text(title).font(.caption).foregroundColor(.secondary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.08))
        .cornerRadius(12)
    }
}

struct ChartCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.headline)
            content
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct TrendChartCard: View {
    let title: String
    let points: [TrendPoint]
    let color: Color

    var body: some View {
        ChartCard(title: title) {
            Chart(points) { p in
                LineMark(
                    x: .value("Date", p.date),
                    y: .value("Value", numericValue(p.value))
                )
                .foregroundStyle(color)
                PointMark(
                    x: .value("Date", p.date),
                    y: .value("Value", numericValue(p.value))
                )
                .foregroundStyle(color)
            }
            .frame(height: 160)
        }
    }

    private func numericValue(_ v: JSONValue) -> Double {
        switch v {
        case .int(let i): return Double(i)
        case .double(let d): return d
        default: return 0
        }
    }
}
