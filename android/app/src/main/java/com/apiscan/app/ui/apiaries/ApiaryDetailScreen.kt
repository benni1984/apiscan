package com.apiscan.app.ui.apiaries

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.R
import com.apiscan.app.data.api.HiveOut
import com.apiscan.app.data.repository.ApiaryRepository
import com.apiscan.app.data.repository.HiveRepository
import com.apiscan.app.ui.common.ErrorBanner
import com.apiscan.app.ui.common.LoadingScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ApiaryDetailState(
    val apiaryName: String = "",
    val hives: List<HiveOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ApiaryDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val apiaryRepo: ApiaryRepository,
    private val hiveRepo: HiveRepository
) : ViewModel() {
    private val apiaryId = savedState.get<String>("apiaryId")!!
    private val _state = MutableStateFlow(ApiaryDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching {
            val apiary = apiaryRepo.get(apiaryId)
            val hives  = hiveRepo.listForApiary(apiaryId)
            _state.update { it.copy(isLoading = false, apiaryName = apiary.name, hives = hives) }
        }.onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun deleteHive(id: String) = viewModelScope.launch {
        runCatching { hiveRepo.delete(id) }
            .onSuccess { _state.update { it.copy(hives = it.hives.filter { h -> h.id != id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApiaryDetailScreen(
    apiaryId: String,
    onHiveClick: (String) -> Unit,
    onBack: () -> Unit,
    vm: ApiaryDetailViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(state.apiaryName) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        when {
            state.isLoading -> LoadingScreen()
            else -> LazyColumn(Modifier.padding(padding)) {
                state.error?.let { item { ErrorBanner(it) { vm.clearError() } } }
                if (state.hives.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text(stringResource(R.string.empty_hives_title))
                        }
                    }
                } else {
                    items(state.hives) { hive ->
                        HiveListItem(hive, onClick = { onHiveClick(hive.id) }, onDelete = { vm.deleteHive(hive.id) })
                        HorizontalDivider()
                    }
                }
            }
        }
    }
}

@Composable
fun HiveListItem(hive: HiveOut, onClick: () -> Unit, onDelete: (() -> Unit)? = null) {
    ListItem(
        headlineContent  = { Text(hive.name) },
        supportingContent = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = {}, label = { Text(hive.hiveType.replace("_", " ").replaceFirstChar { it.uppercase() }) })
                hive.lastInspectionAt?.let {
                    Text(stringResource(R.string.label_last_inspection, it.take(10)), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                } ?: Text(stringResource(R.string.label_never_inspected), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
            }
        },
        trailingContent = onDelete?.let { { IconButton(onClick = it) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) } } },
        modifier = Modifier.clickable(onClick = onClick)
    )
}
