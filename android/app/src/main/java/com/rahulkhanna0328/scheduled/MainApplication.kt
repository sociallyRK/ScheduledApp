package com.rahulkhanna0328.scheduled

import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> = emptyList()
      override fun getJSMainModuleName(): String = "index"
      override fun isNewArchEnabled(): Boolean = false
      override fun isHermesEnabled(): Boolean = true
    }

  override fun getReactNativeHost() = reactNativeHost

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
  }
}
