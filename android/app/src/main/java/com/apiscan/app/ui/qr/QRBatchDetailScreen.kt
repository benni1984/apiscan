package com.apiscan.app.ui.qr

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.apiscan.app.R
import com.apiscan.app.data.api.QrTokenOut
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.common.LoadingScreen

private const val BASE_URL = "http://10.0.2.2:8000/api/v1"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QRBatchDetailScreen(
    batchId: String,
    onBack: () -> Unit,
    vm: QRBatchDetailViewModel = hiltViewModel()
) {
    val state   = vm.state.collectAsState().value
    val context = LocalContext.current

    val downloadPdf = {
        vm.accessToken?.let { token ->
            val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val req = DownloadManager.Request(Uri.parse("$BASE_URL/qr-batches/$batchId/pdf"))
                .addRequestHeader("Authorization", "Bearer $token")
                .setMimeType("application/pdf")
                .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "qr-batch-${batchId.take(8)}.pdf")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setTitle("QR Batch ${batchId.take(8)}")
            dm.enqueue(req)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.screen_batch_detail)) },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
                actions = {
                    state.batch?.let {
                        IconButton(onClick = { downloadPdf() }) {
                            Icon(Icons.Default.Download, contentDescription = stringResource(R.string.action_download_pdf))
                        }
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.isLoading || state.batch == null -> LoadingScreen()
            else -> {
                val batch = state.batch
                LazyColumn(Modifier.padding(padding)) {
                    state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }

                    item {
                        Card(Modifier.fillMaxWidth().padding(16.dp)) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(stringResource(R.string.label_batch_id, batch.id.take(8)), style = MaterialTheme.typography.titleMedium)
                                Text(stringResource(R.string.label_created, batch.createdAt.take(10)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                val linkedCount = batch.tokens.count { it.isLinked }
                                Text(stringResource(R.string.label_linked_of, linkedCount, batch.count), style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }

                    item {
                        Row(
                            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(stringResource(R.string.label_qr_tokens), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.weight(1f))
                            OutlinedButton(onClick = { downloadPdf() }) {
                                Icon(Icons.Default.Download, null, Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(stringResource(R.string.action_download_pdf))
                            }
                        }
                    }

                    items(batch.tokens) { token ->
                        QrTokenRow(token)
                        HorizontalDivider()
                    }

                    item { Spacer(Modifier.height(24.dp)) }
                }
            }
        }
    }
}

@Composable
private fun QrTokenRow(token: QrTokenOut) {
    ListItem(
        headlineContent  = { Text(token.token.take(12) + "…", style = MaterialTheme.typography.bodyMedium) },
        supportingContent = {
            if (token.isLinked) {
                Text(stringResource(R.string.label_token_linked), color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.bodySmall)
            } else {
                Text(stringResource(R.string.label_token_unlinked), color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            }
        }
    )
}
