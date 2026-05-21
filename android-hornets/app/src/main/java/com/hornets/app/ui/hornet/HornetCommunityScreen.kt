package com.hornets.app.ui.hornet

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import com.hornets.app.R
import com.hornets.app.data.api.HornetSightingOut
import com.hornets.app.ui.common.LoadingScreen

@Composable
fun HornetCommunityContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()

    LaunchedEffect(Unit) { vm.loadSightings() }

    when {
        state.isLoading && state.sightings.isEmpty() -> LoadingScreen()
        state.sightings.isEmpty() -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(stringResource(R.string.hornet_community_empty),
                    style = MaterialTheme.typography.titleMedium)
            }
        }
        else -> {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(state.sightings) { sighting ->
                    SightingCard(sighting = sighting, vm = vm)
                }

                if (state.sightingsPage < state.sightingsPages) {
                    item {
                        OutlinedButton(
                            onClick = { vm.loadSightings(state.sightingsPage + 1) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(stringResource(R.string.action_load_more))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SightingCard(sighting: HornetSightingOut, vm: HornetViewModel) {
    val statusColor = when (sighting.status) {
        "confirmed" -> MaterialTheme.colorScheme.tertiary
        "rejected"  -> MaterialTheme.colorScheme.error
        else        -> MaterialTheme.colorScheme.secondary
    }
    val statusLabel = when (sighting.status) {
        "confirmed" -> stringResource(R.string.hornet_community_confirmed)
        "rejected"  -> stringResource(R.string.hornet_community_rejected)
        else        -> stringResource(R.string.hornet_community_pending)
    }

    Card(modifier = Modifier.fillMaxWidth()) {
        Column {
            // Photo
            SubcomposeAsyncImage(
                model = sighting.photoUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxWidth().height(200.dp)
            ) {
                when (painter.state) {
                    is coil.compose.AsyncImagePainter.State.Error -> {
                        Box(Modifier.fillMaxSize().height(200.dp), contentAlignment = Alignment.Center) {
                            Icon(Icons.Default.Photo, null)
                        }
                    }
                    else -> SubcomposeAsyncImageContent()
                }
            }

            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    sighting.description?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                    } ?: Spacer(Modifier.weight(1f))

                    SuggestionChip(
                        onClick = {},
                        label = { Text(statusLabel, style = MaterialTheme.typography.labelSmall,
                            color = statusColor) }
                    )
                }

                sighting.reporterName?.let {
                    Text(it, style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant)
                }

                // Voting buttons (pending only)
                if (sighting.status == "pending") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(onClick = { vm.vote(sighting.id, "yes") }) {
                            Text("${stringResource(R.string.hornet_community_vote_yes)} (${sighting.yesVotes})")
                        }
                        OutlinedButton(onClick = { vm.vote(sighting.id, "no") }) {
                            Text("${stringResource(R.string.hornet_community_vote_no)} (${sighting.noVotes})")
                        }
                    }
                }
            }
        }
    }
}
