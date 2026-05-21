package com.hornets.app.data.api

import retrofit2.http.*

interface HornetApiService {

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
    )
}
