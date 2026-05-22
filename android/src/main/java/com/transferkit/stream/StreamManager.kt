package com.transferkit.stream

import android.util.Log
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okio.BufferedSource
import java.io.IOException
import java.util.concurrent.TimeUnit

class StreamManager {

    private val TAG = "TransferkitStream"

    private val client = OkHttpClient.Builder()
        .retryOnConnectionFailure(true)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var currentCall: Call? = null

    @Volatile
    private var isCancelled = false

    fun startStream(
        url: String,
        method: String,
        headers: Map<String, String>,
        body: String,
        onData: (String) -> Unit,
        onComplete: () -> Unit,
        onError: (String) -> Unit,
        onCancel: () -> Unit
    ) {

        currentCall?.cancel()
        currentCall = null
        isCancelled = false

        val requestBuilder = Request.Builder().url(url)

        headers.forEach { (key, value) ->
            requestBuilder.addHeader(key, value)
        }

        if (method.uppercase() == "GET") {
            requestBuilder.get()
        } else {
            val requestBody =
                body.toRequestBody("application/json".toMediaTypeOrNull())

            requestBuilder.method(method.uppercase(), requestBody)
        }

        val request = requestBuilder.build()

        currentCall = client.newCall(request)

        currentCall?.enqueue(object : Callback {

            override fun onFailure(call: Call, e: IOException) {

                if (call.isCanceled() || isCancelled) {
                    onCancel()
                } else {
                    onError(e.toString())
                }

                currentCall = null
            }

            override fun onResponse(call: Call, response: Response) {

                if (!response.isSuccessful) {
                    onError("HTTP ${response.code}")
                    currentCall = null
                    return
                }

                val responseBody = response.body ?: run {
                    onError("Body null")
                    currentCall = null
                    return
                }

                val source: BufferedSource = responseBody.source()
                val buffer = ByteArray(1024)

                try {

                    while (true) {

                        if (isCancelled || call.isCanceled()) break

                        val bytesRead = source.read(buffer)

                        if (bytesRead == -1) break

                        if (isCancelled || call.isCanceled()) break

                        val chunk = String(buffer, 0, bytesRead)

                        onData(chunk)
                    }

                    if (isCancelled || call.isCanceled()) {
                        onCancel()
                    } else {
                        onComplete()
                    }

                } catch (e: IOException) {

                    if (call.isCanceled() || isCancelled) {
                        onCancel()
                    } else {
                        onError(e.toString())
                    }

                } finally {
                    responseBody.close()
                    currentCall = null
                }
            }
        })
    }

    fun cancelStream() {
        isCancelled = true
        currentCall?.cancel()
        currentCall = null
    }
}