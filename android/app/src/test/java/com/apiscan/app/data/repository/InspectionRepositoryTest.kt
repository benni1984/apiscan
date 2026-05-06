package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class InspectionRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: InspectionRepository

    @Before
    fun setUp() {
        repo = InspectionRepository(api)
    }

    @After
    fun tearDown() = clearAllMocks()

    @Test
    fun `list returns paginated response from api`() = runTest {
        val paginated = PaginatedResponse(listOf(inspection("i1")), 1, 1, 1)
        coEvery { api.listInspections("h1", 1) } returns paginated

        val result = repo.list("h1")

        assertEquals(paginated, result)
    }

    @Test
    fun `list passes page parameter to api`() = runTest {
        val paginated = PaginatedResponse(emptyList<InspectionOut>(), 0, 2, 1)
        coEvery { api.listInspections("h1", 2) } returns paginated

        repo.list("h1", page = 2)

        coVerify { api.listInspections("h1", 2) }
    }

    @Test
    fun `create calls api and returns created inspection`() = runTest {
        val req = request()
        val created = inspection("i2")
        coEvery { api.createInspection("h1", req) } returns created

        val result = repo.create("h1", req)

        assertEquals(created, result)
    }

    @Test
    fun `update calls api and returns updated inspection`() = runTest {
        val req = request()
        val updated = inspection("i1")
        coEvery { api.updateInspection("i1", req) } returns updated

        val result = repo.update("i1", req)

        assertEquals(updated, result)
    }

    @Test
    fun `delete calls api deleteInspection`() = runTest {
        coEvery { api.deleteInspection("i1") } returns mockk(relaxed = true)

        repo.delete("i1")

        coVerify { api.deleteInspection("i1") }
    }

    private fun request() = InspectionCreateRequest(
        date = "2024-06-01", queenSeen = null, queenColor = null,
        broodFrames = null, honeyFrames = null, mood = null,
        populationStrength = null, varroaCount = null, swarmCellsSeen = null,
        treatmentApplied = null, feedingDone = null, feedingType = null,
        weightKg = null, notes = null
    )

    private fun inspection(id: String) = InspectionOut(
        id = id, hiveId = "h1", date = "2024-06-01", queenSeen = null,
        queenColor = null, broodFrames = null, honeyFrames = null, mood = null,
        populationStrength = null, varroaCount = null, swarmCellsSeen = null,
        treatmentApplied = null, feedingDone = null, feedingType = null,
        weightKg = null, notes = null, customFields = emptyMap(), createdAt = "2024-06-01"
    )
}
