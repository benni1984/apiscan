package com.apiscan.app.data.api

import com.google.gson.annotations.SerializedName

// MARK: - Auth
data class RegisterRequest(val email: String, val password: String, val name: String, val locale: String)
data class LoginRequest(val email: String, val password: String)
data class RefreshRequest(@SerializedName("refresh_token") val refreshToken: String)
data class LogoutRequest(@SerializedName("refresh_token") val refreshToken: String)

data class TokenResponse(
    @SerializedName("access_token")  val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String,
    val user: UserOut
)
data class AccessTokenResponse(@SerializedName("access_token") val accessToken: String)

// MARK: - User
data class UserOut(
    val id: String,
    val email: String,
    val name: String,
    val locale: String,
    @SerializedName("created_at") val createdAt: String
)
data class UserUpdateRequest(val name: String?, val locale: String?)

// MARK: - Field Definitions
data class FieldDefinitionOut(
    val id: String,
    val scope: String,
    @SerializedName("apiary_id")  val apiaryId: String?,
    val target: String,
    val name: String,
    val type: String,
    val options: List<String>,
    val required: Boolean,
    @SerializedName("sort_order") val sortOrder: Int
)
data class FieldDefinitionCreate(
    val target: String, val name: String, val type: String,
    val options: List<String>, val required: Boolean,
    @SerializedName("sort_order") val sortOrder: Int
)

// MARK: - Apiaries
data class ApiaryOut(
    val id: String,
    val name: String,
    val description: String?,
    val latitude: Double?,
    val longitude: Double?,
    val address: String?,
    @SerializedName("hive_count") val hiveCount: Int,
    @SerializedName("is_public") val isPublic: Boolean = false,
    @SerializedName("created_at") val createdAt: String
)
data class ApiaryCreate(
    val name: String,
    val description: String?,
    val latitude: Double?,
    val longitude: Double?,
    val address: String?,
    @SerializedName("is_public") val isPublic: Boolean = false,
)

// MARK: - QR Batches
data class QrTokenOut(
    val token: String,
    @SerializedName("linked_hive_id") val linkedHiveId: String?
) { val isLinked get() = linkedHiveId != null }

data class QrBatchOut(
    val id: String, val count: Int,
    @SerializedName("created_at") val createdAt: String,
    val tokens: List<QrTokenOut>
)
data class QrBatchSummary(
    val id: String, val count: Int,
    @SerializedName("created_at")   val createdAt: String,
    @SerializedName("linked_count") val linkedCount: Int
)
data class QrBatchCreate(val count: Int)

// MARK: - Hives
data class HiveOut(
    val id: String,
    @SerializedName("qr_token")           val qrToken: String,
    @SerializedName("apiary_id")          val apiaryId: String,
    val name: String,
    @SerializedName("hive_type")          val hiveType: String,
    val latitude: Double?,
    val longitude: Double?,
    @SerializedName("acquisition_date")   val acquisitionDate: String?,
    val notes: String?,
    @SerializedName("custom_fields")      val customFields: Map<String, Any?>,
    @SerializedName("initialized_at")     val initializedAt: String,
    @SerializedName("last_inspection_at") val lastInspectionAt: String?,
    @SerializedName("created_at")         val createdAt: String
)
data class HiveInitializeRequest(
    @SerializedName("qr_token")          val qrToken: String,
    @SerializedName("apiary_id")         val apiaryId: String,
    val name: String,
    @SerializedName("hive_type")         val hiveType: String,
    val latitude: Double?,
    val longitude: Double?,
    @SerializedName("acquisition_date")  val acquisitionDate: String?,
    val notes: String?,
    @SerializedName("custom_fields")     val customFields: Map<String, Any?> = emptyMap()
)
data class HiveUpdateRequest(
    @SerializedName("apiary_id")        val apiaryId: String?,
    val name: String?,
    @SerializedName("hive_type")        val hiveType: String?,
    val latitude: Double?,
    val longitude: Double?,
    @SerializedName("acquisition_date") val acquisitionDate: String?,
    val notes: String?,
    @SerializedName("custom_fields")    val customFields: Map<String, Any?>?
)

sealed class QRScanResult {
    data class Linked(val hive: HiveOut) : QRScanResult()
    data class Unlinked(val token: String) : QRScanResult()
}

