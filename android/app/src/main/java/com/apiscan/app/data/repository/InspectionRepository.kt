package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InspectionRepository @Inject constructor(private val api: ApiService) {

    suspend fun list(hiveId: String, page: Int = 1): PaginatedResponse<InspectionOut> =
        api.listInspections(hiveId, page)

    suspend fun create(hiveId: String, request: InspectionCreateRequest): InspectionOut =
        api.createInspection(hiveId, request)

    suspend fun update(id: String, request: InspectionCreateRequest): InspectionOut =
        api.updateInspection(id, request)

    suspend fun delete(id: String) { api.deleteInspection(id) }

    suspend fun listFieldDefinitions(): List<FieldDefinitionOut> =
        api.listFieldDefinitions()
}
