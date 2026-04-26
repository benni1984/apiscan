package com.apiscan.app.ui.stats

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.apiscan.app.data.api.HiveStats
import com.apiscan.app.data.api.TrendPoint
import com.apiscan.app.data.repository.StatsRepository
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.common.LoadingScreen
import com.apiscan.app.ui.common.SimpleLineChart
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HiveStatsState(
    val stats: HiveStats? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class HiveStatsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: StatsRepository
) : ViewModel() {

    val hiveId = savedState.get<String>("hiveId")!!
    private val _state = MutableStateFlow(HiveStatsState())
    val state = _state.asStateFlow()

    fun load(preset: String? = "30d", from: String? = null, to: String? = null) =
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            runCatching { repo.hiveStats(hiveId, preset, from, to) }
                .onSuccess { s -> _state.update { it.copy(isLoading = false, stats = s) } }
                .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
        }

    fun clearError() = _state.update { it.copy(error = null) }

    init { load() }
}

private val PRESETS = listOf("30d", "90d", "365d", "all")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HiveStatsScreen(
    hiveId: String,
    onBack: () -> Unit,
    vm: HiveStatsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var selectedPreset by remember { mutableStateOf(0) }
    var customMode  by remember { mutableStateOf(false) }
    var fromDate    by remember { mutableStateOf("") }
    var toDate      by remember { mutableStateOf("") }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_hive_stats)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        Column(Modifier.padding(padding).verticalScroll(rememberScrollState())) {
            // Preset selector
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
                PRESETS.forEachIndexed { idx, preset ->
                    SegmentedButton(
                        selected = !customMode && selectedPreset == idx,
                        onClick  = { customMode = false; selectedPreset = idx; vm.load(preset) },
                        shape    = SegmentedButtonDefaults.itemShape(idx, PRESETS.size)
                    ) { Text(preset) }
                }
            }

            // Custom date range toggle
            Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                Checkbox(checked = customMode, onCheckedChange = { customMode = it })
                Text(stringResource(R.string.label_custom_range))
            }

            if (customMode) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = fromDate, onValueChange = { fromDate = it },
                        label = { Text(stringResource(R.string.field_date_from)) },
                        placeholder = { Text("yyyy-MM-dd") },
                        singleLine = true, modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = toDate, onValueChange = { toDate = it },
                        label = { Text(stringResource(R.string.field_date_to)) },
                        placeholder = { Text("yyyy-MM-dd") },
                        singleLine = true, modifier = Modifier.weight(1f)
                    )
                }
                Button(
                    onClick = { vm.load(null, fromDate.ifBlank { null }, toDate.ifBlank { null }) },
                    enabled = fromDate.isNotBlank() && toDate.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                ) { Text(stringResource(R.string.action_apply)) }
            }

            when {
                state.isLoading -> LoadingScreen()
                else -> {
                    state.error?.let { ErrorBanner(it) { vm.clearError() } }
                    state.stats?.let { s -> StatsContent(s) }
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun StatsContent(s: HiveStats) {
    val primary = MaterialTheme.colorScheme.primary

    // Summary card
    Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            StatRow(stringResource(R.string.stat_inspection_count), "${s.inspectionCount}")
            s.daysSinceLastInspection?.let { StatRow(stringResource(R.string.stat_days_since), "$it") }
            s.queenSeenRate?.let { StatRow(stringResource(R.string.stat_queen_seen_rate), "%.0f%%".format(it * 100)) }
            StatRow(stringResource(R.string.stat_swarm_cells), "${s.swarmCellsCount}")
        }
    }

    // Mood distribution
    if (s.moodDistribution.isNotEmpty()) {
        SectionTitle(stringResource(R.string.stat_mood_distribution))
        Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                s.moodDistribution.forEach { (mood, cnt) ->
                    StatRow(mood.replaceFirstChar { it.uppercase() }, "$cnt")
                }
            }
        }
    }

    // Varroa trend
    if (s.varroaTrend.isNotEmpty()) {
        SectionTitle(stringResource(R.string.stat_varroa_trend))
        Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            SimpleLineChart(
                points    = s.varroaTrend.toChartPoints(),
                lineColor = MaterialTheme.colorScheme.error,
                modifier  = Modifier.fillMaxWidth().height(140.dp).padding(16.dp)
            )
        }
    }

    // Brood frames trend
    if (s.broodFramesTrend.isNotEmpty()) {
        SectionTitle(stringResource(R.string.stat_brood_trend))
        Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            SimpleLineChart(
                points    = s.broodFramesTrend.toChartPoints(),
                lineColor = primary,
                modifier  = Modifier.fillMaxWidth().height(140.dp).padding(16.dp)
            )
        }
    }

    // Honey frames trend
    if (s.honeyFramesTrend.isNotEmpty()) {
        SectionTitle(stringResource(R.string.stat_honey_trend))
        Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            SimpleLineChart(
                points    = s.honeyFramesTrend.toChartPoints(),
                lineColor = MaterialTheme.colorScheme.tertiary,
                modifier  = Modifier.fillMaxWidth().height(140.dp).padding(16.dp)
            )
        }
    }

    // Weight trend
    if (s.weightTrend.isNotEmpty()) {
        SectionTitle(stringResource(R.string.stat_weight_trend))
        Card(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            SimpleLineChart(
                points    = s.weightTrend.toChartPoints(),
                lineColor = MaterialTheme.colorScheme.secondary,
                modifier  = Modifier.fillMaxWidth().height(140.dp).padding(16.dp)
            )
        }
    }
}

private fun List<TrendPoint>.toChartPoints(): List<Pair<String, Float>> =
    mapNotNull { pt ->
        val v = when (val raw = pt.value) {
            is Number -> raw.toFloat()
            is String -> raw.toFloatOrNull()
            else      -> null
        }
        v?.let { pt.date to it }
    }

@Composable
private fun SectionTitle(text: String) {
    Text(
        text,
        style    = MaterialTheme.typography.titleSmall,
        color    = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 4.dp)
    )
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}
