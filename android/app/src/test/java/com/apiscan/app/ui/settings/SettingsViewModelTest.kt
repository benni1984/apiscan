package com.apiscan.app.ui.settings

import com.apiscan.app.data.api.UserOut
import com.apiscan.app.data.repository.AuthRepository
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class SettingsViewModelTest {

    private val repo = mockk<AuthRepository>()
    private lateinit var vm: SettingsViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        coEvery { repo.getMe() } returns user()
        vm = SettingsViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `init loads user on construction`() {
        assertEquals(user(), vm.state.value.user)
        assertFalse(vm.state.value.isLoading)
    }

    @Test
    fun `init failure sets error`() = runTest {
        coEvery { repo.getMe() } throws RuntimeException("Unauthorized")
        val vm = SettingsViewModel(repo)

        assertEquals("Unauthorized", vm.state.value.error)
        assertNull(vm.state.value.user)
    }

    @Test
    fun `updateName saves name and updates user in state`() = runTest {
        val updated = user().copy(name = "Bob")
        coEvery { repo.updateMe("Bob", null) } returns updated

        vm.updateName("Bob")

        assertEquals("Bob", vm.state.value.user?.name)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `updateName failure sets error`() = runTest {
        coEvery { repo.updateMe(any(), any()) } throws RuntimeException("save failed")

        vm.updateName("Bob")

        assertEquals("save failed", vm.state.value.error)
        assertFalse(vm.state.value.isSaving)
    }

    @Test
    fun `updateLocale updates user locale in state`() = runTest {
        val updated = user().copy(locale = "fr")
        coEvery { repo.updateMe(null, "fr") } returns updated

        vm.updateLocale("fr")

        assertEquals("fr", vm.state.value.user?.locale)
    }

    @Test
    fun `logout sets loggedOut flag regardless of api result`() = runTest {
        coEvery { repo.logout() } just runs

        vm.logout()

        assertTrue(vm.state.value.loggedOut)
    }

    @Test
    fun `logout sets loggedOut even when api throws`() = runTest {
        coEvery { repo.logout() } throws RuntimeException("network")

        vm.logout()

        assertTrue(vm.state.value.loggedOut)
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.updateMe(any(), any()) } throws RuntimeException("err")
        vm.updateName("Bob")
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    private fun user() = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01")
}
