package com.apiscan.app.ui.hornet

import android.Manifest
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.apiscan.app.R
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun HornetReportContent(vm: HornetViewModel) {
    val state by vm.state.collectAsState()
    val tabs = listOf(
        stringResource(R.string.hornet_report_catch_tab),
        stringResource(R.string.hornet_report_nest_tab)
    )
    var selectedTab by remember { mutableIntStateOf(0) }

    Column(Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, label ->
                Tab(selected = selectedTab == index, onClick = { selectedTab = index },
                    text = { Text(label) })
            }
        }

        state.error?.let {
            Snackbar(modifier = Modifier.padding(8.dp)) {
                Text(it)
            }
        }

        when (selectedTab) {
            0 -> CatchForm(vm = vm)
            1 -> NestForm(vm = vm)
        }
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun CatchForm(vm: HornetViewModel) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val locationPerm = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    var count by remember { mutableIntStateOf(1) }
    var lat by remember { mutableStateOf<Double?>(null) }
    var lon by remember { mutableStateOf<Double?>(null) }
    var reporterName by remember { mutableStateOf("") }
    var showSuccess by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(stringResource(R.string.hornet_report_count), style = MaterialTheme.typography.labelMedium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(onClick = { if (count > 1) count-- }) {
                Text("−", style = MaterialTheme.typography.titleLarge)
            }
            Text("$count", style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.align(androidx.compose.ui.Alignment.CenterVertically))
            IconButton(onClick = { if (count < 1000) count++ }) {
                Text("+", style = MaterialTheme.typography.titleLarge)
            }
        }

        if (lat != null && lon != null) {
            Text(String.format("%.5f, %.5f", lat, lon),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        OutlinedButton(onClick = {
            if (locationPerm.status.isGranted) {
                val fused = LocationServices.getFusedLocationProviderClient(context)
                scope.launch {
                    try {
                        val loc = fused.lastLocation.await()
                        if (loc != null) { lat = loc.latitude; lon = loc.longitude }
                    } catch (_: Exception) {}
                }
            } else {
                locationPerm.launchPermissionRequest()
            }
        }) {
            Icon(Icons.Default.LocationOn, null)
            Spacer(Modifier.width(4.dp))
            Text(stringResource(R.string.action_use_my_location))
        }

        OutlinedTextField(
            value = reporterName, onValueChange = { reporterName = it },
            label = { Text(stringResource(R.string.hornet_report_reporter_name)) },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = {
                vm.submitCatch(
                    count = count, latitude = lat, longitude = lon,
                    reporterName = reporterName.ifBlank { null }
                ) {
                    count = 1; lat = null; lon = null; reporterName = ""; showSuccess = true
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !state.isLoading
        ) {
            if (state.isLoading) CircularProgressIndicator(Modifier.size(16.dp))
            else Text(stringResource(R.string.hornet_report_submit))
        }
    }

    if (showSuccess) {
        AlertDialog(
            onDismissRequest = { showSuccess = false },
            title = { Text(stringResource(R.string.hornet_report_success)) },
            confirmButton = { TextButton(onClick = { showSuccess = false }) { Text("OK") } }
        )
    }
}

@OptIn(ExperimentalPermissionsApi::class)
@Composable
private fun NestForm(vm: HornetViewModel) {
    val state by vm.state.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val locationPerm = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)
    var lat by remember { mutableStateOf<Double?>(null) }
    var lon by remember { mutableStateOf<Double?>(null) }
    var notes by remember { mutableStateOf("") }
    var reporterName by remember { mutableStateOf("") }
    var showSuccess by remember { mutableStateOf(false) }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (lat != null && lon != null) {
            Text(String.format("%.5f, %.5f", lat, lon),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            Text(stringResource(R.string.hornet_report_location_required),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error)
        }

        OutlinedButton(onClick = {
            if (locationPerm.status.isGranted) {
                val fused = LocationServices.getFusedLocationProviderClient(context)
                scope.launch {
                    try {
                        val loc = fused.lastLocation.await()
                        if (loc != null) { lat = loc.latitude; lon = loc.longitude }
                    } catch (_: Exception) {}
                }
            } else {
                locationPerm.launchPermissionRequest()
            }
        }) {
            Icon(Icons.Default.LocationOn, null)
            Spacer(Modifier.width(4.dp))
            Text(stringResource(R.string.action_use_my_location))
        }

        OutlinedTextField(
            value = notes, onValueChange = { notes = it },
            label = { Text(stringResource(R.string.field_notes)) },
            minLines = 2, maxLines = 4,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = reporterName, onValueChange = { reporterName = it },
            label = { Text(stringResource(R.string.hornet_report_reporter_name)) },
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = {
                val la = lat ?: return@Button
                val lo = lon ?: return@Button
                vm.submitNest(
                    latitude = la, longitude = lo,
                    notes = notes.ifBlank { null },
                    reporterName = reporterName.ifBlank { null }
                ) {
                    lat = null; lon = null; notes = ""; reporterName = ""; showSuccess = true
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = lat != null && lon != null && !state.isLoading
        ) {
            if (state.isLoading) CircularProgressIndicator(Modifier.size(16.dp))
            else Text(stringResource(R.string.hornet_report_submit))
        }
    }

    if (showSuccess) {
        AlertDialog(
            onDismissRequest = { showSuccess = false },
            title = { Text(stringResource(R.string.hornet_report_success)) },
            confirmButton = { TextButton(onClick = { showSuccess = false }) { Text("OK") } }
        )
    }
}
