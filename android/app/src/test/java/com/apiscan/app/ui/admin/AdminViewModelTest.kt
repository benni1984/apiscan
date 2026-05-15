package com.apiscan.app.ui.admin

import com.apiscan.app.data.api.*
import com.apiscan.app.data.repository.AdminRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AdminStatsViewModelTest {

    private val repo = mockk<AdminRepository>()
    private lateinit var vm: AdminStatsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getStats(any()) } returns platformStats()
        coEvery { repo.getTokenStats() } returns tokenStats()
        vm = AdminStatsViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads stats and token stats`() {
        assertEquals(10, vm.state.value.stats?.totalUsers)
        assertEquals(8, vm.state.value.tokenStats?.totalActiveSessions)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { repo.getStats(any()) } throws RuntimeException("network error")
        val vm = AdminStatsViewModel(repo)
        assertEquals("network error", vm.state.value.error)
        assertNull(vm.state.value.stats)
    }

    @Test
    fun `load clears previous error on retry`() = runTest {
        coEvery { repo.getStats(any()) } throws RuntimeException("err")
        val vm = AdminStatsViewModel(repo)
        assertNotNull(vm.state.value.error)
        coEvery { repo.getStats(any()) } returns platformStats()
        vm.load()
        assertNull(vm.state.value.error)
    }

    @Test
    fun `setPreset changes preset and reloads`() = runTest {
        vm.setPreset("90d")
        assertEquals("90d", vm.state.value.preset)
        coVerify { repo.getStats("90d") }
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.getStats(any()) } throws RuntimeException("err")
        val vm = AdminStatsViewModel(repo)
        vm.clearError()
        assertNull(vm.state.value.error)
    }

    @Test
    fun `isLoading is false after load completes`() {
        assertFalse(vm.state.value.isLoading)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class AdminUsersViewModelTest {

    private val repo = mockk<AdminRepository>()
    private lateinit var vm: AdminUsersViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getUsers(any(), any(), any()) } returns page(listOf(adminUser("u-1")))
        vm = AdminUsersViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads users`() {
        assertEquals(1, vm.state.value.users.size)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { repo.getUsers(any(), any(), any()) } throws RuntimeException("fail")
        val vm = AdminUsersViewModel(repo)
        assertEquals("fail", vm.state.value.error)
        assertTrue(vm.state.value.users.isEmpty())
    }

    @Test
    fun `search resets page to 1 and reloads`() = runTest {
        vm.nextPage() // advance to page 2 if pages > 1 — won't advance since pages=1
        vm.search("alice")
        assertEquals(1, vm.state.value.page)
        coVerify { repo.getUsers(1, "alice", null) }
    }

    @Test
    fun `toggleSupporter updates user in list`() = runTest {
        val user = adminUser("u-1", isSupporter = false)
        coEvery { repo.getUsers(any(), any(), any()) } returns page(listOf(user))
        val vm = AdminUsersViewModel(repo)
        coEvery { repo.setSupporter("u-1", true) } returns adminUser("u-1", isSupporter = true)
        vm.toggleSupporter(user)
        assertTrue(vm.state.value.users.first().isSupporter)
    }

    @Test
    fun `toggleSupporter failure sets error`() = runTest {
        val user = adminUser("u-1")
        coEvery { repo.setSupporter(any(), any()) } throws RuntimeException("revoke failed")
        vm.toggleSupporter(user)
        assertNotNull(vm.state.value.error)
    }

    @Test
    fun `deleteUser removes user from list`() = runTest {
        coEvery { repo.getUsers(any(), any(), any()) } returns page(listOf(adminUser("u-1"), adminUser("u-2")))
        val vm = AdminUsersViewModel(repo)
        coEvery { repo.deleteUser("u-1") } just runs
        vm.deleteUser("u-1")
        assertEquals(1, vm.state.value.users.size)
        assertEquals("u-2", vm.state.value.users.first().id)
    }

    @Test
    fun `revokeTokens failure sets error`() = runTest {
        coEvery { repo.revokeTokens(any()) } throws RuntimeException("token revoke failed")
        vm.revokeTokens("u-1")
        assertNotNull(vm.state.value.error)
    }

    @Test
    fun `nextPage increments page and reloads`() = runTest {
        coEvery { repo.getUsers(any(), any(), any()) } returns page(listOf(adminUser()), pages = 3)
        val vm = AdminUsersViewModel(repo)
        vm.nextPage()
        assertEquals(2, vm.state.value.page)
        coVerify { repo.getUsers(2, any(), any()) }
    }

    @Test
    fun `prevPage does nothing at page 1`() = runTest {
        vm.prevPage()
        assertEquals(1, vm.state.value.page)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class AdminMapViewModelTest {

    private val repo = mockk<AdminRepository>()
    private lateinit var vm: AdminMapViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getApiaries(any()) } returns page(listOf(adminApiary("ap-1"), adminApiary("ap-2")))
        coEvery { repo.getFlaggedApiaries(any()) } returns page(listOf(adminApiary("ap-3")))
        vm = AdminMapViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads apiaries`() {
        assertEquals(2, vm.state.value.apiaries.size)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { repo.getApiaries(any()) } throws RuntimeException("err")
        val vm = AdminMapViewModel(repo)
        assertNotNull(vm.state.value.error)
        assertTrue(vm.state.value.apiaries.isEmpty())
    }

    @Test
    fun `toggleFlagged true loads flagged apiaries`() = runTest {
        vm.toggleFlagged(true)
        assertEquals(1, vm.state.value.apiaries.size)
        assertEquals("ap-3", vm.state.value.apiaries.first().id)
        coVerify { repo.getFlaggedApiaries(1) }
    }

    @Test
    fun `setPrivate removes apiary from list`() = runTest {
        val apiary = adminApiary("ap-1")
        coEvery { repo.setPrivate("ap-1") } just runs
        vm.setPrivate(apiary)
        assertEquals(1, vm.state.value.apiaries.size)
        assertEquals("ap-2", vm.state.value.apiaries.first().id)
    }

    @Test
    fun `setPrivate failure sets error and keeps apiary`() = runTest {
        val apiary = adminApiary("ap-1")
        coEvery { repo.setPrivate(any()) } throws RuntimeException("err")
        vm.setPrivate(apiary)
        assertNotNull(vm.state.value.error)
        assertEquals(2, vm.state.value.apiaries.size)
    }
}

@OptIn(ExperimentalCoroutinesApi::class)
class AdminHealthViewModelTest {

    private val repo = mockk<AdminRepository>()
    private lateinit var vm: AdminHealthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getHealthSummary() } returns healthSummary()
        vm = AdminHealthViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads health summary`() {
        assertEquals(3, vm.state.value.summary?.inactiveUsersCount)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `load failure sets error`() = runTest {
        coEvery { repo.getHealthSummary() } throws RuntimeException("err")
        val vm = AdminHealthViewModel(repo)
        assertNull(vm.state.value.summary)
        assertNotNull(vm.state.value.error)
    }

    @Test
    fun `toggleDetail inactive loads inactive users`() = runTest {
        val user = inactiveUser("u-1")
        coEvery { repo.getInactiveUsers(1) } returns page(listOf(user))
        vm.toggleDetail(HealthDetail.INACTIVE)
        assertEquals(HealthDetail.INACTIVE, vm.state.value.activeDetail)
        assertEquals(1, vm.state.value.inactiveUsers.size)
        assertFalse(vm.state.value.isDrillLoading)
    }

    @Test
    fun `toggleDetail same detail collapses it`() = runTest {
        coEvery { repo.getInactiveUsers(1) } returns page(emptyList())
        vm.toggleDetail(HealthDetail.INACTIVE)
        assertEquals(HealthDetail.INACTIVE, vm.state.value.activeDetail)
        vm.toggleDetail(HealthDetail.INACTIVE)
        assertNull(vm.state.value.activeDetail)
    }

    @Test
    fun `toggleDetail noVarroa loads no-varroa apiaries`() = runTest {
        val apiary = NoVarroaApiary("a-1", "Test", 3)
        coEvery { repo.getNoVarroaApiaries() } returns listOf(apiary)
        vm.toggleDetail(HealthDetail.NO_VARROA)
        assertEquals(HealthDetail.NO_VARROA, vm.state.value.activeDetail)
        assertEquals(1, vm.state.value.noVarroaApiaries.size)
    }

    @Test
    fun `toggleDetail zeroHives loads zero-inspection hives`() = runTest {
        val hive = ZeroInspectionHive("h-1", "Hive One", "My Apiary", "2024-01-01")
        coEvery { repo.getZeroInspectionHives(1) } returns page(listOf(hive))
        vm.toggleDetail(HealthDetail.ZERO_HIVES)
        assertEquals(HealthDetail.ZERO_HIVES, vm.state.value.activeDetail)
        assertEquals(1, vm.state.value.zeroInspectionHives.size)
        assertEquals("Hive One", vm.state.value.zeroInspectionHives.first().hiveName)
    }

    @Test
    fun `loadMoreInactive appends items and increments page`() = runTest {
        val first = inactiveUser("u-1")
        val second = inactiveUser("u-2")
        coEvery { repo.getInactiveUsers(1) } returns page(listOf(first), page = 1, pages = 2)
        vm.toggleDetail(HealthDetail.INACTIVE)
        assertEquals(1, vm.state.value.inactiveUsers.size)
        coEvery { repo.getInactiveUsers(2) } returns page(listOf(second), page = 2, pages = 2)
        vm.loadMoreInactive()
        assertEquals(2, vm.state.value.inactiveUsers.size)
        assertEquals("u-2", vm.state.value.inactiveUsers.last().id)
    }

    @Test
    fun `loadMoreInactive does nothing when already at last page`() = runTest {
        coEvery { repo.getInactiveUsers(1) } returns page(listOf(inactiveUser("u-1")), page = 1, pages = 1)
        vm.toggleDetail(HealthDetail.INACTIVE)
        vm.loadMoreInactive()
        coVerify(exactly = 1) { repo.getInactiveUsers(any()) }
    }
}

// MARK: - Helpers

private fun platformStats() = PlatformStats(
    totalUsers = 10, newUsersInPeriod = 2, supporterCount = 1,
    totalApiaries = 5, publicApiaries = 3, totalHives = 20,
    totalInspections = 100, activeUsers30d = 4, signupsByDay = emptyList()
)

private fun tokenStats() = AdminTokenStats(
    totalActiveSessions = 8, usersWithActiveSessions = 4, avgSessionsPerUser = 2.0
)

private fun adminUser(id: String = "u-1", isSupporter: Boolean = false) = AdminUserOut(
    id = id, email = "test@example.com", name = "Test User", createdAt = "2024-01-01",
    isSupporter = isSupporter, apiaryCount = 1, hiveCount = 2, inspectionCount = 5
)

private fun adminApiary(id: String = "ap-1") = AdminApiary(
    id = id, name = "Test Apiary", ownerEmail = "owner@example.com",
    latitude = 48.8, longitude = 2.3, hiveCount = 5
)

private fun healthSummary() = HealthSummary(
    inactiveUsersCount = 3, noVarroaApiariesCount = 2, zeroInspectionHivesCount = 1
)

private fun inactiveUser(id: String = "u-1") = InactiveUser(
    id = id, email = "a@b.com", createdAt = "2024-01-01", daysSinceRegistration = 45
)

private fun <T> page(
    items: List<T>,
    page: Int = 1,
    pages: Int = 1
) = PaginatedResponse(items = items, total = items.size, page = page, pages = pages)
