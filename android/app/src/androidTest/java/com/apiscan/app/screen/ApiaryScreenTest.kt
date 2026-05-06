package com.apiscan.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apiscan.app.MainActivity
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
class ApiaryScreenTest {

    // Stubs in the field initializer are in place before the activity launches (order 2 rule).
    @BindValue @JvmField
    val apiService: ApiService = mockk<ApiService>(relaxed = true).also {
        coEvery { it.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)
        coEvery { it.getMe() } returns UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
    }

    @Inject
    lateinit var tokenStore: TokenStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    // Order 1: inject + set a fake access token before the activity (order 2) launches
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
    fun apiaryList_showsScreenTitle() {
        waitForApiaryList()
        composeRule.onNodeWithText("My Apiaries").assertIsDisplayed()
    }

    @Test
    fun apiaryList_showsEmptyStateWhenNoApiaries() {
        waitForApiaryList()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodes(hasText("No apiaries yet", substring = true))
                .fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNode(hasText("No apiaries yet", substring = true)).assertIsDisplayed()
    }

    @Test
    fun apiaryList_fabOpensCreateApiaryDialog() {
        waitForApiaryList()
        composeRule.onNodeWithContentDescription("New Apiary").performClick()
        composeRule.onNodeWithText("New Apiary").assertIsDisplayed()
    }

    @Test
    fun apiaryList_navigatesToSettingsAndShowsSignOutButton() {
        waitForApiaryList()
        composeRule.onNodeWithContentDescription("Settings").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Sign Out").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Sign Out").assertIsDisplayed()
    }

    @Test
    fun settings_signOutDialogAppearsOnButtonClick() {
        waitForApiaryList()
        composeRule.onNodeWithContentDescription("Settings").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Sign Out").fetchSemanticsNodes().isNotEmpty()
        }
        // Click the "Sign Out" outlined button (not the icon button in the top bar)
        composeRule.onNodeWithText("Sign Out").performClick()
        composeRule.onNodeWithText("Are you sure you want to sign out?").assertIsDisplayed()
    }

    @Test
    fun settings_showsUserEmailFromApi() {
        waitForApiaryList()
        composeRule.onNodeWithContentDescription("Settings").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("test@example.com").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("test@example.com").assertIsDisplayed()
    }
}
