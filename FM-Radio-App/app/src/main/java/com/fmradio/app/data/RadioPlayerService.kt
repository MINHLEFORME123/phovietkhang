package com.fmradio.app.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player

class RadioPlayerService(private val context: Context) {
    private var exoPlayer: ExoPlayer? = null
    var currentStation: RadioStation? = null
        private set
    var playerState: PlayerState = PlayerState.IDLE
        private set
    var onStateChanged: ((PlayerState) -> Unit)? = null
    var onError: ((String) -> Unit)? = null

    enum class PlayerState { IDLE, LOADING, PLAYING, ERROR }

    fun initPlayer() {
        if (exoPlayer == null) {
            exoPlayer = ExoPlayer.Builder(context.applicationContext).build().apply {
                addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(playbackState: Int) {
                        when (playbackState) {
                            Player.STATE_IDLE -> updateState(PlayerState.IDLE)
                            Player.STATE_BUFFERING -> updateState(PlayerState.LOADING)
                            Player.STATE_READY -> updateState(PlayerState.PLAYING)
                            Player.STATE_ENDED -> updateState(PlayerState.IDLE)
                        }
                    }

                    override fun onPlayerError(error: com.google.android.exoplayer2.PlaybackException) {
                        updateState(PlayerState.ERROR)
                        onError?.invoke(error.message.orEmpty())
                    }
                })
            }
        }
    }

    fun playStation(station: RadioStation) {
        if (!isNetworkAvailable()) {
            onError?.invoke("No internet connection")
            return
        }
        currentStation = station
        initPlayer()
        updateState(PlayerState.LOADING)
        val mediaItem = MediaItem.Builder()
            .setUri(station.streamUrl)
            .setMediaId(station.stationUuid)
            .build()
        exoPlayer?.setMediaItem(mediaItem)
        exoPlayer?.prepare()
        exoPlayer?.play()
    }

    fun stopPlayback() {
        exoPlayer?.stop()
        exoPlayer?.release()
        exoPlayer = null
        currentStation = null
        updateState(PlayerState.IDLE)
    }

    fun pause() {
        exoPlayer?.pause()
        updateState(PlayerState.LOADING)
    }

    fun resume() {
        exoPlayer?.play()
    }

    fun isPlaying(): Boolean = exoPlayer?.isPlaying ?: false

    private fun updateState(state: PlayerState) {
        playerState = state
        onStateChanged?.invoke(state)
        Log.d("RadioPlayer", "State: $state")
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
    }
}
