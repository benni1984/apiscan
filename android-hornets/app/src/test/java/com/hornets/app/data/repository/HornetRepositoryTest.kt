package com.hornets.app.data.repository

import com.hornets.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class HornetRepositoryTest {

    private val api = mockk<HornetApiService>()
    private lateinit var repo: HornetRepository

    @Before
    fun setUp() { repo = HornetRepository(api) }

    private fun stats() = HornetStats(42, 7, 2, 3, 5)
    private fun nestGeoJSON() = HornetNestGeoJSON(
        type = "FeatureCollection",
        features = listOf(
            HornetNestFeature(
                type = "Feature",
                geometry = HornetNestGeometry("Point", listOf(2.35, 48.85)),
                properties = HornetNestProperties("n-1", "found", null, null, null, "2026-05-01")
            )
        )
    )
    private fun sighting(id: String = "s-1") = HornetSightingOut(
        id = id, photoUrl = "https://example.com/s.jpg",
        description = "Near flowers", reporterName = "Alice",
        status = "pending", yesVotes = 2, noVotes = 1,
        createdAt = "2026-05-01T10:00:00", latitude = 48.85, longitude = 2.35
    )
    private fun paginated(items: List<HornetSightingOut>) =
        PaginatedResponse(items = items, total = items.size, page = 1, pages = 1)

    @Test
    fun `getStats returns stats from api`() = runTest {
        coEvery { api.hornetStats() } returns stats()
        val result = repo.getStats()
        assertEquals(42, result.totalCaught)
        assertEquals(7, result.totalNests)
    }

    @Test
    fun `submitCatch delegates to api`() = runTest {
        val out = HornetCatchOut("c-1", 3, null, null, "2026-05-01")
        coEvery { api.submitHornetCatch(any()) } returns out
        val result = repo.submitCatch(3, null, null, null)
        assertEquals("c-1", result.id)
        coVerify { api.submitHornetCatch(HornetCatchCreate(null, null, 3, null)) }
    }

    @Test
    fun `getNests returns GeoJSON`() = runTest {
        coEvery { api.hornetNests() } returns nestGeoJSON()
        val result = repo.getNests()
        assertEquals("FeatureCollection", result.type)
        assertEquals(1, result.features.size)
        assertEquals("found", result.features[0].properties.status)
    }

    @Test
    fun `getSightings passes page param`() = runTest {
        coEvery { api.hornetSightings(page = 2, perPage = 12) } returns paginated(listOf(sighting()))
        val result = repo.getSightings(2)
        assertEquals(1, result.items.size)
        coVerify { api.hornetSightings(page = 2, perPage = 12) }
    }

    @Test
    fun `vote calls api with correct params`() = runTest {
        coEvery { api.voteOnSighting("s-1", any()) } returns Unit
        repo.vote("s-1", "yes")
        coVerify { api.voteOnSighting("s-1", HornetVoteRequest("yes")) }
    }
}
