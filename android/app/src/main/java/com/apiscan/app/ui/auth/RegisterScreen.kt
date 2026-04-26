package com.apiscan.app.ui.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.*
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.apiscan.app.R
import com.apiscan.app.ui.common.ErrorBanner

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onSuccess: () -> Unit,
    onBack: () -> Unit,
    vm: AuthViewModel = hiltViewModel()
) {
    val state by vm.state.collectAsState()
    var name     by remember { mutableStateOf("") }
    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var locale   by remember { mutableStateOf("en") }
    val locales  = listOf("en" to "English", "fr" to "Français", "de" to "Deutsch")

    LaunchedEffect(state.success) { if (state.success) onSuccess() }

    Scaffold(topBar = {
        TopAppBar(
            title = { Text(stringResource(R.string.screen_register)) },
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, null) } }
        )
    }) { padding ->
        Column(
            Modifier.padding(padding).padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it },
                label = { Text(stringResource(R.string.field_name)) },
                singleLine = true, modifier = Modifier.fillMaxWidth())

            OutlinedTextField(value = email, onValueChange = { email = it },
                label = { Text(stringResource(R.string.field_email)) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                singleLine = true, modifier = Modifier.fillMaxWidth())

            OutlinedTextField(value = password, onValueChange = { password = it },
                label = { Text(stringResource(R.string.field_password)) },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true, modifier = Modifier.fillMaxWidth())

            Text(stringResource(R.string.field_language), style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                locales.forEach { (code, label) ->
                    FilterChip(
                        selected = locale == code,
                        onClick  = { locale = code },
                        label    = { Text(label) }
                    )
                }
            }

            state.error?.let { ErrorBanner(it) { vm.clearError() } }

            Button(
                onClick  = { vm.register(email, password, name, locale) },
                enabled  = name.isNotBlank() && email.isNotBlank() && password.length >= 8 && !state.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                if (state.isLoading) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                else Text(stringResource(R.string.action_create_account))
            }
        }
    }
}
