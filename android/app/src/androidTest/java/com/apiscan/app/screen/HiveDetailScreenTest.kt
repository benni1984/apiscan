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
class HiveDetailScreenTest {

    private val apiary = ApiaryOut("apiary-1", "Meadow", null, null, null, null, 1, false, "2024-01-01")
    private val hive   = HiveOut(
        id = "hive-1", qrToken = "qr-token-1", apiaryId = "apiary-1",
        name = "Hive Alpha", hiveType = "langstroth",
        latitude = null, longitude = null, acquisitionDate = null, notes = null,
        customFields = emptyMap(), initializedAt = "2024-01-01T00:00:00",
        lastInspectionAt = null, createdAt = "2024-01-01T00:00:00"
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

    private fun navigateToHiveDetail() {
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
    }

    @Test
    fun hiveDetail_showsHiveNameInTopBar() {
        navigateToHiveDetail()
        composeRule.onNodeWithText("Hive Alpha").assertIsDisplayed()
    }

    @Test
    fun hiveDetail_showsHiveTypeInDetailsCard() {
        navigateToHiveDetail()
        composeRule.onNodeWithText("Langstroth").assertIsDisplayed()
    }

    @Test
    fun hiveDetail_showsEmptyInspectionsMessage() {
        navigateToHiveDetail()
        composeRule.onNodeWithText("No inspections recorded yet.").assertIsDisplayed()
    }

    @Test
    fun hiveDetail_showsInspectionDateWhenLoaded() {
        coEvery { apiService.listInspections(any(), any(), any()) } returns PaginatedResponse(
            listOf(inspection()), 1, 1, 1
        )
        navigateToHiveDetail()
        composeRule.onNodeWithText("2024-03-15").assertIsDisplayed()
    }

    @Test
    fun hiveDetail_fabNavigatesToInspectionForm() {
        navigateToHiveDetail()
        composeRule.onNodeWithContentDescription("New Inspection").performClick()
        composeRule.waitUntil(5_000) {
            composeRule.onAllNodesWithText("New Inspection").fetchSemanticsNodes().size >= 1
        }
        composeRule.onNodeWithText("Date (yyyy-MM-dd)").assertIsDisplayed()
    }

    private fun inspection() = InspectionOut(
        id = "insp-1", hiveId = "hive-1", date = "2024-03-15",
        queenSeen = true, queenColor = null, broodFrames = 5, honeyFrames = 3,
        mood = "calm", populationStrength = null, varroaCount = 2,
        swarmCellsSeen = false, treatmentApplied = null, feedingDone = false,
        feedingType = null, weightKg = null, notes = null,
        customFields = emptyMap(), createdAt = "2024-03-15T10:00:00"
    )
}
