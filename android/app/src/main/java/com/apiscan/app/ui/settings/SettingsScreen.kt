package com.apiscan.app.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.apiscan.app.R
import com.apiscan.app.data.api.UserOut
import com.apiscan.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsState(
    val user: UserOut? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val error: String? = null,
    val loggedOut: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(private val repo: AuthRepository) : ViewModel() {

    private val _state = MutableStateFlow(SettingsState())
    val state = _state.asStateFlow()

    init { load() }

    private fun load() = viewModelScope.launch {
        _state.update { it.copy(isLoading = true) }
        runCatching { repo.getMe() }
            .onSuccess { u -> _state.update { it.copy(isLoading = false, user = u) } }
            .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
    }

    fun updateName(name: String) = viewModelScope.launch {
        _state.update { it.copy(isSaving = true) }
        runCatching { repo.updateMe(name, null) }
            .onSuccess { u -> _state.update { it.copy(isSaving = false, user = u) } }
            .onFailure { e -> _state.update { it.copy(isSaving = false, error = e.message) } }
    }

    fun updateLocale(locale: String) = viewModelScope.launch {
        runCatching { repo.updateMe(null, locale) }
            .onSuccess { u -> _state.update { it.copy(user = u) } }
            .onFailure { e -> _state.update { it.copy(error = e.message) } }
    }

    fun logout() = viewModelScope.launch {
        runCatching { repo.logout() }
        _state.update { it.copy(loggedOut = true) }
    }

    fun clearError() = _state.update { it.copy(error = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onBack: () -> Unit,
    vm: SettingsViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    LaunchedEffect(state.loggedOut) { if (state.loggedOut) onLogout() }

    var editName     by remember { mutableStateOf("") }
    var editingName  by remember { mutableStateOf(false) }
    var showLogout   by remember { mutableStateOf(false) }

    LaunchedEffect(state.user) {
        state.user?.let { if (editName.isEmpty()) editName = it.name }
    }

    val locales = listOf("en", "fr", "de")
    val localeLabels = listOf("English", "Français", "Deutsch")

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_settings)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } },
            actions = {
                IconButton(onClick = { showLogout = true }) {
                    Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = stringResource(R.string.action_logout))
                }
            }
        )
    }) { padding ->
        when {
            state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
            else -> Column(
                Modifier.padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                state.error?.let {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                        Text(it, Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
                    }
                }

                state.user?.let { user ->
                    // Account info
                    Text(stringResource(R.string.section_account), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    OutlinedTextField(
                        value = user.email,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text(stringResource(R.string.field_email)) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Display name
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        OutlinedTextField(
                            value = editName,
                            onValueChange = { editName = it; editingName = true },
                            label = { Text(stringResource(R.string.field_display_name)) },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                        if (editingName) {
                            Spacer(Modifier.width(8.dp))
                            Button(
                                onClick  = { vm.updateName(editName); editingName = false },
                                enabled  = !state.isSaving && editName.isNotBlank()
                            ) {
                                if (state.isSaving) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp)
                                else Text(stringResource(R.string.action_save))
                            }
                        }
                    }

                    // Locale
                    Text(stringResource(R.string.section_language), style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary)
                    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                        locales.forEachIndexed { idx, locale ->
                            SegmentedButton(
                                selected = user.locale == locale,
                                onClick  = { vm.updateLocale(locale) },
                                shape    = SegmentedButtonDefaults.itemShape(idx, locales.size)
                            ) { Text(localeLabels[idx]) }
                        }
                    }
                }

                Spacer(Modifier.weight(1f))

                OutlinedButton(
                    onClick  = { showLogout = true },
                    modifier = Modifier.fillMaxWidth(),
                    colors   = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Icon(Icons.AutoMirrored.Filled.Logout, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text(stringResource(R.string.action_logout))
                }
            }
        }
    }

    if (showLogout) {
        AlertDialog(
            onDismissRequest = { showLogout = false },
            title   = { Text(stringResource(R.string.action_logout)) },
            text    = { Text(stringResource(R.string.alert_logout_confirm)) },
            confirmButton = {
                TextButton(onClick = { vm.logout(); showLogout = false },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)) {
                    Text(stringResource(R.string.action_logout))
                }
            },
            dismissButton = { TextButton(onClick = { showLogout = false }) { Text(stringResource(R.string.action_cancel)) } }
        )
    }
}
