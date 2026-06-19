package com.fmradio.app.data.remote

import com.fmradio.app.data.remote.dto.RadioStation
import retrofit2.http.GET
import retrofit2.http.Query

interface RadioBrowserApi {
    @GET("json/stations/search")
    suspend fun searchStations(
        @Query("name") query: String,
        @Query("limit") limit: Int = 30
    ): List<RadioStation>

    @GET("json/stations/topvote")
    suspend fun topStations(@Query("limit") limit: Int = 50): List<RadioStation>

    @GET("json/stations/bycountrycodeexact")
    suspend fun stationsByCountry(
        @Query("countrycode") countryCode: String,
        @Query("limit") limit: Int = 50
    ): List<RadioStation>

    @GET("json/stations/bytag")
    suspend fun stationsByTag(
        @Query("tag") tag: String,
        @Query("limit") limit: Int = 50
    ): List<RadioStation>
}
