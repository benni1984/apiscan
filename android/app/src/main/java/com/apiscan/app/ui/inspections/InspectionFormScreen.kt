package com.apiscan.app.ui.inspections

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.R
import com.apiscan.app.data.api.InspectionCreateRequest
import com.apiscan.app.data.api.InspectionOut
import com.apiscan.app.data.repository.InspectionRepository
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.hives.ExposedDropdownMenuForList
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class InspectionFormState(val existing: InspectionOut? = null, val isLoading: Boolean = false, val error: String? = null, val saved: Boolean = false)

@HiltViewModel
class InspectionFormViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: InspectionRepository
) : ViewModel() {
    val hiveId       = savedState.get<String>("hiveId")!!
    val inspectionId = savedState.get<String>("inspectionId")?.ifEmpty { null }
    private val _state = MutableStateFlow(InspectionFormState())
    val state = _state.asStateFlow()

    init {
        inspectionId?.let { id ->
            // We receive the inspection via navigation arg if needed — for now just save mode
        }
    }

    fun save(request: InspectionCreateRequest) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            if (inspectionId == null) repo.create(hiveId, request)
            else repo.update(inspectionId, request)
        }
        .onSuccess { _state.update { it.copy(isLoading = false, saved = true) } }
        .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionFormScreen(
    hiveId: String,
    inspectionId: String?,
    onSaved: () -> Unit,
    onBack: () -> Unit,
    vm: InspectionFormViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    LaunchedEffect(state.saved) { if (state.saved) onSaved() }

    val df = remember { SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()) }
    var date              by remember { mutableStateOf(df.format(Date())) }
    var queenSeen         by remember { mutableStateOf<Boolean?>(null) }
    var queenColor        by remember { mutableStateOf("") }
    var broodFrames       by remember { mutableStateOf("") }
    var honeyFrames       by remember { mutableStateOf("") }
    var mood              by remember { mutableStateOf("") }
    var populationStr     by remember { mutableStateOf("") }
    var varroaCount       by remember { mutableStateOf("") }
    var swarmCellsSeen    by remember { mutableStateOf<Boolean?>(null) }
    var treatment         by remember { mutableStateOf("") }
    var feedingDone       by remember { mutableStateOf<Boolean?>(null) }
    var feedingType       by remember { mutableStateOf("") }
    var weightKg          by remember { mutableStateOf("") }
    var notes             by remember { mutableStateOf("") }

    val moods       = listOf("", "calm", "nervous", "aggressive")
    val queenColors = listOf("", "white", "yellow", "red", "green", "blue")

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(if (inspectionId == null) stringResource(R.string.action_new_inspection) else stringResource(R.string.action_edit_inspection)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            actions = {
                TextButton(
                    onClick  = {
                        vm.save(InspectionCreateRequest(
                            date               = date,
                            queenSeen          = queenSeen,
                            queenColor         = queenColor.ifBlank { null },
                            broodFrames        = broodFrames.toIntOrNull(),
                            honeyFrames        = honeyFrames.toIntOrNull(),
                            mood               = mood.ifBlank { null },
                            populationStrength = populationStr.toIntOrNull(),
                            varroaCount        = varroaCount.toIntOrNull(),
                            swarmCellsSeen     = swarmCellsSeen,
                            treatmentApplied   = treatment.ifBlank { null },
                            feedingDone        = feedingDone,
                            feedingType        = feedingType.ifBlank { null },
                            weightKg           = weightKg.toDoubleOrNull(),
                            notes              = notes.ifBlank { null }
                        ))
                    },
                    enabled = !state.isLoading
                ) { Text(stringResource(R.string.action_save)) }
            }
        )
    }) { padding ->
        Column(
            Modifier.padding(padding).padding(horizontal = 16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            state.error?.let { ErrorBanner(it) { vm.clearError() } }

            SectionLabel(stringResource(R.string.section_date))
            OutlinedTextField(value = date, onValueChange = { date = it },
                label = { Text(stringResource(R.string.field_date)) },
                placeholder = { Text("yyyy-MM-dd") },
                singleLine = true, modifier = Modifier.fillMaxWidth())

            SectionLabel(stringResource(R.string.section_queen))
            OptionalBooleanRow(stringResource(R.string.field_queen_seen), queenSeen) { queenSeen = it }
            ExposedDropdownMenuForList(
                label = stringResource(R.string.field_queen_color),
                options = queenColors.map { it.replaceFirstChar { c -> c.uppercase() }.ifBlank { stringResource(R.string.label_not_recorded) } },
                selectedIndex = queenColors.indexOf(queenColor).coerceAtLeast(0),
                onSelect = { queenColor = queenColors[it] }
            )

            SectionLabel(stringResource(R.string.section_frames))
            IntField(stringResource(R.string.field_brood_frames), broodFrames) { broodFrames = it }
            IntField(stringResource(R.string.field_honey_frames), honeyFrames) { honeyFrames = it }

            SectionLabel(stringResource(R.string.section_colony))
            ExposedDropdownMenuForList(
                label = stringResource(R.string.field_mood),
                options = moods.map { it.replaceFirstChar { c -> c.uppercase() }.ifBlank { stringResource(R.string.label_not_recorded) } },
                selectedIndex = moods.indexOf(mood).coerceAtLeast(0),
                onSelect = { mood = moods[it] }
            )
            IntField(stringResource(R.string.field_population_strength), populationStr) { populationStr = it }
            OptionalBooleanRow(stringResource(R.string.field_swarm_cells_seen), swarmCellsSeen) { swarmCellsSeen = it }

            SectionLabel(stringResource(R.string.section_varroa))
            IntField(stringResource(R.string.field_varroa_count), varroaCount) { varroaCount = it }

            SectionLabel(stringResource(R.string.section_treatment))
            OutlinedTextField(value = treatment, onValueChange = { treatment = it },
                label = { Text(stringResource(R.string.field_treatment_applied)) },
                singleLine = true, modifier = Modifier.fillMaxWidth())
            OptionalBooleanRow(stringResource(R.string.field_feeding_done), feedingDone) { feedingDone = it }
            if (feedingDone == true) {
                OutlinedTextField(value = feedingType, onValueChange = { feedingType = it },
                    label = { Text(stringResource(R.string.field_feeding_type)) },
                    singleLine = true, modifier = Modifier.fillMaxWidth())
            }

            SectionLabel(stringResource(R.string.section_weight))
            OutlinedTextField(value = weightKg, onValueChange = { weightKg = it },
                label = { Text(stringResource(R.string.field_weight_kg)) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true, modifier = Modifier.fillMaxWidth())

            SectionLabel(stringResource(R.string.section_notes))
            OutlinedTextField(value = notes, onValueChange = { notes = it },
                label = { Text(stringResource(R.string.field_notes)) },
                minLines = 3, modifier = Modifier.fillMaxWidth())

            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(text, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(top = 4.dp))
}

@Composable
private fun IntField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onChange,
        label = { Text(label) },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        singleLine = true, modifier = Modifier.fillMaxWidth())
}

@Composable
private fun OptionalBooleanRow(label: String, value: Boolean?, onChange: (Boolean?) -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, Modifier.weight(1f))
        listOf(null to "—", true to "✓", false to "✗").forEach { (v, lbl) ->
            FilterChip(selected = value == v, onClick = { onChange(v) }, label = { Text(lbl) }, modifier = Modifier.padding(horizontal = 4.dp))
        }
    }
}
