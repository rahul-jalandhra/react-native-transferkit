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
    private val progressCallbacks = java.util.concurrent.ConcurrentHashMap<String, (Double) -> Unit>()
    private val completeCallbacks = java.util.concurrent.ConcurrentHashMap<String, () -> Unit>()
    private val errorCallbacks = java.util.concurrent.ConcurrentHashMap<String, (String) -> Unit>()
    private val cancelCallbacks = java.util.concurrent.ConcurrentHashMap<String, () -> Unit>()

    fun startUpload(
        taskId: String,
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
        if (taskId.isNotEmpty()) {
            progressCallbacks[taskId] = onProgress
            completeCallbacks[taskId] = onComplete
            errorCallbacks[taskId] = onError
            cancelCallbacks[taskId] = onCancel
        }

        registerReceiver()

        val headersJson = JSONObject().apply {
            headers.forEach { (key, value) -> put(key, value) }
        }

        val inputData = androidx.work.Data.Builder()
            .putString(UploadWorker.KEY_TASK_ID, taskId)
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

        val workName = if (taskId.isNotEmpty()) "${UploadWorker.UPLOAD_WORK_NAME}_$taskId" else UploadWorker.UPLOAD_WORK_NAME

        workManager.enqueueUniqueWork(
            workName,
            ExistingWorkPolicy.REPLACE,
            request
        )
    }

    fun cancelUpload(taskId: String) {
        if (taskId.isNotEmpty()) {
            val workName = "${UploadWorker.UPLOAD_WORK_NAME}_$taskId"
            workManager.cancelUniqueWork(workName)
            cancelCallbacks[taskId]?.invoke()
            removeCallbacks(taskId)
        } else {
            workManager.cancelUniqueWork(UploadWorker.UPLOAD_WORK_NAME)
            unregisterReceiver()
        }
    }

    private fun removeCallbacks(taskId: String) {
        progressCallbacks.remove(taskId)
        completeCallbacks.remove(taskId)
        errorCallbacks.remove(taskId)
        cancelCallbacks.remove(taskId)
        if (progressCallbacks.isEmpty() && completeCallbacks.isEmpty() && errorCallbacks.isEmpty() && cancelCallbacks.isEmpty()) {
            unregisterReceiver()
        }
    }

    private fun registerReceiver() {
        if (uploadReceiver != null) {
            return
        }

        uploadReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                val event = intent.getStringExtra(UploadWorker.EXTRA_EVENT) ?: return
                val taskId = intent.getStringExtra(UploadWorker.EXTRA_TASK_ID) ?: ""
                when (event) {
                    UploadWorker.EVENT_PROGRESS -> {
                        val progress = intent.getDoubleExtra(UploadWorker.EXTRA_PROGRESS, 0.0)
                        if (taskId.isNotEmpty()) {
                            progressCallbacks[taskId]?.invoke(progress)
                        } else {
                            progressCallbacks.values.forEach { it.invoke(progress) }
                        }
                    }
                    UploadWorker.EVENT_COMPLETE -> {
                        if (taskId.isNotEmpty()) {
                            completeCallbacks[taskId]?.invoke()
                            removeCallbacks(taskId)
                        } else {
                            completeCallbacks.values.forEach { it.invoke() }
                            unregisterReceiver()
                        }
                    }
                    UploadWorker.EVENT_ERROR -> {
                        val error = intent.getStringExtra(UploadWorker.EXTRA_ERROR) ?: "Unknown upload error"
                        if (taskId.isNotEmpty()) {
                            errorCallbacks[taskId]?.invoke(error)
                            removeCallbacks(taskId)
                        } else {
                            errorCallbacks.values.forEach { it.invoke(error) }
                            unregisterReceiver()
                        }
                    }
                    UploadWorker.EVENT_CANCEL -> {
                        if (taskId.isNotEmpty()) {
                            cancelCallbacks[taskId]?.invoke()
                            removeCallbacks(taskId)
                        } else {
                            cancelCallbacks.values.forEach { it.invoke() }
                            unregisterReceiver()
                        }
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

