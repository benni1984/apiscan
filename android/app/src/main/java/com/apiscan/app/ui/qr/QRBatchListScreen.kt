package com.apiscan.app.ui.qr

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.apiscan.app.R
import com.apiscan.app.data.api.QrBatchSummary
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.common.LoadingScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRBatchListScreen(
    onBatchClick: (String) -> Unit,
    onBack: () -> Unit,
    vm: QRBatchListViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var showCreate by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_qr_batches)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showCreate = true }) {
                Text("+", style = MaterialTheme.typography.headlineSmall)
            }
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingScreen()
            else -> LazyColumn(Modifier.padding(padding)) {
                state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
                if (state.batches.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = androidx.compose.ui.Alignment.Center) {
                            Text(stringResource(R.string.empty_qr_batches))
                        }
                    }
                } else {
                    items(state.batches) { batch ->
                        QrBatchListItem(batch, onClick = { onBatchClick(batch.id) })
                        HorizontalDivider()
                    }
                }
            }
        }
    }

    if (showCreate) {
        QRBatchCreateDialog(
            isCreating = state.isCreating,
            onCreate   = { count -> vm.create(count); showCreate = false },
            onDismiss  = { showCreate = false }
        )
    }
}

@Composable
private fun QrBatchListItem(batch: QrBatchSummary, onClick: () -> Unit) {
    ListItem(
        headlineContent  = { Text(stringResource(R.string.label_batch_id, batch.id.take(8))) },
        supportingContent = {
            Text(
                stringResource(R.string.label_batch_summary, batch.linkedCount, batch.count, batch.createdAt.take(10)),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        modifier = Modifier.clickable(onClick = onClick)
    )
}

@Composable
private fun QRBatchCreateDialog(isCreating: Boolean, onCreate: (Int) -> Unit, onDismiss: () -> Unit) {
    var countText by remember { mutableStateOf("5") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title   = { Text(stringResource(R.string.action_new_batch)) },
        text    = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(stringResource(R.string.label_batch_count_hint))
                OutlinedTextField(
                    value = countText,
                    onValueChange = { countText = it.filter { c -> c.isDigit() }.take(3) },
                    label = { Text(stringResource(R.string.field_batch_count)) },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                    )
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick  = { countText.toIntOrNull()?.takeIf { it in 1..100 }?.let(onCreate) },
                enabled  = !isCreating && countText.toIntOrNull()?.let { it in 1..100 } == true
            ) {
                if (isCreating) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                else Text(stringResource(R.string.action_generate))
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) } }
    )
}
