package com.fmradio.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class RadioStation(
    @SerializedName("stationuuid") val stationUuid: String,
    val name: String,
    @SerializedName("url_resolved") val streamUrl: String,
    val country: String?,
    val state: String?,
    val language: String?,
    val tags: String?,
    @SerializedName("favicon") val artworkUrl: String?,
    @SerializedName("votes") val votes: Int,
    @SerializedName("bitrate") val bitrate: Int?,
    @SerializedName("codec") val codec: String?
)