// MARK: - Inspections
data class InspectionOut(
    val id: String,
    @SerializedName("hive_id")             val hiveId: String,
    val date: String,
    @SerializedName("queen_seen")          val queenSeen: Boolean?,
    @SerializedName("queen_color")         val queenColor: String?,
    @SerializedName("brood_frames")        val broodFrames: Int?,
    @SerializedName("honey_frames")        val honeyFrames: Int?,
    val mood: String?,
    @SerializedName("population_strength") val populationStrength: Int?,
    @SerializedName("varroa_count")        val varroaCount: Int?,
    @SerializedName("swarm_cells_seen")    val swarmCellsSeen: Boolean?,
    @SerializedName("treatment_applied")   val treatmentApplied: String?,
    @SerializedName("feeding_done")        val feedingDone: Boolean?,
    @SerializedName("feeding_type")        val feedingType: String?,
    @SerializedName("weight_kg")           val weightKg: Double?,
    val notes: String?,
    @SerializedName("custom_fields")       val customFields: Map<String, Any?>,
    @SerializedName("created_at")          val createdAt: String
)
data class InspectionCreateRequest(
    val date: String,
    @SerializedName("queen_seen")          val queenSeen: Boolean?,
    @SerializedName("queen_color")         val queenColor: String?,
    @SerializedName("brood_frames")        val broodFrames: Int?,
    @SerializedName("honey_frames")        val honeyFrames: Int?,
    val mood: String?,
    @SerializedName("population_strength") val populationStrength: Int?,
    @SerializedName("varroa_count")        val varroaCount: Int?,
    @SerializedName("swarm_cells_seen")    val swarmCellsSeen: Boolean?,
    @SerializedName("treatment_applied")   val treatmentApplied: String?,
    @SerializedName("feeding_done")        val feedingDone: Boolean?,
    @SerializedName("feeding_type")        val feedingType: String?,
    @SerializedName("weight_kg")           val weightKg: Double?,
    val notes: String?,
    @SerializedName("custom_fields")       val customFields: Map<String, Any?> = emptyMap()
)

// MARK: - Stats
data class TrendPoint(val date: String, val value: Any?)
data class StatsPeriod(val from: String, val to: String, val preset: String)
data class HiveStats(
    @SerializedName("hive_id")                   val hiveId: String,
    val period: StatsPeriod,
    @SerializedName("inspection_count")          val inspectionCount: Int,
    @SerializedName("days_since_last_inspection") val daysSinceLastInspection: Int?,
    @SerializedName("queen_seen_rate")           val queenSeenRate: Double?,
    @SerializedName("mood_distribution")         val moodDistribution: Map<String, Int>,
    @SerializedName("swarm_cells_count")         val swarmCellsCount: Int,
    @SerializedName("varroa_trend")              val varroaTrend: List<TrendPoint>,
    @SerializedName("brood_frames_trend")        val broodFramesTrend: List<TrendPoint>,
    @SerializedName("honey_frames_trend")        val honeyFramesTrend: List<TrendPoint>,
    @SerializedName("population_strength_trend") val populationStrengthTrend: List<TrendPoint>,
    @SerializedName("weight_trend")              val weightTrend: List<TrendPoint>
)
data class ApiaryStats(
    @SerializedName("apiary_id")                val apiaryId: String,
    val period: StatsPeriod,
    @SerializedName("hive_count")               val hiveCount: Int,
    @SerializedName("inspections_total")        val inspectionsTotal: Int,
    @SerializedName("hives_inspected_last_30d") val hivesInspectedLast30d: Int,
    @SerializedName("hives_not_inspected_30d")  val hivesNotInspected30d: Int,
    @SerializedName("average_varroa")           val averageVarroa: Double?,
    @SerializedName("average_brood_frames")     val averageBroodFrames: Double?,
    @SerializedName("average_honey_frames")     val averageHoneyFrames: Double?,
    @SerializedName("mood_distribution")        val moodDistribution: Map<String, Int>,
    @SerializedName("swarm_alerts")             val swarmAlerts: Int
)

// MARK: - Pagination
data class PaginatedResponse<T>(val items: List<T>, val total: Int, val page: Int, val pages: Int)

// MARK: - Error
data class ApiError(val error: ErrorDetail) {
    data class ErrorDetail(val code: String, val message: String)
}
