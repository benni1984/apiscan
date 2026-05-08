package com.apiscan.app.data.repository

import com.apiscan.app.data.api.*
import io.mockk.*
import kotlinx.coroutines.test.runTest
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class ApiaryRepositoryTest {

    private val api = mockk<ApiService>()
    private lateinit var repo: ApiaryRepository

    @Before fun setUp()    { repo = ApiaryRepository(api) }
    @After  fun tearDown() = clearAllMocks()

    @Test
    fun `list unwraps items from paginated response`() = runTest {
        val apiaries = listOf(apiary("a1"), apiary("a2"))
        coEvery { api.listApiaries(any(), any()) } returns PaginatedResponse(apiaries, 2, 1, 1)

        val result = repo.list()

        assertEquals(apiaries, result)
    }

    @Test
    fun `get delegates to api getApiary`() = runTest {
        val a = apiary("a1")
        coEvery { api.getApiary("a1") } returns a

        val result = repo.get("a1")

        assertEquals(a, result)
    }

    @Test
    fun `create sends correct request body`() = runTest {
        val a = apiary("new")
        coEvery { api.createApiary(ApiaryCreate("Meadow", null, 48.0, 11.0, "Road 1", false)) } returns a

        val result = repo.create("Meadow", null, 48.0, 11.0, "Road 1", false)

        assertEquals(a, result)
        coVerify { api.createApiary(ApiaryCreate("Meadow", null, 48.0, 11.0, "Road 1", false)) }
    }

    @Test
    fun `update sends correct request body`() = runTest {
        val updated = apiary("a1").copy(name = "Updated")
        coEvery { api.updateApiary("a1", ApiaryCreate("Updated", null, null, null, null, false)) } returns updated

        val result = repo.update("a1", "Updated", null, null, null, null, false)

        assertEquals("Updated", result.name)
        coVerify { api.updateApiary("a1", ApiaryCreate("Updated", null, null, null, null, false)) }
    }

    @Test
    fun `delete delegates to api deleteApiary`() = runTest {
        coEvery { api.deleteApiary("a1") } returns mockk(relaxed = true)

        repo.delete("a1")

        coVerify { api.deleteApiary("a1") }
    }

    @Test
    fun `fieldDefinitions delegates to api`() = runTest {
        val defs = listOf(fieldDef("fd1"), fieldDef("fd2"))
        coEvery { api.listApiaryFieldDefinitions("a1") } returns defs

        val result = repo.fieldDefinitions("a1")

        assertEquals(defs, result)
    }

    @Test
    fun `createFieldDefinition delegates to api`() = runTest {
        val body = FieldDefinitionCreate("hive", "Custom Note", "text", emptyList(), false, 0)
        val def = fieldDef("fd1")
        coEvery { api.createApiaryFieldDefinition("a1", body) } returns def

        val result = repo.createFieldDefinition("a1", body)

        assertEquals(def, result)
    }

    private fun apiary(id: String) = ApiaryOut(
        id = id, name = "Apiary $id", description = null,
        latitude = null, longitude = null, address = null,
        hiveCount = 0, isPublic = false, createdAt = "2024-01-01"
    )

    private fun fieldDef(id: String) = FieldDefinitionOut(
        id = id, scope = "apiary", apiaryId = "a1",
        target = "hive", name = "Custom Note", type = "text",
        options = emptyList(), required = false, sortOrder = 0
    )
}
