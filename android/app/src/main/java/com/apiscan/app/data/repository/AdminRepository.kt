package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AdminRepository @Inject constructor(private val api: ApiService) {

    suspend fun getStats(preset: String): PlatformStats = api.adminStats(preset)
    suspend fun getTokenStats(): AdminTokenStats = api.adminTokenStats()

    suspend fun getUsers(page: Int, search: String?, isSupporter: Boolean?): PaginatedResponse<AdminUserOut> =
        api.adminUsers(page = page, search = search?.takeIf { it.isNotEmpty() }, isSupporter = isSupporter)

    suspend fun setSupporter(userId: String, isSupporter: Boolean): AdminUserOut =
        api.setSupporter(userId, SetSupporterRequest(isSupporter))

    suspend fun deleteUser(userId: String) { api.deleteAdminUser(userId) }
    suspend fun revokeTokens(userId: String) { api.revokeUserTokens(userId) }

    suspend fun getApiaries(page: Int): PaginatedResponse<AdminApiary> = api.adminApiaries(page = page)
    suspend fun getFlaggedApiaries(page: Int): PaginatedResponse<AdminApiary> = api.adminFlaggedApiaries(page = page)
    suspend fun setPrivate(apiaryId: String) { api.setApiaryPrivate(apiaryId, emptyMap()) }

    suspend fun getHealthSummary(): HealthSummary = api.healthSummary()
    suspend fun getInactiveUsers(page: Int): PaginatedResponse<InactiveUser> = api.inactiveUsers(page = page)
    suspend fun getNoVarroaApiaries(): List<NoVarroaApiary> = api.noVarroaApiaries()
    suspend fun getZeroInspectionHives(page: Int): PaginatedResponse<ZeroInspectionHive> = api.zeroInspectionHives(page = page)
}
