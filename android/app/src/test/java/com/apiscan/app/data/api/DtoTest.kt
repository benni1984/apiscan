package com.apiscan.app.data.api

import org.junit.Assert.*
import org.junit.Test

class DtoTest {

    @Test
    fun `QrTokenOut isLinked is true when linkedHiveId is not null`() {
        val token = QrTokenOut("abc", linkedHiveId = "hive-1")
        assertTrue(token.isLinked)
    }

    @Test
    fun `QrTokenOut isLinked is false when linkedHiveId is null`() {
        val token = QrTokenOut("abc", linkedHiveId = null)
        assertFalse(token.isLinked)
    }

    @Test
    fun `QRScanResult Linked wraps hive`() {
        val hive = hive()
        val result = QRScanResult.Linked(hive)
        assertEquals(hive, result.hive)
    }

    @Test
    fun `QRScanResult Unlinked wraps token string`() {
        val result = QRScanResult.Unlinked("tok-xyz")
        assertEquals("tok-xyz", result.token)
    }

    @Test
    fun `PaginatedResponse holds correct metadata`() {
        val response = PaginatedResponse(items = listOf("a", "b"), total = 10, page = 2, pages = 5)
        assertEquals(2, response.items.size)
        assertEquals(10, response.total)
        assertEquals(2, response.page)
        assertEquals(5, response.pages)
    }

    @Test
    fun `QrBatchSummary linked count field is accessible`() {
        val batch = QrBatchSummary("b1", 5, "2024-01-01", linkedCount = 3)
        assertEquals(3, batch.linkedCount)
    }

    private fun hive() = HiveOut(
        id = "h1", qrToken = "tok", apiaryId = "a1", name = "Hive 1",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )
}
