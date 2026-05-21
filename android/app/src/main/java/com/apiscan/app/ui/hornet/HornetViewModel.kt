package com.apiscan.app.ui.hornet

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.data.api.HornetNestGeoJSON
import com.apiscan.app.data.api.HornetSightingOut
import com.apiscan.app.data.api.HornetStats
import com.apiscan.app.data.repository.HornetRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HornetState(
    val stats: HornetStats? = null,
    val nests: HornetNestGeoJSON? = null,
    val sightings: List<HornetSightingOut> = emptyList(),
    val sightingsPage: Int = 1,
    val sightingsPages: Int = 1,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class HornetViewModel @Inject constructor(private val repo: HornetRepository) : ViewModel() {

    private val _state = MutableStateFlow(HornetState())
    val state = _state.asStateFlow()

    // MARK: - Load

    fun loadStats() = viewModelScope.launch {
        runCatching { repo.getStats() }
            .onSuccess { s -> _state.update { it.copy(stats = s) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun loadNests() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.getNests() }
            .onSuccess { n -> _state.update { it.copy(isLoading = false, nests = n) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun loadSightings(page: Int = 1) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.getSightings(page) }
            .onSuccess { result ->
                val updated = if (page == 1) result.items else _state.value.sightings + result.items
                _state.update {
                    it.copy(
                        isLoading = false,
                        sightings = updated,
                        sightingsPage = result.page,
                        sightingsPages = result.pages
                    )
                }
            }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    // MARK: - Submit

    fun submitCatch(
        count: Int,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitCatch(count, latitude, longitude, reporterName) }
            .onSuccess { _state.update { it.copy(isLoading = false) }; onSuccess() }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun submitNest(
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        photoUrl: String? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitNest(latitude, longitude, notes, photoUrl, reporterName) }
            .onSuccess { _state.update { it.copy(isLoading = false) }; onSuccess() }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun submitSighting(
        photoUrl: String,
        description: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null,
        onSuccess: () -> Unit = {}
    ) = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.submitSighting(photoUrl, description, latitude, longitude, reporterName) }
            .onSuccess { sighting ->
                _state.update { it.copy(isLoading = false, sightings = listOf(sighting) + it.sightings) }
                onSuccess()
            }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun vote(sightingId: String, vote: String) = viewModelScope.launch {
        runCatching { repo.vote(sightingId, vote) }
            .onSuccess { loadSightings(1) }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
