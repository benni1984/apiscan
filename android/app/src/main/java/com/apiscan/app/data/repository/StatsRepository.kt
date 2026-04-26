package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StatsRepository @Inject constructor(private val api: ApiService) {

    suspend fun hiveStats(hiveId: String, preset: String? = null, from: String? = null, to: String? = null): HiveStats =
        api.hiveStats(hiveId, preset, from, to)

    suspend fun apiaryStats(apiaryId: String, preset: String? = null, from: String? = null, to: String? = null): ApiaryStats =
        api.apiaryStats(apiaryId, preset, from, to)
}
