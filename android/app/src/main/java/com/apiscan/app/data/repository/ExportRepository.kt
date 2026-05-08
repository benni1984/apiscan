package com.apiscan.app.data.repository

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.apiscan.app.data.api.ApiService
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ExportRepository @Inject constructor(
    private val api: ApiService,
    @ApplicationContext private val context: Context,
) {
    suspend fun exportApiary(apiaryId: String, apiaryName: String, format: String): String {
        val body = api.exportApiaryInspections(apiaryId, format)
        val safeName = apiaryName.replace(Regex("[^a-zA-Z0-9_-]"), "_")
        val filename = "apiscan_${safeName}_inspections.$format"
        return saveToDownloads(body.bytes(), filename, mimeType(format))
    }

    suspend fun exportHive(hiveId: String, hiveName: String, format: String): String {
        val body = api.exportHiveInspections(hiveId, format)
        val safeName = hiveName.replace(Regex("[^a-zA-Z0-9_-]"), "_")
        val filename = "apiscan_${safeName}_inspections.$format"
        return saveToDownloads(body.bytes(), filename, mimeType(format))
    }

    private fun mimeType(format: String) = if (format == "csv") "text/csv" else "application/json"

    private fun saveToDownloads(data: ByteArray, filename: String, mime: String): String {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, filename)
                put(MediaStore.Downloads.MIME_TYPE, mime)
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val resolver = context.contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: error("MediaStore insert failed")
            resolver.openOutputStream(uri)!!.use { it.write(data) }
            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            filename
        } else {
            val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            dir.mkdirs()
            val file = File(dir, filename)
            FileOutputStream(file).use { it.write(data) }
            file.absolutePath
        }
    }
}
