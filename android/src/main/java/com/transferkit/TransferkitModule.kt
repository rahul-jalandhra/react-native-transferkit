package com.transferkit

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.transferkit.stream.StreamManager

class TransferkitModule(
    private val context: ReactApplicationContext
) : NativeTransferkitSpec(context) {

    private val streamManager = StreamManager()

    override fun startStream(
        url: String,
        method: String,
        headers: ReadableMap,
        body: String
    ) {

        val headersMap = mutableMapOf<String, String>()

        val iterator = headers.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            headersMap[key] = headers.getString(key) ?: ""
        }

        streamManager.startStream(
            url = url,
            method = method,
            headers = headersMap,
            body = body,

            onData = { chunk ->
                sendEvent("onStreamData", chunk)
            },

            onComplete = {
                sendEvent("onStreamComplete", "done")
            },

            onError = { error ->
                sendEvent("onStreamError", error)
            },

            onCancel = {
                sendEvent("onStreamCancel", "cancelled")
            }
        )
    }

    override fun cancelStream() {
        streamManager.cancelStream()
    }

    private fun sendEvent(
        eventName: String,
        value: String
    ) {

        val params: WritableMap = Arguments.createMap()

        params.putString("data", value)

        context
            .getJSModule(
                DeviceEventManagerModule
                    .RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, params)
    }

    companion object {
        const val NAME = NativeTransferkitSpec.NAME
    }
}