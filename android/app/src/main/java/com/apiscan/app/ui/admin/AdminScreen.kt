package com.apiscan.app.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.apiscan.app.R
import com.apiscan.app.data.api.AdminApiary
import com.apiscan.app.data.api.AdminUserOut

// MARK: - Menu

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMenuScreen(
    onStatsClick: () -> Unit,
    onUsersClick: () -> Unit,
    onMapClick: () -> Unit,
    onHealthClick: () -> Unit,
    onBack: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_admin)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(contentPadding = padding) {
            item {
                ListItem(
                    headlineContent = { Text(stringResource(R.string.admin_stats)) },
                    leadingContent = { Icon(Icons.Default.DateRange, null) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, null) },
                    modifier = Modifier.clickable(onClick = onStatsClick)
                )
                HorizontalDivider()
                ListItem(
                    headlineContent = { Text(stringResource(R.string.admin_users)) },
                    leadingContent = { Icon(Icons.Default.Person, null) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, null) },
                    modifier = Modifier.clickable(onClick = onUsersClick)
                )
                HorizontalDivider()
                ListItem(
                    headlineContent = { Text(stringResource(R.string.admin_map)) },
                    leadingContent = { Icon(Icons.Default.LocationOn, null) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, null) },
                    modifier = Modifier.clickable(onClick = onMapClick)
                )
                HorizontalDivider()
                ListItem(
                    headlineContent = { Text(stringResource(R.string.admin_health)) },
                    leadingContent = { Icon(Icons.Default.Favorite, null) },
                    trailingContent = { Icon(Icons.Default.ChevronRight, null) },
                    modifier = Modifier.clickable(onClick = onHealthClick)
                )
                HorizontalDivider()
            }
        }
    }
}

