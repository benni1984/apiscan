package com.apiscan.app.ui.common

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ErrorBanner(message: String, onDismiss: (() -> Unit)? = null) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Warning, contentDescription = null,
                tint = MaterialTheme.colorScheme.onErrorContainer)
            Spacer(Modifier.width(8.dp))
            Text(message, modifier = Modifier.weight(1f),
                color = MaterialTheme.colorScheme.onErrorContainer,
                style = MaterialTheme.typography.bodyMedium)
            if (onDismiss != null) {
                TextButton(onClick = onDismiss) { Text("✕") }
            }
        }
    }
}

@Composable
fun LoadingScreen() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.weight(1f).wrapContentWidth(Alignment.End))
    }
}

@Composable
fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 4.dp)
    )
}

// Simple line chart drawn with Canvas
@Composable
fun SimpleLineChart(
    points: List<Pair<String, Float>>,
    lineColor: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier.fillMaxWidth().height(140.dp)
) {
    if (points.size < 2) {
        Box(modifier, contentAlignment = Alignment.Center) {
            Text("—", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        return
    }
    val maxVal = points.maxOf { it.second }
    val minVal = points.minOf { it.second }
    val range  = (maxVal - minVal).coerceAtLeast(1f)

    androidx.compose.foundation.Canvas(modifier) {
        val path = androidx.compose.ui.graphics.Path()
        points.forEachIndexed { i, (_, v) ->
            val x = size.width * i / (points.size - 1)
            val y = size.height * (1f - (v - minVal) / range)
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(
            path, lineColor,
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 3.dp.toPx(),
                cap = androidx.compose.ui.graphics.StrokeCap.Round,
                join = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        )
        points.forEach { (_, v) ->
            val i = points.indexOf(Pair(points.first { it.second == v }.first, v))
            val x = size.width * i / (points.size - 1)
            val y = size.height * (1f - (v - minVal) / range)
            drawCircle(lineColor, radius = 4.dp.toPx(), center = androidx.compose.ui.geometry.Offset(x, y))
        }
    }
}
