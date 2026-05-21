package com.apiscan.app.data.api

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // Auth (no auth header needed)
    @POST("auth/register")
    suspend fun register(@Body body: RegisterRequest): TokenResponse

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): TokenResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AccessTokenResponse

    @POST("auth/logout")
    suspend fun logout(@Body body: LogoutRequest): Response<Unit>

    // Users
    @GET("users/me")
    suspend fun getMe(): UserOut

    @PUT("users/me")
    suspend fun updateMe(@Body body: UserUpdateRequest): UserOut

    // Field Definitions
    @GET("field-definitions")
    suspend fun listFieldDefinitions(): List<FieldDefinitionOut>

    @POST("field-definitions")
    suspend fun createFieldDefinition(@Body body: FieldDefinitionCreate): FieldDefinitionOut

    @DELETE("field-definitions/{id}")
    suspend fun deleteFieldDefinition(@Path("id") id: String): Response<Unit>

    @GET("apiaries/{apiaryId}/field-definitions")
    suspend fun listApiaryFieldDefinitions(@Path("apiaryId") apiaryId: String): List<FieldDefinitionOut>

    @POST("apiaries/{apiaryId}/field-definitions")
    suspend fun createApiaryFieldDefinition(
        @Path("apiaryId") apiaryId: String,
        @Body body: FieldDefinitionCreate
    ): FieldDefinitionOut

    // Apiaries
    @GET("apiaries")
    suspend fun listApiaries(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 50
    ): PaginatedResponse<ApiaryOut>

    @GET("apiaries/{id}")
    suspend fun getApiary(@Path("id") id: String): ApiaryOut

    @POST("apiaries")
    suspend fun createApiary(@Body body: ApiaryCreate): ApiaryOut

    @PUT("apiaries/{id}")
    suspend fun updateApiary(@Path("id") id: String, @Body body: ApiaryCreate): ApiaryOut

    @DELETE("apiaries/{id}")
    suspend fun deleteApiary(@Path("id") id: String): Response<Unit>

    // QR Batches
    @GET("qr-batches")
    suspend fun listQrBatches(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<QrBatchSummary>

    @GET("qr-batches/{id}")
    suspend fun getQrBatch(@Path("id") id: String): QrBatchOut

    @POST("qr-batches")
    suspend fun createQrBatch(@Body body: QrBatchCreate): QrBatchOut

    // Hives
    @GET("hives/by-qr/{token}")
    suspend fun resolveQR(@Path("token") token: String): ResponseBody

    @GET("apiaries/{apiaryId}/hives")
    suspend fun listHives(
        @Path("apiaryId") apiaryId: String,
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 50
    ): PaginatedResponse<HiveOut>

    @POST("hives/initialize")
    suspend fun initializeHive(@Body body: HiveInitializeRequest): HiveOut

    @GET("hives/{id}")
    suspend fun getHive(@Path("id") id: String): HiveOut

    @PUT("hives/{id}")
    suspend fun updateHive(@Path("id") id: String, @Body body: HiveUpdateRequest): HiveOut

    @DELETE("hives/{id}")
    suspend fun deleteHive(@Path("id") id: String): Response<Unit>

    // Inspections
    @GET("hives/{hiveId}/inspections")
    suspend fun listInspections(
        @Path("hiveId") hiveId: String,
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<InspectionOut>

    @POST("hives/{hiveId}/inspections")
    suspend fun createInspection(
        @Path("hiveId") hiveId: String,
        @Body body: InspectionCreateRequest
    ): InspectionOut

    @PUT("inspections/{id}")
    suspend fun updateInspection(@Path("id") id: String, @Body body: InspectionCreateRequest): InspectionOut

    @DELETE("inspections/{id}")
    suspend fun deleteInspection(@Path("id") id: String): Response<Unit>

    // Export
    @Streaming
    @GET("hives/{hiveId}/inspections/export")
    suspend fun exportHiveInspections(
        @Path("hiveId") hiveId: String,
        @Query("format") format: String
    ): ResponseBody

    @Streaming
    @GET("apiaries/{apiaryId}/inspections/export")
    suspend fun exportApiaryInspections(
        @Path("apiaryId") apiaryId: String,
        @Query("format") format: String
    ): ResponseBody

    // Admin
    @GET("admin/stats")
    suspend fun adminStats(@Query("preset") preset: String): PlatformStats

    @GET("admin/tokens/stats")
    suspend fun adminTokenStats(): AdminTokenStats

    @GET("admin/users")
    suspend fun adminUsers(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20,
        @Query("search") search: String?,
        @Query("is_supporter") isSupporter: Boolean?
    ): PaginatedResponse<AdminUserOut>

    @PUT("admin/users/{userId}/supporter")
    suspend fun setSupporter(@Path("userId") userId: String, @Body body: SetSupporterRequest): AdminUserOut

    @DELETE("admin/users/{userId}")
    suspend fun deleteAdminUser(@Path("userId") userId: String): Response<Unit>

    @DELETE("admin/users/{userId}/tokens")
    suspend fun revokeUserTokens(@Path("userId") userId: String): Response<Unit>

    @GET("admin/apiaries")
    suspend fun adminApiaries(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<AdminApiary>

    @GET("admin/apiaries/flagged")
    suspend fun adminFlaggedApiaries(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<AdminApiary>

    @PUT("admin/apiaries/{apiaryId}/set-private")
    suspend fun setApiaryPrivate(@Path("apiaryId") apiaryId: String, @Body body: Map<String, Any>): AdminApiary

    @GET("admin/health/summary")
    suspend fun healthSummary(): HealthSummary

    @GET("admin/health/inactive-users")
    suspend fun inactiveUsers(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<InactiveUser>

    @GET("admin/health/no-varroa-inspections")
    suspend fun noVarroaApiaries(): List<NoVarroaApiary>

    @GET("admin/health/zero-inspection-hives")
    suspend fun zeroInspectionHives(
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 20
    ): PaginatedResponse<ZeroInspectionHive>

    // Hornets (public — no auth required, but auth header is forwarded if present)
    @GET("hornets/stats")
    suspend fun hornetStats(): HornetStats

    @POST("hornets/catches")
    suspend fun submitHornetCatch(@Body body: HornetCatchCreate): HornetCatchOut

    @GET("hornets/nests")
    suspend fun hornetNests(): HornetNestGeoJSON

    @POST("hornets/nests")
    suspend fun submitHornetNest(@Body body: HornetNestCreate): HornetNestOut

    @GET("hornets/sightings")
    suspend fun hornetSightings(
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 12
    ): PaginatedResponse<HornetSightingOut>

    @POST("hornets/sightings")
    suspend fun submitHornetSighting(@Body body: HornetSightingCreate): HornetSightingOut

    @POST("hornets/sightings/{id}/vote")
    suspend fun voteOnSighting(
        @Path("id") id: String,
        @Body body: HornetVoteRequest
    ): Response<Unit>

    // Stats
    @GET("hives/{id}/stats")
    suspend fun hiveStats(
        @Path("id") id: String,
        @Query("preset") preset: String? = null,
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): HiveStats

    @GET("apiaries/{id}/stats")
    suspend fun apiaryStats(
        @Path("id") id: String,
        @Query("preset") preset: String? = null,
        @Query("from") from: String? = null,
        @Query("to") to: String? = null
    ): ApiaryStats
}
