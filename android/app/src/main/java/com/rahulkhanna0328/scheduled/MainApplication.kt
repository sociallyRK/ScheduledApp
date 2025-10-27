package com.rahulkhanna0328.scheduled
import android.app.Application
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.soloader.SoLoader
import com.facebook.react.defaults.DefaultReactNativeHost
import com.rahulkhanna0328.scheduled.BuildConfig
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage

class MainApplication : Application(), ReactApplication {
  private val host = object : DefaultReactNativeHost(this) {
    override fun getUseDeveloperSupport() = BuildConfig.DEBUG
    override fun getPackages(): List<ReactPackage> = listOf(AsyncStoragePackage())
    override fun getJSMainModuleName() = "index"
    override val isNewArchEnabled = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    override val isHermesEnabled = BuildConfig.IS_HERMES_ENABLED
  }
  override val reactNativeHost: ReactNativeHost get() = host
  override fun onCreate() { super.onCreate(); SoLoader.init(this, false) }
}
