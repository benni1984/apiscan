package com.hornets.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary          = Color(0xFFE07B00),
    onPrimary        = Color.White,
    primaryContainer = Color(0xFFFFDDB4),
    secondary        = Color(0xFF6D5E0F),
    surface          = Color(0xFFFFFBFF),
    background       = Color(0xFFFFFBFF),
)

@Composable
fun HornetTrackerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, content = content)
}
