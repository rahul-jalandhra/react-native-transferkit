package com.transferkit.upload

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import org.json.JSONObject

class UploadManager(private val context: Context) {

    private val workManager = WorkManager.getInstance(context)
    private var uploadReceiver: BroadcastReceiver? = null
    private var progressCallback: ((Double) -> Unit)? = null
    private var completeCallback: (() -> Unit)? = null
    private var errorCallback: ((String) -> Unit)? = null
    private var cancelCallback: (() -> Unit)? = null

    fun startUpload(
        url: String,
        filePath: String,
        fileName: String,
        mimeType: String,
        fieldName: String,
        method: String,
        headers: Map<String, String>,
        onProgress: (Double) -> Unit,
        onComplete: () -> Unit,
        onError: (String) -> Unit,
        onCancel: () -> Unit
    ) {
        this.progressCallback = onProgress
        this.completeCallback = onComplete
        this.errorCallback = onError
        this.cancelCallback = onCancel

        registerReceiver()

        val headersJson = JSONObject().apply {
            headers.forEach { (key, value) -> put(key, value) }
        }

        val inputData = androidx.work.Data.Builder()
            .putString(UploadWorker.KEY_URL, url)
            .putString(UploadWorker.KEY_FILE_PATH, filePath)
            .putString(UploadWorker.KEY_FILE_NAME, fileName)
            .putString(UploadWorker.KEY_MIME_TYPE, mimeType)
            .putString(UploadWorker.KEY_FIELD_NAME, fieldName)
            .putString(UploadWorker.KEY_METHOD, method)
            .putString(UploadWorker.KEY_HEADERS, headersJson.toString())
            .build()

        val request = OneTimeWorkRequestBuilder<UploadWorker>()
            .setInputData(inputData)
            .build()

        workManager.enqueueUniqueWork(
            UploadWorker.UPLOAD_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            request
        )
    }

    fun cancelUpload() {
        workManager.cancelUniqueWork(UploadWorker.UPLOAD_WORK_NAME)
        unregisterReceiver()
    }

    private fun registerReceiver() {
        if (uploadReceiver != null) {
            return
        }

        uploadReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val event = intent.getStringExtra(UploadWorker.EXTRA_EVENT) ?: return
                when (event) {
                    UploadWorker.EVENT_PROGRESS -> {
                        val progress = intent.getDoubleExtra(UploadWorker.EXTRA_PROGRESS, 0.0)
                        progressCallback?.invoke(progress)
                    }
                    UploadWorker.EVENT_COMPLETE -> {
                        completeCallback?.invoke()
                        unregisterReceiver()
                    }
                    UploadWorker.EVENT_ERROR -> {
                        val error = intent.getStringExtra(UploadWorker.EXTRA_ERROR) ?: "Unknown upload error"
                        errorCallback?.invoke(error)
                        unregisterReceiver()
                    }
                    UploadWorker.EVENT_CANCEL -> {
                        cancelCallback?.invoke()
                        unregisterReceiver()
                    }
                }
            }
        }

        context.registerReceiver(
            uploadReceiver,
            IntentFilter(UploadWorker.ACTION_UPLOAD_BROADCAST)
        )
    }

    private fun unregisterReceiver() {
        uploadReceiver?.let {
            try {
                context.unregisterReceiver(it)
            } catch (_: IllegalArgumentException) {
            }
            uploadReceiver = null
        }
    }
}

