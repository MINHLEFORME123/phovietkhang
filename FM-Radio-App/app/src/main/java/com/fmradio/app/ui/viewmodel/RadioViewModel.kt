package com.fmradio.app.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fmradio.app.data.RadioPlayerService
import com.fmradio.app.data.remote.dto.RadioStation
import com.fmradio.app.data.repository.RadioRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class RadioViewModel(
    private val repository: RadioRepository,
    private val playerService: RadioPlayerService
) : ViewModel() {

    private val _uiState = MutableStateFlow(RadioUiState())
    val uiState: StateFlow<RadioUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            playerService.onStateChanged.collect { state ->
                _uiState.value = _uiState.value.copy(playerState = state)
            }
        }
        viewModelScope.launch {
            playerService.onError.collect { message ->
                _uiState.value = _uiState.value.copy(error = message)
            }
        }
        loadTopStations()
    }

    fun loadTopStations() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            repository.getTopVotedStations()
                .onSuccess { stations ->
                    _uiState.value = _uiState.value.copy(
                        stations = stations,
                        isLoading = false
                    )
                }
                .onFailure { throwable ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = throwable.message ?: "Unknown error"
                    )
                }
        }
    }

    fun searchStations(query: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null, query = query)
            repository.searchStations(query)
                .onSuccess { stations ->
                    _uiState.value = _uiState.value.copy(
                        stations = stations,
                        isLoading = false
                    )
                }
                .onFailure { throwable ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = throwable.message ?: "Search failed"
                    )
                }
        }
    }

    fun playStation(station: RadioStation) {
        playerService.playStation(station)
        _uiState.value = _uiState.value.copy(currentStation = station)
    }

    fun pausePlayback() {
        playerService.pause()
    }

    fun resumePlayback() {
        playerService.resume()
    }

    fun stopPlayback() {
        playerService.stopPlayback()
        _uiState.value = _uiState.value.copy(currentStation = null)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    override fun onCleared() {
        super.onCleared()
        playerService.release()
    }
}

data class RadioUiState(
    val stations: List<RadioStation> = emptyList(),
    val currentStation: RadioStation? = null,
    val playerState: RadioPlayerService.PlayerState = RadioPlayerService.PlayerState.IDLE,
    val query: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)
