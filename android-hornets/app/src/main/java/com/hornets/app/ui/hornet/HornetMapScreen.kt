package com.hornets.app.ui.hornet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.hornets.app.R
import com.hornets.app.data.api.HornetNestProperties
import com.hornets.app.ui.common.LoadingScreen

@Composable
fun HornetMapContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.loadNests() }

    when {
        state.isLoading && state.nests == null -> LoadingScreen()
        state.nests == null || state.nests!!.features.isEmpty() -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.LocationOn, null, Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(stringResource(R.string.hornet_map_no_nests),
                        style = MaterialTheme.typography.titleMedium)
                    Text(stringResource(R.string.hornet_map_hint),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        else -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                item {
                    NestLegend()
                    Spacer(Modifier.height(8.dp))
                }
                items(state.nests!!.features) { feature ->
                    NestCard(feature.properties)
                }
            }
        }
    }
}

@Composable
private fun NestLegend() {
    Row(
        Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        LegendItem(color = Color(0xFFEF4444), label = stringResource(R.string.hornet_map_status_found))
        LegendItem(color = Color(0xFFF59E0B), label = stringResource(R.string.hornet_map_status_ordered))
        LegendItem(color = Color(0xFF22C55E), label = stringResource(R.string.hornet_map_status_destroyed))
    }
}

@Composable
private fun LegendItem(color: Color, label: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Surface(Modifier.size(12.dp), shape = MaterialTheme.shapes.small, color = color) {}
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun NestCard(properties: HornetNestProperties) {
    val statusColor = when (properties.status) {
        "destruction_ordered" -> Color(0xFFF59E0B)
        "destroyed"           -> Color(0xFF22C55E)
        else                  -> Color(0xFFEF4444)
    }
    val statusLabel = when (properties.status) {
        "destruction_ordered" -> stringResource(R.string.hornet_map_status_ordered)
        "destroyed"           -> stringResource(R.string.hornet_map_status_destroyed)
        else                  -> stringResource(R.string.hornet_map_status_found)
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                Modifier.size(16.dp),
                shape = MaterialTheme.shapes.small,
                color = statusColor
            ) {}
            Column(Modifier.weight(1f)) {
                properties.notes?.let {
                    Text(it, style = MaterialTheme.typography.bodyMedium)
                }
                Text(properties.id.take(8) + "…", style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            SuggestionChip(
                onClick = {},
                label = { Text(statusLabel, style = MaterialTheme.typography.labelSmall) }
            )
        }
    }
}
