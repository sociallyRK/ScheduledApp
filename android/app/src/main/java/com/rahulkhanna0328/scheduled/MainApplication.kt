package com.rahulkhanna0328.scheduled
import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.rahulkhanna0328.scheduled.BuildConfig

class MainApplication : Application(), ReactApplication {
  override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
    override fun getUseDeveloperSupport() = BuildConfig.DEBUG
    override fun getJSMainModuleName() = "index"
    override fun getPackages(): List<ReactPackage> = emptyList()
    override val isNewArchEnabled = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    override val isHermesEnabled = BuildConfig.IS_HERMES_ENABLED
  }
  override fun onCreate() { super.onCreate(); SoLoader.init(this, false) }
}
