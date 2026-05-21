import SwiftUI

private enum HornetTab: Int, CaseIterable {
    case info, map, report, community

    var label: String {
        switch self {
        case .info:      return NSLocalizedString("hornets.tab.info", comment: "")
        case .map:       return NSLocalizedString("hornets.tab.map", comment: "")
        case .report:    return NSLocalizedString("hornets.tab.report", comment: "")
        case .community: return NSLocalizedString("hornets.tab.community", comment: "")
        }
    }
}

struct HornetView: View {
    @StateObject private var vm = HornetViewModel()
    @State private var selectedTab: HornetTab = .info

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Picker("", selection: $selectedTab) {
                    ForEach(HornetTab.allCases, id: \.self) { tab in
                        Text(tab.label).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.vertical, 8)

                Divider()

                Group {
                    switch selectedTab {
                    case .info:
                        HornetInfoView()
                            .environmentObject(vm)
                    case .map:
                        HornetMapView()
                            .environmentObject(vm)
                    case .report:
                        HornetReportView()
                            .environmentObject(vm)
                    case .community:
                        HornetCommunityView()
                            .environmentObject(vm)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .navigationTitle(NSLocalizedString("hornets.title", comment: ""))
            .navigationBarTitleDisplayMode(.inline)
        }
        .alert(NSLocalizedString("alert.error", comment: ""), isPresented: Binding(
            get: { vm.errorMessage != nil },
            set: { if !$0 { vm.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { vm.errorMessage = nil }
        } message: {
            Text(vm.errorMessage ?? "")
        }
    }
}
