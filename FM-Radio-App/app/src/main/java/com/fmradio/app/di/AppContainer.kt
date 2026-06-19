package com.fmradio.app.di

import android.content.Context
import com.fmradio.app.data.RadioPlayerService
import com.fmradio.app.data.remote.RadioBrowserApi
import com.fmradio.app.data.remote.RadioBrowserInterceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AppContainer(private val context: Context) {
    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(RadioBrowserInterceptor())
            .build()
    }

    private val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl("https://de1.api.radio-browser.info/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val radioBrowserApi: RadioBrowserApi by lazy {
        retrofit.create(RadioBrowserApi::class.java)
    }

    val radioPlayerService: RadioPlayerService by lazy {
        RadioPlayerService(context)
    }
}
