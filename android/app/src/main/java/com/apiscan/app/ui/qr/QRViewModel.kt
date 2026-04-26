package com.apiscan.app.ui.qr

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.data.api.QrBatchOut
import com.apiscan.app.data.api.QrBatchSummary
import com.apiscan.app.data.api.QRScanResult
import com.apiscan.app.data.repository.HiveRepository
import com.apiscan.app.data.repository.QrBatchRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// ── QR Scan ──────────────────────────────────────────────────────────────────

data class QRScanState(val isLoading: Boolean = false, val error: String? = null)

@HiltViewModel
class QRScanViewModel @Inject constructor(private val hiveRepo: HiveRepository) : ViewModel() {

    private val _state = MutableStateFlow(QRScanState())
    val state = _state.asStateFlow()

    fun resolve(token: String, onLinked: (String) -> Unit, onUnlinked: (String) -> Unit) =
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            runCatching { hiveRepo.resolveQR(token) }
                .onSuccess { result ->
                    _state.update { it.copy(isLoading = false) }
                    when (result) {
                        is QRScanResult.Linked   -> onLinked(result.hive.id)
                        is QRScanResult.Unlinked -> onUnlinked(result.token)
                    }
                }
                .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
        }

    fun clearError() = _state.update { it.copy(error = null) }
}

// ── QR Batch List ─────────────────────────────────────────────────────────────

data class QRBatchListState(
    val batches: List<QrBatchSummary> = emptyList(),
    val isLoading: Boolean = false,
    val isCreating: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class QRBatchListViewModel @Inject constructor(private val repo: QrBatchRepository) : ViewModel() {

    private val _state = MutableStateFlow(QRBatchListState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.list() }
            .onSuccess { list -> _state.update { it.copy(isLoading = false, batches = list) } }
            .onFailure { e  -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun create(count: Int) = viewModelScope.launch {
        _state.update { it.copy(isCreating = true, error = null) }
        runCatching { repo.create(count) }
            .onSuccess { batch ->
                _state.update { it.copy(isCreating = false, batches = listOf(
                    QrBatchSummary(batch.id, batch.count, batch.createdAt, 0)
                ) + it.batches) }
            }
            .onFailure { e -> _state.update { it.copy(isCreating = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

// ── QR Batch Detail ───────────────────────────────────────────────────────────

data class QRBatchDetailState(
    val batch: QrBatchOut? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class QRBatchDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val repo: QrBatchRepository
) : ViewModel() {

    val batchId = savedState.get<String>("batchId")!!
    private val _state = MutableStateFlow(QRBatchDetailState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.get(batchId) }
            .onSuccess { b -> _state.update { it.copy(isLoading = false, batch = b) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
