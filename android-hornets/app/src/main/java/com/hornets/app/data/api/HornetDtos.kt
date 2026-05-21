package com.hornets.app.data.api

import com.google.gson.annotations.SerializedName

// MARK: - Pagination

data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pages: Int
)

// MARK: - Stats

data class HornetStats(
    @SerializedName("total_caught")        val totalCaught: Int,
    @SerializedName("total_nests")         val totalNests: Int,
    @SerializedName("destroyed_nests")     val destroyedNests: Int,
    @SerializedName("pending_sightings")   val pendingSightings: Int,
    @SerializedName("confirmed_sightings") val confirmedSightings: Int
)

// MARK: - Catches

data class HornetCatchCreate(
    val latitude: Double?,
    val longitude: Double?,
    val count: Int,
    @SerializedName("reporter_name") val reporterName: String?
)

data class HornetCatchOut(
    val id: String,
    val count: Int,
    val latitude: Double?,
    val longitude: Double?,
    @SerializedName("created_at") val createdAt: String
)

// MARK: - Nests

data class HornetNestCreate(
    val latitude: Double,
    val longitude: Double,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?
)

data class HornetNestOut(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val status: String,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("updated_at") val updatedAt: String
)

data class HornetNestGeoJSON(
    val type: String,
    val features: List<HornetNestFeature>
)

data class HornetNestFeature(
    val type: String,
    val geometry: HornetNestGeometry,
    val properties: HornetNestProperties
)

data class HornetNestGeometry(
    val type: String,
    val coordinates: List<Double>  // [longitude, latitude]
)

data class HornetNestProperties(
    val id: String,
    val status: String,
    @SerializedName("reporter_name") val reporterName: String?,
    val notes: String?,
    @SerializedName("photo_url") val photoUrl: String?,
    @SerializedName("created_at") val createdAt: String
)

// MARK: - Sightings

data class HornetSightingCreate(
    @SerializedName("photo_url") val photoUrl: String,
    val description: String?,
    @SerializedName("reporter_name") val reporterName: String?,
    val latitude: Double?,
    val longitude: Double?
)

data class HornetSightingOut(
    val id: String,
    @SerializedName("photo_url") val photoUrl: String,
    val description: String?,
    @SerializedName("reporter_name") val reporterName: String?,
    val status: String,
    @SerializedName("yes_votes") val yesVotes: Int,
    @SerializedName("no_votes") val noVotes: Int,
    @SerializedName("created_at") val createdAt: String,
    val latitude: Double?,
    val longitude: Double?
)

data class HornetVoteRequest(val vote: String)
