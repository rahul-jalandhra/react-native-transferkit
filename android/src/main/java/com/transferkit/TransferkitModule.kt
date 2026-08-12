package com.transferkit

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.transferkit.stream.StreamManager
import com.transferkit.upload.UploadManager

class TransferkitModule(
    private val context: ReactApplicationContext
) : NativeTransferkitSpec(context) {

    private val streamManager = StreamManager()
    private val uploadManager = UploadManager(context)

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

    override fun startBackgroundUpload(
        taskId: String,
        url: String,
        filePath: String,
        fileName: String,
        mimeType: String,
        fieldName: String,
        method: String,
        headers: ReadableMap
    ) {
        val headersMap = mutableMapOf<String, String>()
        val iterator = headers.keySetIterator()

        while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            headersMap[key] = headers.getString(key) ?: ""
        }

        uploadManager.startUpload(
            taskId = taskId,
            url = url,
            filePath = filePath,
            fileName = fileName,
            mimeType = mimeType,
            fieldName = fieldName,
            method = method,
            headers = headersMap,
            onProgress = { progress ->
                val params: WritableMap = Arguments.createMap()
                params.putString("taskId", taskId)
                params.putDouble("progress", progress)
                sendEvent("onUploadProgress", params)
            },
            onComplete = {
                sendEvent("onUploadComplete", Arguments.createMap().apply {
                    putString("taskId", taskId)
                    putBoolean("success", true)
                })
            },
            onError = { error ->
                sendEvent("onUploadError", Arguments.createMap().apply {
                    putString("taskId", taskId)
                    putString("error", error)
                })
            },
            onCancel = {
                sendEvent("onUploadCancel", Arguments.createMap().apply {
                    putString("taskId", taskId)
                    putBoolean("success", true)
                })
            }
        )
    }

    override fun cancelUpload(taskId: String) {
        uploadManager.cancelUpload(taskId)
    }

    private fun sendEvent(
        eventName: String,
        params: WritableMap
    ) {
        context
            .getJSModule(
                DeviceEventManagerModule
                    .RCTDeviceEventEmitter::class.java
            )
            .emit(eventName, params)
    }

    private fun sendEvent(
        eventName: String,
        value: String
    ) {
        val params: WritableMap = Arguments.createMap()
        params.putString("data", value)
        sendEvent(eventName, params)
    }

    companion object {
        const val NAME = NativeTransferkitSpec.NAME
    }
}