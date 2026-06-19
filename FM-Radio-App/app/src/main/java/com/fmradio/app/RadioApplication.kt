package com.fmradio.app

import android.app.Application
import com.fmradio.app.di.AppContainer

class RadioApplication : Application() {
    lateinit var appContainer: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        appContainer = AppContainer(this)
    }
}
