package com.apiscan.app.ui.hornet

import com.apiscan.app.data.api.*
import com.apiscan.app.data.repository.HornetRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HornetViewModelTest {

    private val repo = mockk<HornetRepository>()
    private lateinit var vm: HornetViewModel

    private fun stats() = HornetStats(42, 7, 2, 3, 5)
    private fun nestGeoJSON() = HornetNestGeoJSON(
        "FeatureCollection", listOf(
            HornetNestFeature(
                "Feature",
                HornetNestGeometry("Point", listOf(2.35, 48.85)),
                HornetNestProperties("n-1", "found", null, null, null, "2026-05-01")
            )
        )
    )
    private fun sighting(id: String = "s-1") = HornetSightingOut(
        id = id, photoUrl = "https://example.com/s.jpg",
        description = null, reporterName = null,
        status = "pending", yesVotes = 0, noVotes = 0,
        createdAt = "2026-05-01T10:00:00", latitude = null, longitude = null
    )
    private fun paginated(items: List<HornetSightingOut>, page: Int = 1, pages: Int = 1) =
        PaginatedResponse(items, items.size, page, pages)

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        vm = HornetViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    // MARK: - loadStats

    @Test
    fun `loadStats populates stats`() = runTest {
        coEvery { repo.getStats() } returns stats()
        vm.loadStats()
        assertEquals(42, vm.state.value.stats?.totalCaught)
        assertNull(vm.state.value.error)
    }

    @Test
    fun `loadStats failure sets error`() = runTest {
        coEvery { repo.getStats() } throws RuntimeException("Stats failed")
        vm.loadStats()
        assertNull(vm.state.value.stats)
        assertEquals("Stats failed", vm.state.value.error)
    }

    // MARK: - loadNests

    @Test
    fun `loadNests populates nests`() = runTest {
        coEvery { repo.getNests() } returns nestGeoJSON()
        vm.loadNests()
        assertNotNull(vm.state.value.nests)
        assertEquals(1, vm.state.value.nests!!.features.size)
    }

    @Test
    fun `loadNests failure sets error`() = runTest {
        coEvery { repo.getNests() } throws RuntimeException("Nests failed")
        vm.loadNests()
        assertNull(vm.state.value.nests)
        assertEquals("Nests failed", vm.state.value.error)
    }

    // MARK: - loadSightings

    @Test
    fun `loadSightings page1 sets sightings`() = runTest {
        coEvery { repo.getSightings(1) } returns paginated(listOf(sighting()))
        vm.loadSightings(1)
        assertEquals(1, vm.state.value.sightings.size)
        assertEquals("s-1", vm.state.value.sightings[0].id)
    }

    @Test
    fun `loadSightings page2 appends sightings`() = runTest {
        val s1 = sighting("s-1")
        val s2 = sighting("s-2")
        coEvery { repo.getSightings(1) } returns paginated(listOf(s1), 1, 2)
        coEvery { repo.getSightings(2) } returns paginated(listOf(s2), 2, 2)
        vm.loadSightings(1)
        vm.loadSightings(2)
        assertEquals(2, vm.state.value.sightings.size)
    }

    @Test
    fun `loadSightings failure sets error`() = runTest {
        coEvery { repo.getSightings(any()) } throws RuntimeException("Sightings failed")
        vm.loadSightings()
        assertEquals("Sightings failed", vm.state.value.error)
    }

    // MARK: - submitCatch

    @Test
    fun `submitCatch calls onSuccess on success`() = runTest {
        coEvery { repo.submitCatch(3, null, null, null) } returns
            HornetCatchOut("c-1", 3, null, null, "2026-05-01")
        var called = false
        vm.submitCatch(3, onSuccess = { called = true })
        assertTrue(called)
    }

    @Test
    fun `submitCatch failure sets error`() = runTest {
        coEvery { repo.submitCatch(any(), any(), any(), any()) } throws RuntimeException("Submit failed")
        vm.submitCatch(1)
        assertEquals("Submit failed", vm.state.value.error)
    }

    // MARK: - submitNest

    @Test
    fun `submitNest calls onSuccess on success`() = runTest {
        coEvery { repo.submitNest(48.85, 2.35, null, null, null) } returns
            HornetNestOut("n-new", 48.85, 2.35, "found", null, null, null, "2026-05-01", "2026-05-01")
        var called = false
        vm.submitNest(48.85, 2.35, onSuccess = { called = true })
        assertTrue(called)
    }

    // MARK: - submitSighting

    @Test
    fun `submitSighting prepends sighting to list`() = runTest {
        val existing = sighting("s-existing")
        coEvery { repo.getSightings(1) } returns paginated(listOf(existing))
        vm.loadSightings(1)
        val newSighting = sighting("s-new")
        coEvery { repo.submitSighting(any(), any(), any(), any(), any()) } returns newSighting
        vm.submitSighting("https://example.com/x.jpg")
        assertEquals("s-new", vm.state.value.sightings[0].id)
        assertEquals(2, vm.state.value.sightings.size)
    }

    // MARK: - vote

    @Test
    fun `vote reloads sightings on success`() = runTest {
        coEvery { repo.vote("s-1", "yes") } just runs
        coEvery { repo.getSightings(1) } returns paginated(listOf(sighting()))
        vm.vote("s-1", "yes")
        assertEquals(1, vm.state.value.sightings.size)
    }

    @Test
    fun `vote failure sets error`() = runTest {
        coEvery { repo.vote(any(), any()) } throws RuntimeException("Vote failed")
        vm.vote("s-1", "yes")
        assertEquals("Vote failed", vm.state.value.error)
    }

    // MARK: - clearError

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.getStats() } throws RuntimeException("err")
        vm.loadStats()
        assertNotNull(vm.state.value.error)
        vm.clearError()
        assertNull(vm.state.value.error)
    }
}
