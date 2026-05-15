package com.apiscan.app.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.data.api.*
import com.apiscan.app.data.repository.AdminRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

// MARK: - Stats

data class AdminStatsState(
    val stats: PlatformStats? = null,
    val tokenStats: AdminTokenStats? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val preset: String = "30d"
)

@HiltViewModel
class AdminStatsViewModel @Inject constructor(
    private val repo: AdminRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AdminStatsState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            val s = repo.getStats(state.value.preset)
            val t = repo.getTokenStats()
            Pair(s, t)
        }.onSuccess { (s, t) ->
            _state.update { it.copy(isLoading = false, stats = s, tokenStats = t) }
        }.onFailure { e ->
            _state.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    fun setPreset(preset: String) {
        _state.update { it.copy(preset = preset) }
        load()
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

// MARK: - Users

data class AdminUsersState(
    val users: List<AdminUserOut> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val search: String = "",
    val filterSupporter: Boolean? = null,
    val page: Int = 1,
    val pages: Int = 1
)

@HiltViewModel
class AdminUsersViewModel @Inject constructor(
    private val repo: AdminRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AdminUsersState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            repo.getUsers(state.value.page, state.value.search, state.value.filterSupporter)
        }.onSuccess { resp ->
            _state.update { it.copy(isLoading = false, users = resp.items, pages = resp.pages) }
        }.onFailure { e ->
            _state.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    fun search(query: String) {
        _state.update { it.copy(search = query, page = 1) }
        load()
    }

    fun prevPage() {
        if (state.value.page <= 1) return
        _state.update { it.copy(page = it.page - 1) }
        load()
    }

    fun nextPage() {
        if (state.value.page >= state.value.pages) return
        _state.update { it.copy(page = it.page + 1) }
        load()
    }

    fun toggleSupporter(user: AdminUserOut) = viewModelScope.launch {
        runCatching { repo.setSupporter(user.id, !user.isSupporter) }
            .onSuccess { updated ->
                _state.update { s -> s.copy(users = s.users.map { if (it.id == updated.id) updated else it }) }
            }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun revokeTokens(userId: String) = viewModelScope.launch {
        runCatching { repo.revokeTokens(userId) }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun deleteUser(userId: String) = viewModelScope.launch {
        runCatching { repo.deleteUser(userId) }
            .onSuccess { _state.update { it.copy(users = it.users.filter { u -> u.id != userId }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

// MARK: - Map

data class AdminMapState(
    val apiaries: List<AdminApiary> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val showFlagged: Boolean = false,
    val page: Int = 1,
    val pages: Int = 1
)

@HiltViewModel
class AdminMapViewModel @Inject constructor(
    private val repo: AdminRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AdminMapState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching {
            if (state.value.showFlagged) repo.getFlaggedApiaries(state.value.page)
            else repo.getApiaries(state.value.page)
        }.onSuccess { resp ->
            _state.update { it.copy(isLoading = false, apiaries = resp.items, pages = resp.pages) }
        }.onFailure { e ->
            _state.update { it.copy(isLoading = false, error = e.message) }
        }
    }

    fun toggleFlagged(flagged: Boolean) {
        _state.update { it.copy(showFlagged = flagged, page = 1) }
        load()
    }

    fun prevPage() {
        if (state.value.page <= 1) return
        _state.update { it.copy(page = it.page - 1) }
        load()
    }

    fun nextPage() {
        if (state.value.page >= state.value.pages) return
        _state.update { it.copy(page = it.page + 1) }
        load()
    }

    fun setPrivate(apiary: AdminApiary) = viewModelScope.launch {
        runCatching { repo.setPrivate(apiary.id) }
            .onSuccess { _state.update { it.copy(apiaries = it.apiaries.filter { a -> a.id != apiary.id }) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

// MARK: - Health

enum class HealthDetail { INACTIVE, NO_VARROA, ZERO_HIVES }

data class AdminHealthState(
    val summary: HealthSummary? = null,
    val inactiveUsers: List<InactiveUser> = emptyList(),
    val noVarroaApiaries: List<NoVarroaApiary> = emptyList(),
    val zeroInspectionHives: List<ZeroInspectionHive> = emptyList(),
    val isLoading: Boolean = false,
    val isDrillLoading: Boolean = false,
    val error: String? = null,
    val activeDetail: HealthDetail? = null,
    val inactivePage: Int = 1,
    val inactivePages: Int = 1
)

@HiltViewModel
class AdminHealthViewModel @Inject constructor(
    private val repo: AdminRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AdminHealthState())
    val state = _state.asStateFlow()

    init { load() }

    fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true, error = null) }
        runCatching { repo.getHealthSummary() }
            .onSuccess { s -> _state.update { it.copy(isLoading = false, summary = s) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun toggleDetail(detail: HealthDetail) = viewModelScope.launch {
        if (state.value.activeDetail == detail) {
            _state.update { it.copy(activeDetail = null) }
            return@launch
        }
        _state.update { it.copy(activeDetail = detail, isDrillLoading = true) }
        runCatching {
            when (detail) {
                HealthDetail.INACTIVE -> {
                    val resp = repo.getInactiveUsers(1)
                    _state.update { it.copy(inactiveUsers = resp.items, inactivePage = 1, inactivePages = resp.pages) }
                }
                HealthDetail.NO_VARROA -> {
                    val list = repo.getNoVarroaApiaries()
                    _state.update { it.copy(noVarroaApiaries = list) }
                }
                HealthDetail.ZERO_HIVES -> {
                    val resp = repo.getZeroInspectionHives(1)
                    _state.update { it.copy(zeroInspectionHives = resp.items) }
                }
            }
        }.onFailure { e -> _state.update { it.copy(error = e.message) } }
        _state.update { it.copy(isDrillLoading = false) }
    }

    fun loadMoreInactive() = viewModelScope.launch {
        val s = state.value
        if (s.inactivePage >= s.inactivePages) return@launch
        _state.update { it.copy(isDrillLoading = true) }
        runCatching { repo.getInactiveUsers(s.inactivePage + 1) }
            .onSuccess { resp ->
                _state.update {
                    it.copy(
                        inactiveUsers = it.inactiveUsers + resp.items,
                        inactivePage = resp.page,
                        inactivePages = resp.pages
                    )
                }
            }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
        _state.update { it.copy(isDrillLoading = false) }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}