// MARK: - Stats

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminStatsScreen(
    onBack: () -> Unit,
    vm: AdminStatsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    val presets = listOf("30d", "90d", "365d", "all")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.admin_stats)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(contentPadding = padding, modifier = Modifier.fillMaxSize()) {
            item {
                state.error?.let {
                    ErrorBanner(it) { vm.clearError() }
                }

                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    presets.forEachIndexed { idx, preset ->
                        SegmentedButton(
                            selected = state.preset == preset,
                            onClick = { vm.setPreset(preset) },
                            shape = SegmentedButtonDefaults.itemShape(idx, presets.size)
                        ) { Text(preset) }
                    }
                }

                if (state.isLoading) {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else state.stats?.let { s ->
                    StatSection(stringResource(R.string.admin_stats_users)) {
                        StatRow(stringResource(R.string.admin_stats_total_users), s.totalUsers)
                        StatRow(stringResource(R.string.admin_stats_new_users), s.newUsersInPeriod)
                        StatRow(stringResource(R.string.admin_stats_supporters), s.supporterCount)
                        StatRow(stringResource(R.string.admin_stats_active_30d), s.activeUsers30d)
                    }
                    StatSection(stringResource(R.string.admin_stats_platform)) {
                        StatRow(stringResource(R.string.admin_stats_apiaries), s.totalApiaries)
                        StatRow(stringResource(R.string.admin_stats_public_apiaries), s.publicApiaries)
                        StatRow(stringResource(R.string.admin_stats_hives), s.totalHives)
                        StatRow(stringResource(R.string.admin_stats_inspections), s.totalInspections)
                    }
                    state.tokenStats?.let { t ->
                        StatSection(stringResource(R.string.admin_stats_sessions)) {
                            StatRow(stringResource(R.string.admin_stats_active_sessions), t.totalActiveSessions)
                            StatRow(stringResource(R.string.admin_stats_users_online), t.usersWithActiveSessions)
                            Row(
                                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(stringResource(R.string.admin_stats_avg_sessions))
                                Text("%.1f".format(t.avgSessionsPerUser), color = MaterialTheme.colorScheme.secondary)
                            }
                        }
                    }
                    if (s.signupsByDay.isNotEmpty()) {
                        StatSection(stringResource(R.string.admin_stats_signups)) {
                            s.signupsByDay.takeLast(14).forEach { day ->
                                Row(
                                    Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(day.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                    Text("${day.count}", style = MaterialTheme.typography.bodyMedium)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Users

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsersScreen(
    onBack: () -> Unit,
    vm: AdminUsersViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var searchText by remember { mutableStateOf("") }
    var userToDelete by remember { mutableStateOf<AdminUserOut?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.admin_users)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(contentPadding = padding, modifier = Modifier.fillMaxSize()) {
            item {
                state.error?.let { ErrorBanner(it) { vm.clearError() } }

                OutlinedTextField(
                    value = searchText,
                    onValueChange = { searchText = it },
                    label = { Text(stringResource(R.string.admin_users_search)) },
                    singleLine = true,
                    trailingIcon = {
                        if (searchText.isNotEmpty()) {
                            IconButton(onClick = { searchText = ""; vm.search("") }) {
                                Icon(Icons.Default.Close, null)
                            }
                        } else {
                            IconButton(onClick = { vm.search(searchText) }) {
                                Icon(Icons.Default.Search, null)
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            if (state.isLoading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else {
                items(state.users) { user ->
                    AdminUserRow(
                        user = user,
                        onToggleSupporter = { vm.toggleSupporter(user) },
                        onRevokeTokens = { vm.revokeTokens(user.id) },
                        onDelete = { userToDelete = user }
                    )
                    HorizontalDivider()
                }

                if (state.pages > 1) {
                    item {
                        Row(
                            Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { vm.prevPage() }, enabled = state.page > 1) {
                                Text(stringResource(R.string.action_prev))
                            }
                            Text(
                                "${state.page} / ${state.pages}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            TextButton(onClick = { vm.nextPage() }, enabled = state.page < state.pages) {
                                Text(stringResource(R.string.action_next))
                            }
                        }
                    }
                }
            }
        }
    }

    userToDelete?.let { user ->
        AlertDialog(
            onDismissRequest = { userToDelete = null },
            title = { Text(stringResource(R.string.action_delete)) },
            text = { Text(stringResource(R.string.admin_users_delete_confirm, user.email)) },
            confirmButton = {
                TextButton(
                    onClick = { vm.deleteUser(user.id); userToDelete = null },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text(stringResource(R.string.action_delete)) }
            },
            dismissButton = {
                TextButton(onClick = { userToDelete = null }) { Text(stringResource(R.string.action_cancel)) }
            }
        )
    }
}

@Composable
private fun AdminUserRow(
    user: AdminUserOut,
    onToggleSupporter: () -> Unit,
    onRevokeTokens: () -> Unit,
    onDelete: () -> Unit
) {
    var showActions by remember { mutableStateOf(false) }

    ListItem(
        headlineContent = { Text(user.email) },
        supportingContent = {
            Column {
                Text(user.name, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("${user.apiaryCount} apiaries", style = MaterialTheme.typography.labelSmall)
                    Text("${user.hiveCount} hives", style = MaterialTheme.typography.labelSmall)
                    Text("${user.inspectionCount} inspections", style = MaterialTheme.typography.labelSmall)
                    if (user.isSupporter) {
                        Text(
                            stringResource(R.string.admin_users_supporter),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        },
        trailingContent = {
            IconButton(onClick = { showActions = true }) { Icon(Icons.Default.MoreVert, null) }
        }
    )

    if (showActions) {
        AlertDialog(
            onDismissRequest = { showActions = false },
            title = { Text(user.email) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    TextButton(
                        onClick = { onToggleSupporter(); showActions = false },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (user.isSupporter) stringResource(R.string.admin_users_remove_supporter)
                            else stringResource(R.string.admin_users_make_supporter)
                        )
                    }
                    TextButton(
                        onClick = { onRevokeTokens(); showActions = false },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text(stringResource(R.string.admin_users_revoke_tokens)) }
                    TextButton(
                        onClick = { onDelete(); showActions = false },
                        colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error),
                        modifier = Modifier.fillMaxWidth()
                    ) { Text(stringResource(R.string.action_delete)) }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showActions = false }) { Text(stringResource(R.string.action_cancel)) }
            }
        )
    }
}

// MARK: - Map

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMapScreen(
    onBack: () -> Unit,
    vm: AdminMapViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var apiaryToFlag by remember { mutableStateOf<AdminApiary?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.admin_map)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(contentPadding = padding, modifier = Modifier.fillMaxSize()) {
            item {
                state.error?.let { ErrorBanner(it) { vm.clearError() } }

                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    SegmentedButton(
                        selected = !state.showFlagged,
                        onClick = { vm.toggleFlagged(false) },
                        shape = SegmentedButtonDefaults.itemShape(0, 2)
                    ) { Text(stringResource(R.string.admin_map_all)) }
                    SegmentedButton(
                        selected = state.showFlagged,
                        onClick = { vm.toggleFlagged(true) },
                        shape = SegmentedButtonDefaults.itemShape(1, 2)
                    ) { Text(stringResource(R.string.admin_map_flagged)) }
                }
            }

            if (state.isLoading) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            } else {
                items(state.apiaries) { apiary ->
                    ListItem(
                        headlineContent = { Text(apiary.name) },
                        supportingContent = {
                            Column {
                                Text(apiary.ownerEmail, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                if (apiary.latitude != null && apiary.longitude != null) {
                                    Text(
                                        "%.4f, %.4f".format(apiary.latitude, apiary.longitude),
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                            }
                        },
                        trailingContent = {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("${apiary.hiveCount}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                Icon(Icons.Default.Home, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.secondary)
                                IconButton(onClick = { apiaryToFlag = apiary }) {
                                    Icon(Icons.Default.Lock, null, tint = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    )
                    HorizontalDivider()
                }

                if (state.pages > 1) {
                    item {
                        Row(
                            Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            TextButton(onClick = { vm.prevPage() }, enabled = state.page > 1) {
                                Text(stringResource(R.string.action_prev))
                            }
                            Text(
                                "${state.page} / ${state.pages}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.secondary
                            )
                            TextButton(onClick = { vm.nextPage() }, enabled = state.page < state.pages) {
                                Text(stringResource(R.string.action_next))
                            }
                        }
                    }
                }
            }
        }
    }

    apiaryToFlag?.let { apiary ->
        AlertDialog(
            onDismissRequest = { apiaryToFlag = null },
            title = { Text(stringResource(R.string.admin_map_set_private)) },
            text = { Text(stringResource(R.string.admin_map_set_private_confirm, apiary.name)) },
            confirmButton = {
                TextButton(
                    onClick = { vm.setPrivate(apiary); apiaryToFlag = null },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) { Text(stringResource(R.string.admin_map_set_private)) }
            },
            dismissButton = {
                TextButton(onClick = { apiaryToFlag = null }) { Text(stringResource(R.string.action_cancel)) }
            }
        )
    }
}

// MARK: - Health

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminHealthScreen(
    onBack: () -> Unit,
    vm: AdminHealthViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.admin_health)) },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) }
                }
            )
        }
    ) { padding ->
        LazyColumn(contentPadding = padding, modifier = Modifier.fillMaxSize()) {
            item {
                state.error?.let { ErrorBanner(it) { vm.clearError() } }

                if (state.isLoading) {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else state.summary?.let { s ->
                    HealthCard(
                        title = stringResource(R.string.admin_health_inactive),
                        count = s.inactiveUsersCount,
                        icon = Icons.Default.PersonOff,
                        isActive = state.activeDetail == HealthDetail.INACTIVE,
                        isDrillLoading = state.isDrillLoading && state.activeDetail == HealthDetail.INACTIVE,
                        onToggle = { vm.toggleDetail(HealthDetail.INACTIVE) }
                    ) {
                        state.inactiveUsers.forEach { u ->
                            ListItem(
                                headlineContent = { Text(u.email, style = MaterialTheme.typography.bodyMedium) },
                                supportingContent = {
                                    Text(
                                        stringResource(R.string.admin_health_days_since, u.daysSinceRegistration),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                }
                            )
                        }
                        if (state.inactivePage < state.inactivePages) {
                            TextButton(
                                onClick = { vm.loadMoreInactive() },
                                modifier = Modifier.fillMaxWidth()
                            ) { Text(stringResource(R.string.action_load_more)) }
                        }
                    }

                    HealthCard(
                        title = stringResource(R.string.admin_health_no_varroa),
                        count = s.noVarroaApiariesCount,
                        icon = Icons.Default.Warning,
                        isActive = state.activeDetail == HealthDetail.NO_VARROA,
                        isDrillLoading = state.isDrillLoading && state.activeDetail == HealthDetail.NO_VARROA,
                        onToggle = { vm.toggleDetail(HealthDetail.NO_VARROA) }
                    ) {
                        state.noVarroaApiaries.forEach { a ->
                            ListItem(
                                headlineContent = { Text(a.apiaryName, style = MaterialTheme.typography.bodyMedium) },
                                trailingContent = {
                                    Text("${a.count}", color = MaterialTheme.colorScheme.secondary)
                                }
                            )
                        }
                    }

                    HealthCard(
                        title = stringResource(R.string.admin_health_zero_hives),
                        count = s.zeroInspectionHivesCount,
                        icon = Icons.Default.Block,
                        isActive = state.activeDetail == HealthDetail.ZERO_HIVES,
                        isDrillLoading = state.isDrillLoading && state.activeDetail == HealthDetail.ZERO_HIVES,
                        onToggle = { vm.toggleDetail(HealthDetail.ZERO_HIVES) }
                    ) {
                        state.zeroInspectionHives.forEach { h ->
                            ListItem(
                                headlineContent = { Text(h.hiveName, style = MaterialTheme.typography.bodyMedium) },
                                supportingContent = {
                                    Text(h.apiaryName, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun HealthCard(
    title: String,
    count: Int,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isActive: Boolean,
    isDrillLoading: Boolean,
    onToggle: () -> Unit,
    drillContent: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
    ) {
        Column {
            ListItem(
                headlineContent = { Text(title) },
                leadingContent = { Icon(icon, null) },
                trailingContent = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("$count", color = MaterialTheme.colorScheme.secondary)
                        Icon(
                            if (isActive) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                            null
                        )
                    }
                },
                modifier = Modifier.clickable(onClick = onToggle)
            )
            if (isActive) {
                HorizontalDivider()
                if (isDrillLoading) {
                    Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    }
                } else {
                    Column(content = drillContent)
                }
            }
        }
    }
}

// MARK: - Shared helpers

@Composable
private fun ErrorBanner(message: String, onDismiss: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
        modifier = Modifier.fillMaxWidth().padding(16.dp)
    ) {
        Row(
            Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(message, Modifier.weight(1f), color = MaterialTheme.colorScheme.onErrorContainer)
            IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, null) }
        }
    }
}

@Composable
private fun StatSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Text(
        title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, top = 16.dp, bottom = 4.dp)
    )
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
        Column(content = content)
    }
}

@Composable
private fun StatRow(label: String, value: Int) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label)
        Text("$value", color = MaterialTheme.colorScheme.secondary)
    }
}
