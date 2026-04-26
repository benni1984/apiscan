package com.apiscan.app.ui.apiaries

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.data.api.ApiaryOut
import com.apiscan.app.data.repository.ApiaryRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ApiaryListState(
    val apiaries: List<ApiaryOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ApiaryViewModel @Inject constructor(private val repo: ApiaryRepository) : ViewModel() {

    private val _state = MutableStateFlow(ApiaryListState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.list() }
            .onSuccess { list -> _state.update { it.copy(isLoading = false, apiaries = list) } }
            .onFailure { e  -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun create(name: String, description: String?, lat: Double?, lon: Double?, address: String?, onDone: (String) -> Unit) =
        viewModelScope.launch {
            runCatching { repo.create(name, description, lat, lon, address) }
                .onSuccess { a -> _state.update { it.copy(apiaries = it.apiaries + a) }; onDone(a.id) }
                .onFailure { e -> _state.update { it.copy(error = e.message) } }
        }

    fun update(id: String, name: String, description: String?, lat: Double?, lon: Double?, address: String?, onDone: () -> Unit) =
        viewModelScope.launch {
            runCatching { repo.update(id, name, description, lat, lon, address) }
                .onSuccess { updated ->
                    _state.update { it.copy(apiaries = it.apiaries.map { a -> if (a.id == id) updated else a }) }
                    onDone()
                }
                .onFailure { e -> _state.update { it.copy(error = e.message) } }
        }

    fun delete(id: String) = viewModelScope.launch {
        runCatching { repo.delete(id) }
            .onSuccess { _state.update { it.copy(apiaries = it.apiaries.filter { a -> a.id != id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
