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

    @Test
    fun `UserOut isAdmin defaults to false`() {
        val user = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01")
        assertFalse(user.isAdmin)
        assertFalse(user.isSupporter)
    }

    @Test
    fun `UserOut isAdmin can be set to true`() {
        val user = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01", isAdmin = true, isSupporter = true)
        assertTrue(user.isAdmin)
        assertTrue(user.isSupporter)
    }

    @Test
    fun `AdminUserOut holds expected values`() {
        val user = AdminUserOut("u1", "a@b.com", "Alice", "2024-01-01", isSupporter = true, apiaryCount = 2, hiveCount = 5, inspectionCount = 10)
        assertEquals("u1", user.id)
        assertTrue(user.isSupporter)
        assertEquals(5, user.hiveCount)
    }

    @Test
    fun `HealthSummary holds all counts`() {
        val summary = HealthSummary(inactiveUsersCount = 3, noVarroaApiariesCount = 2, zeroInspectionHivesCount = 1)
        assertEquals(3, summary.inactiveUsersCount)
        assertEquals(2, summary.noVarroaApiariesCount)
        assertEquals(1, summary.zeroInspectionHivesCount)
    }

    private fun hive() = HiveOut(
        id = "h1", qrToken = "tok", apiaryId = "a1", name = "Hive 1",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )
}
