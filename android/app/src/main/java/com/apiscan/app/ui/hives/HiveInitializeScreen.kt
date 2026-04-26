package com.apiscan.app.ui.hives

import android.annotation.SuppressLint
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.R
import com.apiscan.app.data.api.ApiaryOut
import com.apiscan.app.data.api.HiveInitializeRequest
import com.apiscan.app.data.repository.ApiaryRepository
import com.apiscan.app.data.repository.HiveRepository
import com.apiscan.app.ui.common.ErrorBanner
import com.google.android.gms.location.LocationServices
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import javax.inject.Inject

data class HiveInitState(
    val apiaries: List<ApiaryOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class HiveInitViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val apiaryRepo: ApiaryRepository,
    private val hiveRepo: HiveRepository
) : ViewModel() {
    val qrToken = savedState.get<String>("qrToken")!!
    private val _state = MutableStateFlow(HiveInitState())
    val state = _state.asStateFlow()

    init { viewModelScope.launch { _state.update { it.copy(apiaries = runCatching { apiaryRepo.list() }.getOrElse { emptyList() }) } } }

    fun initialize(name: String, hiveType: String, apiaryId: String, lat: Double?, lon: Double?, notes: String?, onSuccess: (String) -> Unit) =
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            runCatching {
                hiveRepo.initialize(HiveInitializeRequest(qrToken, apiaryId, name, hiveType, lat, lon, null, notes?.ifBlank { null }))
            }
            .onSuccess { hive -> onSuccess(hive.id) }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
        }

    fun clearError() = _state.update { it.copy(error = null) }
}

@SuppressLint("MissingPermission")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HiveInitializeScreen(
    qrToken: String,
    onSuccess: (String) -> Unit,
    onBack: () -> Unit,
    vm: HiveInitViewModel = hiltViewModel()
) {
    val state   by vm.state.collectAsState()
    val context = LocalContext.current
    var name    by remember { mutableStateOf("") }
    var hiveType by remember { mutableStateOf("langstroth") }
    var selectedApiaryId by remember { mutableStateOf("") }
    var notes   by remember { mutableStateOf("") }
    var lat     by remember { mutableStateOf<Double?>(null) }
    var lon     by remember { mutableStateOf<Double?>(null) }
    val hiveTypes = listOf("langstroth", "dadant", "top_bar", "warre", "other")

    LaunchedEffect(state.apiaries) {
        if (state.apiaries.isNotEmpty() && selectedApiaryId.isEmpty()) selectedApiaryId = state.apiaries.first().id
        // Auto-capture GPS
        runCatching {
            val loc = LocationServices.getFusedLocationProviderClient(context).lastLocation.await()
            loc?.let { lat = it.latitude; lon = it.longitude }
        }
    }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_initialize_hive)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        Column(
            Modifier.padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it },
                label = { Text(stringResource(R.string.field_hive_name)) },
                singleLine = true, modifier = Modifier.fillMaxWidth())

            ExposedDropdownMenuForList(
                label = stringResource(R.string.field_hive_type),
                options = hiveTypes.map { it.replace("_", " ").replaceFirstChar { c -> c.uppercase() } },
                selectedIndex = hiveTypes.indexOf(hiveType),
                onSelect = { hiveType = hiveTypes[it] }
            )

            if (state.apiaries.isNotEmpty()) {
                ExposedDropdownMenuForList(
                    label = stringResource(R.string.field_apiary),
                    options = state.apiaries.map { it.name },
                    selectedIndex = state.apiaries.indexOfFirst { it.id == selectedApiaryId }.coerceAtLeast(0),
                    onSelect = { selectedApiaryId = state.apiaries[it].id }
                )
            }

            if (lat != null && lon != null) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                    Row(Modifier.padding(12.dp)) {
                        Text("📍 %.4f, %.4f".format(lat, lon), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            OutlinedTextField(value = notes, onValueChange = { notes = it },
                label = { Text(stringResource(R.string.field_notes)) },
                minLines = 3, modifier = Modifier.fillMaxWidth())

            state.error?.let { ErrorBanner(it) { vm.clearError() } }

            Button(
                onClick  = { vm.initialize(name, hiveType, selectedApiaryId, lat, lon, notes, onSuccess) },
                enabled  = name.isNotBlank() && selectedApiaryId.isNotEmpty() && !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Text(stringResource(R.string.action_save))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExposedDropdownMenuForList(label: String, options: List<String>, selectedIndex: Int, onSelect: (Int) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }) {
        OutlinedTextField(
            value = options.getOrElse(selectedIndex) { "" },
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEachIndexed { idx, opt ->
                DropdownMenuItem(text = { Text(opt) }, onClick = { onSelect(idx); expanded = false })
            }
        }
    }
}
