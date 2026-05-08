package com.apiscan.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apiscan.app.MainActivity
import com.apiscan.app.data.api.ApiaryOut
import com.apiscan.app.data.api.ApiService
import com.apiscan.app.data.api.PaginatedResponse
import com.apiscan.app.data.api.UserOut
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.di.NetworkModule
import dagger.hilt.android.testing.BindValue
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.UninstallModules
import io.mockk.coEvery
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class ApiaryWithDataTest {

    private val testApiaries = listOf(
        ApiaryOut("id-1", "Honey Farm",   null, null, null, null,     3, false, "2024-01-01T00:00:00"),
        ApiaryOut("id-2", "Garden Hives", null, null, null, "Main St",1, false, "2024-02-01T00:00:00"),
    )

    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(testApiaries, 2, 1, 1)
        coEvery { it.getMe() } returns UserOut("uid-1", "beekeeper@example.com", "Beekeeper", "en", "2024-01-01T00:00:00")
    }

    @Inject
    lateinit var tokenStore: TokenStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    @get:Rule(order = 1)
    val setupLoggedIn = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
            tokenStore.accessToken = "test-access-token"
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    private fun waitForApiaryList() {
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
    }

    @Test
    fun apiaryList_showsApiaryNames() {
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Honey Farm").assertIsDisplayed()
        composeRule.onNodeWithText("Garden Hives").assertIsDisplayed()
    }

    @Test
    fun apiaryList_showsHiveCount() {
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Honey Farm").fetchSemanticsNodes().isNotEmpty()
        }
        // The list item shows "${apiary.hiveCount} hives"
        composeRule.onNodeWithText("3 hives").assertIsDisplayed()
    }
}
