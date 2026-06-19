package com.fmradio.app.data.remote

import okhttp3.Interceptor
import okhttp3.Response

class RadioBrowserInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("Accept", "application/json")
            .addHeader("User-Agent", "FM-Radio-App/1.0")
            .build()
        return chain.proceed(request)
    }
}
