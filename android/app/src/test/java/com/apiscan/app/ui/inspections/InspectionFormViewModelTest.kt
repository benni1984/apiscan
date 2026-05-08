package com.apiscan.app.ui.inspections

import androidx.lifecycle.SavedStateHandle
import com.apiscan.app.data.api.InspectionCreateRequest
import com.apiscan.app.data.api.InspectionOut
import com.apiscan.app.data.repository.ApiaryRepository
import com.apiscan.app.data.repository.HiveRepository
import com.apiscan.app.data.repository.InspectionRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class InspectionFormViewModelTest {

    private val repo = mockk<InspectionRepository>()
    private val hiveRepo = mockk<HiveRepository>()
    private val apiaryRepo = mockk<ApiaryRepository>()

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.listFieldDefinitions() } returns emptyList()
        coEvery { hiveRepo.get(any()) } returns com.apiscan.app.data.api.HiveOut(
            id = "h1", qrToken = "token", apiaryId = "a1", name = "Hive 1",
            hiveType = "langstroth", latitude = null, longitude = null,
            acquisitionDate = null, notes = null, customFields = emptyMap(),
            initializedAt = "2024-01-01", lastInspectionAt = null, createdAt = "2024-01-01"
        )
        coEvery { apiaryRepo.fieldDefinitions(any()) } returns emptyList()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `save creates new inspection when inspectionId is absent`() = runTest {
        val vm = vmForNew()
        coEvery { repo.create("h1", any()) } returns inspection("i1")

        vm.save(request())

        assertTrue(vm.state.value.saved)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `save updates existing inspection when inspectionId is present`() = runTest {
        val vm = vmForEdit("i1")
        coEvery { repo.update("i1", any()) } returns inspection("i1")

        vm.save(request())

        assertTrue(vm.state.value.saved)
        coVerify { repo.update("i1", any()) }
        coVerify(exactly = 0) { repo.create(any(), any()) }
    }

    @Test
    fun `save failure sets error message`() = runTest {
        val vm = vmForNew()
        coEvery { repo.create(any(), any()) } throws RuntimeException("validation error")

        vm.save(request())

        assertEquals("validation error", vm.state.value.error)
        assertFalse(vm.state.value.saved)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        val vm = vmForNew()
        coEvery { repo.create(any(), any()) } throws RuntimeException("err")
        vm.save(request())
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    @Test
    fun `hiveId is read from saved state`() {
        val vm = vmForNew()
        assertEquals("h1", vm.hiveId)
    }

    @Test
    fun `inspectionId is null when empty string is provided`() {
        val vm = vmForNew()
        assertNull(vm.inspectionId)
    }

    @Test
    fun `inspectionId is set when non-empty string is provided`() {
        val vm = vmForEdit("i42")
        assertEquals("i42", vm.inspectionId)
    }

    private fun vmForNew() = InspectionFormViewModel(
        SavedStateHandle(mapOf("hiveId" to "h1", "inspectionId" to "")), repo, hiveRepo, apiaryRepo
    )

    private fun vmForEdit(inspectionId: String) = InspectionFormViewModel(
        SavedStateHandle(mapOf("hiveId" to "h1", "inspectionId" to inspectionId)), repo, hiveRepo, apiaryRepo
    )

    private fun request() = InspectionCreateRequest(
        date = "2024-06-01", queenSeen = true, queenColor = "yellow",
        broodFrames = 5, honeyFrames = 3, mood = "calm",
        populationStrength = 8, varroaCount = 2, swarmCellsSeen = false,
        treatmentApplied = null, feedingDone = false, feedingType = null,
        weightKg = 45.5, notes = "Looks good"
    )

    private fun inspection(id: String) = InspectionOut(
        id = id, hiveId = "h1", date = "2024-06-01", queenSeen = true,
        queenColor = "yellow", broodFrames = 5, honeyFrames = 3, mood = "calm",
        populationStrength = 8, varroaCount = 2, swarmCellsSeen = false,
        treatmentApplied = null, feedingDone = false, feedingType = null,
        weightKg = 45.5, notes = "Looks good", customFields = emptyMap(),
        createdAt = "2024-06-01"
    )
}
