package com.apiscan.app.ui.apiaries

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.apiscan.app.R
import com.apiscan.app.data.api.ApiaryOut
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.common.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiaryListScreen(
    onApiaryClick: (String) -> Unit,
    onScanClick: () -> Unit,
    onBatchClick: () -> Unit,
    onSettingsClick: () -> Unit,
    vm: ApiaryViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var showCreate by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_apiaries)) },
                actions = {
                    IconButton(onClick = onBatchClick)   { Icon(Icons.Default.Print, contentDescription = stringResource(R.string.tab_print)) }
                    IconButton(onClick = onScanClick)    { Icon(Icons.Default.QrCodeScanner, contentDescription = stringResource(R.string.tab_scan)) }
                    IconButton(onClick = onSettingsClick){ Icon(Icons.Default.Settings, contentDescription = stringResource(R.string.tab_settings)) }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Icon(Icons.Default.Add, contentDescription = stringResource(R.string.action_new_apiary))
            }
        }
    ) { padding ->
        Box(Modifier.padding(padding)) {
            when {
                state.isLoading && state.apiaries.isEmpty() -> LoadingScreen()
                state.apiaries.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(stringResource(R.string.empty_apiaries_title), style = MaterialTheme.typography.titleMedium)
                }
                else -> {
                    LazyColumn {
                        state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
                        items(state.apiaries) { apiary ->
                            ApiaryListItem(apiary, onClick = { onApiaryClick(apiary.id) }, onDelete = { vm.delete(apiary.id) })
                            HorizontalDivider()
                        }
                    }
                }
            }
        }
    }

    if (showCreate) {
        ApiaryFormDialog(
            onConfirm = { name, desc, lat, lon, addr ->
                vm.create(name, desc, lat, lon, addr) { showCreate = false }
            },
            onDismiss = { showCreate = false }
        )
    }
}

@Composable
private fun ApiaryListItem(apiary: ApiaryOut, onClick: () -> Unit, onDelete: () -> Unit) {
    var showDeleteConfirm by remember { mutableStateOf(false) }
    ListItem(
        headlineContent  = { Text(apiary.name, style = MaterialTheme.typography.titleMedium) },
        supportingContent = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Icon(Icons.Default.Hive, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                Text("${apiary.hiveCount} ${stringResource(R.string.label_hives)}", style = MaterialTheme.typography.bodySmall)
                apiary.address?.let { Text("· $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        },
        trailingContent = {
            IconButton(onClick = { showDeleteConfirm = true }) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) }
        },
        modifier = Modifier.clickable(onClick = onClick)
    )
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title   = { Text(stringResource(R.string.action_delete)) },
            text    = { Text(stringResource(R.string.alert_delete_apiary, apiary.name)) },
            confirmButton = { TextButton(onClick = { onDelete(); showDeleteConfirm = false }) { Text(stringResource(R.string.action_delete), color = MaterialTheme.colorScheme.error) } },
            dismissButton = { TextButton(onClick = { showDeleteConfirm = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }
}
