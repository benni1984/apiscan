package com.apiscan.app.ui.inspections

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.R
import com.apiscan.app.data.api.InspectionOut
import com.apiscan.app.data.repository.InspectionRepository
import com.apiscan.app.ui.common.InfoRow
import com.apiscan.app.ui.common.LoadingScreen
import com.apiscan.app.ui.common.SectionHeader
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InspectionDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: InspectionRepository
) : ViewModel() {
    val inspectionId = savedState.get<String>("inspectionId")!!
    val hiveId       = savedState.get<String>("hiveId")!!
    private val _insp = MutableStateFlow<InspectionOut?>(null)
    val inspection = _insp.asStateFlow()
    var isLoading by mutableStateOf(false)

    init { viewModelScope.launch { isLoading = true; _insp.value = runCatching { repo.list(hiveId).items.firstOrNull { it.id == inspectionId } }.getOrNull(); isLoading = false } }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InspectionDetailScreen(
    inspectionId: String,
    hiveId: String,
    onEdit: (String, String) -> Unit,
    onBack: () -> Unit,
    vm: InspectionDetailViewModel = hiltViewModel()
) {
    val insp by vm.inspection.collectAsState()

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(insp?.date ?: "") },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            actions = { IconButton(onClick = { onEdit(inspectionId, hiveId) }) { Icon(Icons.Default.Edit, null) } }
        )
    }) { padding ->
        if (vm.isLoading || insp == null) { LoadingScreen(); return@Scaffold }
        val i = insp!!
        LazyColumn(Modifier.padding(padding)) {
            item { SectionHeader(stringResource(R.string.section_queen)) }
            item {
                Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        i.queenSeen?.let      { InfoRow(stringResource(R.string.field_queen_seen), if (it) "✓" else "✗") }
                        i.queenColor?.let     { InfoRow(stringResource(R.string.field_queen_color), it.replaceFirstChar { c -> c.uppercase() }) }
                    }
                }
            }
            item { SectionHeader(stringResource(R.string.section_frames)) }
            item {
                Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        i.broodFrames?.let { InfoRow(stringResource(R.string.field_brood_frames), "$it") }
                        i.honeyFrames?.let { InfoRow(stringResource(R.string.field_honey_frames), "$it") }
                    }
                }
            }
            item { SectionHeader(stringResource(R.string.section_colony)) }
            item {
                Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                    Column(Modifier.padding(16.dp)) {
                        i.mood?.let               { InfoRow(stringResource(R.string.field_mood), it.replaceFirstChar { c -> c.uppercase() }) }
                        i.populationStrength?.let { InfoRow(stringResource(R.string.field_population_strength), "$it/5") }
                        i.swarmCellsSeen?.let     { InfoRow(stringResource(R.string.field_swarm_cells_seen), if (it) "✓" else "✗") }
                        i.varroaCount?.let        { InfoRow(stringResource(R.string.field_varroa_count), "$it") }
                    }
                }
            }
            if (i.treatmentApplied != null || i.feedingDone != null || i.weightKg != null) {
                item { SectionHeader(stringResource(R.string.section_treatment)) }
                item {
                    Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        Column(Modifier.padding(16.dp)) {
                            i.treatmentApplied?.let { InfoRow(stringResource(R.string.field_treatment_applied), it) }
                            i.feedingDone?.let       { InfoRow(stringResource(R.string.field_feeding_done), if (it) "✓" else "✗") }
                            i.feedingType?.let       { InfoRow(stringResource(R.string.field_feeding_type), it) }
                            i.weightKg?.let          { InfoRow(stringResource(R.string.field_weight_kg), "%.1f kg".format(it)) }
                        }
                    }
                }
            }
            i.notes?.takeIf { it.isNotBlank() }?.let { notes ->
                item { SectionHeader(stringResource(R.string.field_notes)) }
                item { Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) { Text(notes, Modifier.padding(16.dp)) } }
            }
            if (i.customFields.isNotEmpty()) {
                item { SectionHeader(stringResource(R.string.section_custom_fields)) }
                item {
                    Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                        Column(Modifier.padding(16.dp)) {
                            i.customFields.forEach { (k, v) -> InfoRow(k, v?.toString() ?: "—") }
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}
