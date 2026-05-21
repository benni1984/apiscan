package com.hornets.app.di

import com.hornets.app.data.api.HornetApiService
import com.hornets.app.data.repository.HornetRepository
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object AppModule {

    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl("http://10.0.2.2:8000/api/v1/")
            .client(OkHttpClient.Builder().build())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val apiService: HornetApiService by lazy {
        retrofit.create(HornetApiService::class.java)
    }

    val repository: HornetRepository by lazy {
        HornetRepository(apiService)
    }
}
