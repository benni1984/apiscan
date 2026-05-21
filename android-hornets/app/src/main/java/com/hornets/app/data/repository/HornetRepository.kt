package com.hornets.app.data.repository

import com.hornets.app.data.api.*

class HornetRepository(private val api: HornetApiService) {

    suspend fun getStats(): HornetStats = api.hornetStats()

    suspend fun submitCatch(
        count: Int,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null
    ): HornetCatchOut = api.submitHornetCatch(
        HornetCatchCreate(latitude, longitude, count, reporterName)
    )

    suspend fun getNests(): HornetNestGeoJSON = api.hornetNests()

    suspend fun submitNest(
        latitude: Double,
        longitude: Double,
        notes: String? = null,
        photoUrl: String? = null,
        reporterName: String? = null
    ): HornetNestOut = api.submitHornetNest(
        HornetNestCreate(latitude, longitude, reporterName, notes, photoUrl)
    )

    suspend fun getSightings(page: Int = 1): PaginatedResponse<HornetSightingOut> =
        api.hornetSightings(page = page)

    suspend fun submitSighting(
        photoUrl: String,
        description: String? = null,
        latitude: Double? = null,
        longitude: Double? = null,
        reporterName: String? = null
    ): HornetSightingOut = api.submitHornetSighting(
        HornetSightingCreate(photoUrl, description, reporterName, latitude, longitude)
    )

    suspend fun vote(sightingId: String, vote: String) {
        api.voteOnSighting(sightingId, HornetVoteRequest(vote))
    }
}
