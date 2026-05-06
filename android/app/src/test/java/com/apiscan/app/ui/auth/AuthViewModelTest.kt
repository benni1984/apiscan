package com.apiscan.app.ui.auth

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
class AuthViewModelTest {

    private val repo = mockk<AuthRepository>()
    private lateinit var vm: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(UnconfinedTestDispatcher())
        vm = AuthViewModel(repo)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
        clearAllMocks()
    }

    @Test
    fun `login success sets user and success flag`() = runTest {
        val user = user()
        coEvery { repo.login("a@b.com", "secret") } returns user

        vm.login("a@b.com", "secret")

        val state = vm.state.value
        assertEquals(user, state.user)
        assertTrue(state.success)
        assertFalse(state.isLoading)
        assertNull(state.error)
    }

    @Test
    fun `login failure sets error message`() = runTest {
        coEvery { repo.login(any(), any()) } throws RuntimeException("Invalid credentials")

        vm.login("a@b.com", "wrong")

        val state = vm.state.value
        assertEquals("Invalid credentials", state.error)
        assertFalse(state.isLoading)
        assertFalse(state.success)
    }

    @Test
    fun `register success sets user and success flag`() = runTest {
        val user = user()
        coEvery { repo.register("a@b.com", "secret", "Alice", "en") } returns user

        vm.register("a@b.com", "secret", "Alice", "en")

        val state = vm.state.value
        assertEquals(user, state.user)
        assertTrue(state.success)
        assertFalse(state.isLoading)
    }

    @Test
    fun `register failure sets error message`() = runTest {
        coEvery { repo.register(any(), any(), any(), any()) } throws RuntimeException("Email taken")

        vm.register("a@b.com", "secret", "Alice", "en")

        assertEquals("Email taken", vm.state.value.error)
        assertFalse(vm.state.value.success)
    }

    @Test
    fun `clearError removes error from state`() = runTest {
        coEvery { repo.login(any(), any()) } throws RuntimeException("err")
        vm.login("x", "y")
        assertNotNull(vm.state.value.error)

        vm.clearError()

        assertNull(vm.state.value.error)
    }

    private fun user() = UserOut("u1", "a@b.com", "Alice", "en", "2024-01-01")
}
