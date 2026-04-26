package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import com.apiscan.app.data.local.TokenStore
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore
) {
    val isLoggedIn get() = tokenStore.isLoggedIn

    suspend fun register(email: String, password: String, name: String, locale: String): UserOut {
        val resp = api.register(RegisterRequest(email, password, name, locale))
        tokenStore.accessToken  = resp.accessToken
        tokenStore.refreshToken = resp.refreshToken
        return resp.user
    }

    suspend fun login(email: String, password: String): UserOut {
        val resp = api.login(LoginRequest(email, password))
        tokenStore.accessToken  = resp.accessToken
        tokenStore.refreshToken = resp.refreshToken
        return resp.user
    }

    suspend fun logout() {
        tokenStore.refreshToken?.let { runCatching { api.logout(LogoutRequest(it)) } }
        tokenStore.clear()
    }

    suspend fun getMe(): UserOut = api.getMe()

    suspend fun updateMe(name: String?, locale: String?): UserOut =
        api.updateMe(UserUpdateRequest(name, locale))
}
