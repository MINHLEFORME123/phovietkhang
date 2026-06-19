package com.fmradio.app.data.repository

import com.fmradio.app.data.remote.RadioBrowserApi
import com.fmradio.app.data.remote.dto.RadioStation

class RadioRepository(private val api: RadioBrowserApi) {
    suspend fun searchStations(query: String, limit: Int = 30): Result<List<RadioStation>> =
        runCatching { api.searchStations(query, limit) }

    suspend fun getTopVotedStations(limit: Int = 50): Result<List<RadioStation>> =
        runCatching { api.topStations(limit) }

    suspend fun getStationsByCountry(countryCode: String, limit: Int = 50): Result<List<RadioStation>> =
        runCatching { api.stationsByCountry(countryCode, limit) }

    suspend fun getStationsByTag(tag: String, limit: Int = 50): Result<List<RadioStation>> =
        runCatching { api.stationsByTag(tag, limit) }
}
