package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class HiveRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: HiveRepository

    @Before
    fun setUp() {
        repo = HiveRepository(api)
    }

    @After
    fun tearDown() = clearAllMocks()

    @Test
    fun `resolveQR returns Unlinked when status field is unlinked`() = runTest {
        val json = """{"status":"unlinked","token":"tok-abc"}"""
        coEvery { api.resolveQR("tok-abc") } returns json.toResponseBody("application/json".toMediaType())

        val result = repo.resolveQR("tok-abc")

        assertTrue(result is QRScanResult.Unlinked)
        assertEquals("tok-abc", (result as QRScanResult.Unlinked).token)
    }

    @Test
    fun `resolveQR returns Linked with correct hive data`() = runTest {
        val json = """
            {"id":"h1","qr_token":"tok-abc","apiary_id":"a1","name":"Hive 1",
             "hive_type":"langstroth","latitude":null,"longitude":null,
             "acquisition_date":null,"notes":null,"custom_fields":{},
             "initialized_at":"2024-01-01","last_inspection_at":null,"created_at":"2024-01-01"}
        """.trimIndent()
        coEvery { api.resolveQR("tok-abc") } returns json.toResponseBody("application/json".toMediaType())

        val result = repo.resolveQR("tok-abc")

        assertTrue(result is QRScanResult.Linked)
        val hive = (result as QRScanResult.Linked).hive
        assertEquals("h1", hive.id)
        assertEquals("Hive 1", hive.name)
        assertEquals("langstroth", hive.hiveType)
    }

    @Test
    fun `listForApiary unwraps items from paginated response`() = runTest {
        val hive = hive("h1")
        coEvery { api.listHives("a1") } returns PaginatedResponse(listOf(hive), 1, 1, 1)

        val result = repo.listForApiary("a1")

        assertEquals(listOf(hive), result)
    }

    @Test
    fun `get delegates to api getHive`() = runTest {
        val hive = hive("h1")
        coEvery { api.getHive("h1") } returns hive

        assertEquals(hive, repo.get("h1"))
    }

    @Test
    fun `delete delegates to api deleteHive`() = runTest {
        coEvery { api.deleteHive("h1") } returns mockk(relaxed = true)

        repo.delete("h1")

        coVerify { api.deleteHive("h1") }
    }

    private fun hive(id: String) = HiveOut(
        id = id, qrToken = "tok", apiaryId = "a1", name = "Hive $id",
        hiveType = "langstroth", latitude = null, longitude = null,
        acquisitionDate = null, notes = null, customFields = emptyMap(),
        initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
    )
}
