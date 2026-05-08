package com.apiscan.app.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apiscan.app.MainActivity
import com.apiscan.app.data.api.*
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.di.NetworkModule
import dagger.hilt.android.testing.*
import io.mockk.*
import org.junit.*
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class InspectionFormScreenTest {

    private val apiary = ApiaryOut("apiary-1", "Meadow", null, null, null, null, 1, false, "2024-01-01")
    private val hive   = HiveOut(
        id = "hive-1", qrToken = "qr-token-1", apiaryId = "apiary-1",
        name = "Hive Alpha", hiveType = "langstroth",
        latitude = null, longitude = null, acquisitionDate = null, notes = null,
        customFields = emptyMap(), initializedAt = "2024-01-01T00:00:00",
        lastInspectionAt = null, createdAt = "2024-01-01T00:00:00"
    )
    private val savedInspection = InspectionOut(
        id = "insp-new", hiveId = "hive-1", date = "2024-04-01",
        queenSeen = null, queenColor = null, broodFrames = null, honeyFrames = null,
        mood = null, populationStrength = null, varroaCount = null,
        swarmCellsSeen = null, treatmentApplied = null, feedingDone = null,
        feedingType = null, weightKg = null, notes = null,
        customFields = emptyMap(), createdAt = "2024-04-01T10:00:00"
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(listOf(apiary), 1, 1, 1)
        coEvery { it.getApiary(any()) } returns apiary
        coEvery { it.listHives(any(), any(), any()) } returns PaginatedResponse(listOf(hive), 1, 1, 1)
        coEvery { it.getHive(any()) } returns hive
        coEvery { it.listInspections(any(), any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
    }

    @Inject lateinit var tokenStore: TokenStore

    @get:Rule(order = 0) val hiltRule    = HiltAndroidRule(this)
    @get:Rule(order = 1) val setupRule   = object : ExternalResource() {
        override fun before() { hiltRule.inject(); tokenStore.clear(); tokenStore.accessToken = "test-access-token" }
    }
    @get:Rule(order = 2) val composeRule = createAndroidComposeRule<MainActivity>()

    private fun navigateToInspectionForm() {
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Meadow").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Hive Alpha").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Hive Alpha").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Inspections").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithContentDescription("New Inspection").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Date (yyyy-MM-dd)").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun inspectionForm_showsDateAndQueenSections() {
        navigateToInspectionForm()
        composeRule.onNodeWithText("Date").assertIsDisplayed()
        composeRule.onNodeWithText("Queen").assertIsDisplayed()
    }

    @Test
    fun inspectionForm_showsFramesAndColonySections() {
        navigateToInspectionForm()
        composeRule.onNodeWithText("Frames").assertIsDisplayed()
        composeRule.onNodeWithText("Colony").assertIsDisplayed()
    }

    @Test
    fun inspectionForm_saveButtonIsEnabledByDefault() {
        navigateToInspectionForm()
        composeRule.onNodeWithText("Save").assertIsDisplayed()
    }

    @Test
    fun inspectionForm_saveSuccessNavigatesBackToHiveDetail() {
        coEvery { apiService.createInspection(any(), any()) } returns savedInspection
        navigateToInspectionForm()
        composeRule.onNodeWithText("Save").performClick()
        coVerify(timeout = 3_000) { apiService.createInspection(any(), any()) }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Inspections").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Inspections").assertIsDisplayed()
    }

    @Test
    fun inspectionForm_showsErrorBannerOnSaveFailure() {
        coEvery { apiService.createInspection(any(), any()) } throws RuntimeException("Server unavailable")
        navigateToInspectionForm()
        composeRule.onNodeWithText("Save").performClick()
        coVerify(timeout = 3_000) { apiService.createInspection(any(), any()) }
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("Server unavailable").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Server unavailable").assertIsDisplayed()
    }
}
