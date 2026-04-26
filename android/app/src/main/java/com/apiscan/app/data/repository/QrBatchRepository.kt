package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class QrBatchRepository @Inject constructor(private val api: ApiService) {

    suspend fun list(): List<QrBatchSummary> = api.listQrBatches().items

    suspend fun get(id: String): QrBatchOut = api.getQrBatch(id)

    suspend fun create(count: Int): QrBatchOut = api.createQrBatch(QrBatchCreate(count))
}
