package com.apiscan.app.screen

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.apiscan.app.MainActivity
import com.apiscan.app.data.api.ApiService
import com.apiscan.app.data.api.PaginatedResponse
import com.apiscan.app.data.api.TokenResponse
import com.apiscan.app.data.api.UserOut
import com.apiscan.app.data.local.TokenStore
import com.apiscan.app.di.NetworkModule
import dagger.hilt.android.testing.BindValue
import dagger.hilt.android.testing.HiltAndroidRule
import dagger.hilt.android.testing.HiltAndroidTest
import dagger.hilt.android.testing.UninstallModules
import androidx.test.espresso.Espresso
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import org.junit.Rule
import org.junit.Test
import org.junit.rules.ExternalResource
import org.junit.runner.RunWith
import javax.inject.Inject

@HiltAndroidTest
@UninstallModules(NetworkModule::class)
@RunWith(AndroidJUnit4::class)
class LoginScreenTest {

    @BindValue @JvmField
    val apiService: ApiService = mockk(relaxed = true)

    @Inject
    lateinit var tokenStore: TokenStore

    @get:Rule(order = 0)
    val hiltRule = HiltAndroidRule(this)

    // Order 1: inject deps + clear token store before the activity launches (order 2)
    @get:Rule(order = 1)
    val clearStore = object : ExternalResource() {
        override fun before() {
            hiltRule.inject()
            tokenStore.clear()
        }
    }

    @get:Rule(order = 2)
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun loginScreen_displaysEmailAndPasswordFields() {
        composeRule.onNodeWithText("Email").assertIsDisplayed()
        composeRule.onNodeWithText("Password").assertIsDisplayed()
    }

    @Test
    fun loginScreen_signInButtonDisabledWhenFieldsEmpty() {
        composeRule.onNodeWithText("Sign In").assertIsNotEnabled()
    }

    @Test
    fun loginScreen_navigatesToRegisterScreenOnLinkClick() {
        composeRule.onNodeWithText("Create an account").performClick()
        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Name").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Name").assertIsDisplayed()
    }

    @Test
    fun loginScreen_showsErrorBannerOnLoginFailure() {
        // Use RuntimeException (unchecked) to avoid Java proxy wrapping the exception in
        // UndeclaredThrowableException, which would make e.message null in the ViewModel.
        coEvery { apiService.login(any()) } throws RuntimeException("Invalid credentials")

        composeRule.onNodeWithText("Email").performTextReplacement("test@example.com")
        composeRule.onNodeWithText("Password").performTextReplacement("wrongpassword")
        Espresso.closeSoftKeyboard()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Sign In").performClick()

        // Verify api.login was called (distinguishes "click missed" from "error not shown")
        coVerify(timeout = 3_000) { apiService.login(any()) }

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("Invalid credentials")
                .fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("Invalid credentials").assertIsDisplayed()
    }

    @Test
    fun loginScreen_successfulLoginNavigatesToApiaryList() {
        val user = UserOut("uid-1", "test@example.com", "Test User", "en", "2024-01-01T00:00:00")
        coEvery { apiService.login(any()) } returns TokenResponse("access-token", "refresh-token", user)
        coEvery { apiService.listApiaries(any(), any()) } returns PaginatedResponse(emptyList(), 0, 1, 1)

        composeRule.onNodeWithText("Email").performTextReplacement("test@example.com")
        composeRule.onNodeWithText("Password").performTextReplacement("Demo1234!")
        Espresso.closeSoftKeyboard()
        composeRule.waitForIdle()
        composeRule.onNodeWithText("Sign In").performClick()

        composeRule.waitUntil(timeoutMillis = 5_000) {
            composeRule.onAllNodesWithText("My Apiaries").fetchSemanticsNodes().isNotEmpty()
        }
        composeRule.onNodeWithText("My Apiaries").assertIsDisplayed()
    }
}
