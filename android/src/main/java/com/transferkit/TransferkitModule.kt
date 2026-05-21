package com.transferkit

import com.facebook.react.bridge.ReactApplicationContext

class TransferkitModule(reactContext: ReactApplicationContext) :
  NativeTransferkitSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeTransferkitSpec.NAME
  }
}
