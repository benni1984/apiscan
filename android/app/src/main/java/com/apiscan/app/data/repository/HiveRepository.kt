package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import com.google.gson.JsonParser
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class HiveRepository @Inject constructor(private val api: ApiService) {

    suspend fun listForApiary(apiaryId: String): List<HiveOut> =
        api.listHives(apiaryId).items

    suspend fun get(id: String): HiveOut = api.getHive(id)

    suspend fun initialize(request: HiveInitializeRequest): HiveOut =
        api.initializeHive(request)

    suspend fun update(id: String, request: HiveUpdateRequest): HiveOut =
        api.updateHive(id, request)

    suspend fun delete(id: String) { api.deleteHive(id) }

    suspend fun resolveQR(token: String): QRScanResult {
        val body = api.resolveQR(token).string()
        val json = JsonParser.parseString(body).asJsonObject
        return if (json.has("status") && json["status"].asString == "unlinked") {
            QRScanResult.Unlinked(json["token"].asString)
        } else {
            val hive = com.google.gson.Gson().fromJson(json, HiveOut::class.java)
            QRScanResult.Linked(hive)
        }
    }
}
