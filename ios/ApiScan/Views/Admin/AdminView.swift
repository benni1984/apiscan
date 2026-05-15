import SwiftUI

struct AdminView: View {
    var body: some View {
        List {
            NavigationLink(destination: AdminStatsView()) {
                Label(NSLocalizedString("admin.stats", comment: ""), systemImage: "chart.bar")
            }
            NavigationLink(destination: AdminUsersView()) {
                Label(NSLocalizedString("admin.users", comment: ""), systemImage: "person.3")
            }
            NavigationLink(destination: AdminMapView()) {
                Label(NSLocalizedString("admin.map", comment: ""), systemImage: "map")
            }
            NavigationLink(destination: AdminHealthView()) {
                Label(NSLocalizedString("admin.health", comment: ""), systemImage: "heart.text.square")
            }
        }
        .navigationTitle(NSLocalizedString("admin.title", comment: ""))
    }
}

// MARK: - Stats

struct AdminStatsView: View {
    @StateObject private var vm = AdminStatsViewModel()
    private let presets = ["30d", "90d", "365d", "all"]

    var body: some View {
        List {
            if let err = vm.errorMessage {
                Text(err).foregroundColor(.red).font(.caption)
            }

            Section(NSLocalizedString("admin.stats.preset", comment: "")) {
                Picker("", selection: $vm.preset) {
                    ForEach(presets, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .onChange(of: vm.preset) { _ in Task { await vm.load() } }
            }

            if vm.isLoading {
                ProgressView()
            } else if let s = vm.stats {
                Section(NSLocalizedString("admin.stats.users", comment: "")) {
                    statRow(NSLocalizedString("admin.stats.totalUsers", comment: ""), value: s.totalUsers)
                    statRow(NSLocalizedString("admin.stats.newUsers", comment: ""), value: s.newUsersInPeriod)
                    statRow(NSLocalizedString("admin.stats.supporters", comment: ""), value: s.supporterCount)
                    statRow(NSLocalizedString("admin.stats.active30d", comment: ""), value: s.activeUsers30d)
                }

                Section(NSLocalizedString("admin.stats.platform", comment: "")) {
                    statRow(NSLocalizedString("admin.stats.apiaries", comment: ""), value: s.totalApiaries)
                    statRow(NSLocalizedString("admin.stats.publicApiaries", comment: ""), value: s.publicApiaries)
                    statRow(NSLocalizedString("admin.stats.hives", comment: ""), value: s.totalHives)
                    statRow(NSLocalizedString("admin.stats.inspections", comment: ""), value: s.totalInspections)
                }

                if let t = vm.tokenStats {
                    Section(NSLocalizedString("admin.stats.sessions", comment: "")) {
                        statRow(NSLocalizedString("admin.stats.activeSessions", comment: ""), value: t.totalActiveSessions)
                        statRow(NSLocalizedString("admin.stats.usersOnline", comment: ""), value: t.usersWithActiveSessions)
                        HStack {
                            Text(NSLocalizedString("admin.stats.avgSessions", comment: ""))
                            Spacer()
                            Text(String(format: "%.1f", t.avgSessionsPerUser)).foregroundColor(.secondary)
                        }
                    }
                }

                if !s.signupsByDay.isEmpty {
                    Section(NSLocalizedString("admin.stats.signups", comment: "")) {
                        ForEach(s.signupsByDay.suffix(14)) { day in
                            HStack {
                                Text(day.date).font(.caption).foregroundColor(.secondary)
                                Spacer()
                                Text("\(day.count)").bold()
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("admin.stats", comment: ""))
        .task { await vm.load() }
    }

    private func statRow(_ label: String, value: Int) -> some View {
        HStack {
            Text(label)
            Spacer()
            Text("\(value)").foregroundColor(.secondary)
        }
    }
}

// MARK: - Users

struct AdminUsersView: View {
    @StateObject private var vm = AdminUsersViewModel()

    var body: some View {
        List {
            if let err = vm.errorMessage {
                Text(err).foregroundColor(.red).font(.caption)
            }

            Section {
                TextField(NSLocalizedString("admin.users.search", comment: ""), text: $vm.search)
                    .submitLabel(.search)
                    .onSubmit { Task { vm.page = 1; await vm.load() } }
            }

            if vm.isLoading {
                ProgressView()
            } else {
                ForEach(vm.users) { user in
                    userRow(user)
                }
            }

            if vm.pages > 1 {
                Section {
                    HStack {
                        Button(NSLocalizedString("action.prev", comment: "")) {
                            Task { vm.page = max(1, vm.page - 1); await vm.load() }
                        }
                        .disabled(vm.page <= 1)
                        Spacer()
                        Text("\(vm.page) / \(vm.pages)").font(.caption).foregroundColor(.secondary)
                        Spacer()
                        Button(NSLocalizedString("action.next", comment: "")) {
                            Task { vm.page += 1; await vm.load() }
                        }
                        .disabled(vm.page >= vm.pages)
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("admin.users", comment: ""))
        .task { await vm.load() }
    }

    @ViewBuilder
    private func userRow(_ user: AdminUserOut) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(user.email).font(.headline)
            Text(user.name).font(.subheadline).foregroundColor(.secondary)
            HStack(spacing: 12) {
                Label("\(user.apiaryCount)", systemImage: "house")
                Label("\(user.hiveCount)", systemImage: "square.grid.2x2")
                Label("\(user.inspectionCount)", systemImage: "list.clipboard")
                if user.isSupporter {
                    Label(NSLocalizedString("admin.users.supporter", comment: ""), systemImage: "star.fill")
                        .foregroundColor(.yellow)
                        .font(.caption)
                }
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Task { await vm.deleteUser(user.id) }
            } label: {
                Label(NSLocalizedString("action.delete", comment: ""), systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading) {
            Button {
                Task { await vm.toggleSupporter(user) }
            } label: {
                Label(
                    user.isSupporter
                        ? NSLocalizedString("admin.users.removeSupporter", comment: "")
                        : NSLocalizedString("admin.users.makeSupporter", comment: ""),
                    systemImage: user.isSupporter ? "star.slash" : "star"
                )
            }
            .tint(.yellow)

            Button {
                Task { await vm.revokeTokens(user.id) }
            } label: {
                Label(NSLocalizedString("admin.users.revokeTokens", comment: ""), systemImage: "arrow.counterclockwise")
            }
            .tint(.orange)
        }
    }
}

// MARK: - Map

struct AdminMapView: View {
    @StateObject private var vm = AdminMapViewModel()

    var body: some View {
        List {
            if let err = vm.errorMessage {
                Text(err).foregroundColor(.red).font(.caption)
            }

            Section {
                Picker("", selection: $vm.showFlagged) {
                    Text(NSLocalizedString("admin.map.all", comment: "")).tag(false)
                    Text(NSLocalizedString("admin.map.flagged", comment: "")).tag(true)
                }
                .pickerStyle(.segmented)
                .labelsHidden()
                .onChange(of: vm.showFlagged) { _ in Task { vm.page = 1; await vm.load() } }
            }

            if vm.isLoading {
                ProgressView()
            } else {
                ForEach(vm.apiaries) { apiary in
                    apiaryRow(apiary)
                }
            }

            if vm.pages > 1 {
                Section {
                    HStack {
                        Button(NSLocalizedString("action.prev", comment: "")) {
                            Task { vm.page = max(1, vm.page - 1); await vm.load() }
                        }
                        .disabled(vm.page <= 1)
                        Spacer()
                        Text("\(vm.page) / \(vm.pages)").font(.caption).foregroundColor(.secondary)
                        Spacer()
                        Button(NSLocalizedString("action.next", comment: "")) {
                            Task { vm.page += 1; await vm.load() }
                        }
                        .disabled(vm.page >= vm.pages)
                    }
                }
            }
        }
        .navigationTitle(NSLocalizedString("admin.map", comment: ""))
        .task { await vm.load() }
    }

    @ViewBuilder
    private func apiaryRow(_ apiary: AdminApiary) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(apiary.name).font(.headline)
            Text(apiary.ownerEmail).font(.caption).foregroundColor(.secondary)
            HStack {
                if let lat = apiary.latitude, let lon = apiary.longitude {
                    Text(String(format: "%.4f, %.4f", lat, lon)).font(.caption2).foregroundColor(.secondary)
                }
                Spacer()
                Label("\(apiary.hiveCount)", systemImage: "square.grid.2x2").font(.caption).foregroundColor(.secondary)
            }
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                Task { await vm.setPrivate(apiary) }
            } label: {
                Label(NSLocalizedString("admin.map.setPrivate", comment: ""), systemImage: "lock")
            }
            .tint(.orange)
        }
    }
}

// MARK: - Health

struct AdminHealthView: View {
    @StateObject private var vm = AdminHealthViewModel()

    var body: some View {
        List {
            if let err = vm.errorMessage {
                Text(err).foregroundColor(.red).font(.caption)
            }

            if vm.isLoading {
                ProgressView()
            } else if let s = vm.summary {
                healthCard(
                    title: NSLocalizedString("admin.health.inactive", comment: ""),
                    count: s.inactiveUsersCount,
                    detail: .inactive,
                    systemImage: "person.fill.xmark"
                )
                healthCard(
                    title: NSLocalizedString("admin.health.noVarroa", comment: ""),
                    count: s.noVarroaApiariesCount,
                    detail: .noVarroa,
                    systemImage: "exclamationmark.triangle"
                )
                healthCard(
                    title: NSLocalizedString("admin.health.zeroHives", comment: ""),
                    count: s.zeroInspectionHivesCount,
                    detail: .zeroHives,
                    systemImage: "square.slash"
                )
            }
        }
        .navigationTitle(NSLocalizedString("admin.health", comment: ""))
        .task { await vm.load() }
    }

    @ViewBuilder
    private func healthCard(title: String, count: Int, detail: AdminHealthViewModel.HealthDetail, systemImage: String) -> some View {
        Section {
            Button {
                Task { await vm.toggleDetail(detail) }
            } label: {
                HStack {
                    Label(title, systemImage: systemImage)
                    Spacer()
                    Text("\(count)").foregroundColor(.secondary)
                    Image(systemName: vm.activeDetail == detail ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
                .foregroundColor(.primary)
            }

            if vm.activeDetail == detail {
                if vm.isDrillLoading {
                    ProgressView()
                } else {
                    drillDown(detail)
                }
            }
        }
    }

    @ViewBuilder
    private func drillDown(_ detail: AdminHealthViewModel.HealthDetail) -> some View {
        switch detail {
        case .inactive:
            ForEach(vm.inactiveUsers) { u in
                VStack(alignment: .leading) {
                    Text(u.email).font(.subheadline)
                    Text("\(u.daysSinceRegistration) days since registration").font(.caption).foregroundColor(.secondary)
                }
            }
            if vm.inactivePage < vm.inactivePages {
                Button(NSLocalizedString("action.loadMore", comment: "")) {
                    Task { await vm.loadMoreInactive() }
                }
            }

        case .noVarroa:
            ForEach(vm.noVarroaApiaries) { a in
                HStack {
                    Text(a.apiaryName)
                    Spacer()
                    Text("\(a.count)").foregroundColor(.secondary)
                }
            }

        case .zeroHives:
            ForEach(vm.zeroInspectionHives) { h in
                VStack(alignment: .leading) {
                    Text(h.hiveName).font(.subheadline)
                    Text(h.apiaryName).font(.caption).foregroundColor(.secondary)
                }
            }
        }
    }
}
