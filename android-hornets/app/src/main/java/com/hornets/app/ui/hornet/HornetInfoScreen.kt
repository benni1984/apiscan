package com.hornets.app.ui.hornet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.hornets.app.R
import com.hornets.app.data.api.HornetStats

@Composable
fun HornetInfoContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.loadStats() }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live stats
        state.stats?.let { stats ->
            item { HornetStatsCard(stats) }
        }

        // Info cards
        item {
            HornetInfoCard(
                icon = Icons.Default.Warning,
                title = stringResource(R.string.hornet_info_problem),
                body = stringResource(R.string.hornet_info_problem_text)
            )
        }
        item {
            HornetInfoCard(
                icon = Icons.Default.Recycling,
                title = stringResource(R.string.hornet_info_why_catch),
                body = stringResource(R.string.hornet_info_why_catch_text)
            )
        }
        item {
            HornetInfoCard(
                icon = Icons.Default.LocationOn,
                title = stringResource(R.string.hornet_info_report_nest),
                body = stringResource(R.string.hornet_info_report_nest_text)
            )
        }
    }
}

@Composable
private fun HornetStatsCard(stats: HornetStats) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                stringResource(R.string.hornet_stats_title),
                style = MaterialTheme.typography.titleMedium
            )
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(stats.totalCaught.toString(), stringResource(R.string.hornet_stats_caught))
                StatItem(stats.totalNests.toString(), stringResource(R.string.hornet_stats_nests))
                StatItem(stats.destroyedNests.toString(), stringResource(R.string.hornet_stats_destroyed))
                StatItem(stats.confirmedSightings.toString(), stringResource(R.string.hornet_stats_sightings))
            }
        }
    }
}

@Composable
private fun StatItem(value: String, label: String) {
    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}

@Composable
private fun HornetInfoCard(icon: ImageVector, title: String, body: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleSmall)
                Text(body, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
