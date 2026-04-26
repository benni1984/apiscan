package com.apiscan.app.ui.apiaries

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.apiscan.app.R

@Composable
fun ApiaryFormDialog(
    initial: com.apiscan.app.data.api.ApiaryOut? = null,
    onConfirm: (String, String?, Double?, Double?, String?) -> Unit,
    onDismiss: () -> Unit
) {
    var name        by remember { mutableStateOf(initial?.name ?: "") }
    var description by remember { mutableStateOf(initial?.description ?: "") }
    var address     by remember { mutableStateOf(initial?.address ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) stringResource(R.string.action_new_apiary) else stringResource(R.string.action_edit_apiary)) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = name, onValueChange = { name = it },
                    label = { Text(stringResource(R.string.field_name)) },
                    singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = description, onValueChange = { description = it },
                    label = { Text(stringResource(R.string.field_description)) },
                    modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = address, onValueChange = { address = it },
                    label = { Text(stringResource(R.string.field_address)) },
                    singleLine = true, modifier = Modifier.fillMaxWidth())
            }
        },
        confirmButton = {
            TextButton(
                onClick  = { onConfirm(name, description.ifBlank { null }, null, null, address.ifBlank { null }) },
                enabled  = name.isNotBlank()
            ) { Text(stringResource(R.string.action_save)) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(stringResource(R.string.action_cancel)) } }
    )
}
