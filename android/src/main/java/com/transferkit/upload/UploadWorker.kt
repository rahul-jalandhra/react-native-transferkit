package com.transferkit.upload

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ForegroundInfo
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okio.Buffer
import okio.ForwardingSink
import okio.buffer
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

class UploadWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result {
        val url = inputData.getString(KEY_URL) ?: return failure("Missing upload URL")
        val filePath = inputData.getString(KEY_FILE_PATH) ?: return failure("Missing file path")
        val fileName = inputData.getString(KEY_FILE_NAME) ?: "upload"
        val mimeType = inputData.getString(KEY_MIME_TYPE) ?: "application/octet-stream"
        val fieldName = inputData.getString(KEY_FIELD_NAME) ?: "file"
        val method = inputData.getString(KEY_METHOD)?.uppercase() ?: "POST"
        val headersJson = inputData.getString(KEY_HEADERS)

        val file = resolveFile(filePath, fileName)
            ?: return failure("Unable to resolve upload file")

        setForegroundAsync(createForegroundInfo(0.0, "Upload starting"))

        val headers = headersJson?.let { JSONObject(it) } ?: JSONObject()

        val requestBody = file.asRequestBody(mimeType.toMediaTypeOrNull())
        val progressBody = ProgressRequestBody(requestBody) { bytesWritten, contentLength ->
            val progress = if (contentLength <= 0) 0.0 else bytesWritten.toDouble() / contentLength.toDouble()
            val safeProgress = progress.coerceIn(0.0, 1.0)
            setProgressAsync(workDataOf(KEY_PROGRESS to safeProgress))
            updateNotification(safeProgress)
            sendBroadcast(EVENT_PROGRESS, progress = safeProgress)
        }

        val multipartBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(fieldName, fileName, progressBody)
            .build()

        val requestBuilder = Request.Builder().url(url).method(method, multipartBody)

        val keys = headers.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            requestBuilder.addHeader(key, headers.optString(key))
        }

        val request = requestBuilder.build()
        
        return try {
            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val message = "Upload failed with HTTP ${response.code}"
                    sendBroadcast(EVENT_ERROR, error = message)
                    updateNotification(1.0, "Upload failed")
                    return Result.failure()
                }

                sendBroadcast(EVENT_COMPLETE)
                updateNotification(1.0, "Upload complete")
                Result.success()
            }
        } catch (exception: Exception) {
            sendBroadcast(EVENT_ERROR, error = exception.localizedMessage ?: "Upload failed")
            updateNotification(1.0, "Upload failed")
            if (runAttemptCount > 0) {
                Result.failure()
            } else {
                Result.retry()
            }
        }
    }

    private fun failure(message: String): Result {
        sendBroadcast(EVENT_ERROR, error = message)
        updateNotification(1.0, "Upload failed")
        return Result.failure()
    }

    private fun resolveFile(filePath: String, fileName: String): File? {
        val uri = Uri.parse(filePath)
        return when (uri.scheme) {
            null, "file" -> File(uri.path ?: filePath).takeIf { it.exists() }
            "content" -> copyContentUriToFile(uri, fileName)
            else -> File(filePath).takeIf { it.exists() }
        }
    }

    private fun copyContentUriToFile(uri: Uri, fileName: String): File? {
        return try {
            val tempFile = File(applicationContext.cacheDir, "upload-${UUID.randomUUID()}-$fileName")
            applicationContext.contentResolver.openInputStream(uri)?.use { inputStream ->
                FileOutputStream(tempFile).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }
            tempFile.takeIf { it.exists() }
        } catch (exception: Exception) {
            null
        }
    }

    private fun sendBroadcast(
        event: String,
        progress: Double? = null,
        error: String? = null
    ) {
        val intent = Intent(ACTION_UPLOAD_BROADCAST).apply {
            `package` = applicationContext.packageName
            putExtra(EXTRA_EVENT, event)
            progress?.let { putExtra(EXTRA_PROGRESS, it) }
            error?.let { putExtra(EXTRA_ERROR, it) }
        }
        applicationContext.sendBroadcast(intent)
    }

    private fun createForegroundInfo(progress: Double, title: String = "Uploading file") = ForegroundInfo(
        NOTIFICATION_ID,
        createNotification(progress, title)
    )

    private fun createNotification(progress: Double, title: String) = NotificationCompat.Builder(
        applicationContext,
        CHANNEL_ID
    )
        .setContentTitle(title)
        .setContentText("Upload in progress")
        .setSmallIcon(android.R.drawable.stat_sys_upload)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .setProgress(100, (progress * 100).toInt(), false)
        .build()

    private fun updateNotification(progress: Double, title: String = "Uploading file") {
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val notification = createNotification(progress, title)
        manager.notify(NOTIFICATION_ID, notification)
    }

    override suspend fun getForegroundInfo(): ForegroundInfo {
        return createForegroundInfo(0.0)
    }

    companion object {
        const val UPLOAD_WORK_NAME = "TransferkitUploadWork"
        const val CHANNEL_ID = "transferkit_upload_channel"
        const val CHANNEL_NAME = "Upload progress"
        const val ACTION_UPLOAD_BROADCAST = "com.transferkit.upload.ACTION_UPLOAD_BROADCAST"
        const val EXTRA_EVENT = "extra_upload_event"
        const val EXTRA_PROGRESS = "extra_upload_progress"
        const val EXTRA_ERROR = "extra_upload_error"

        const val EVENT_PROGRESS = "progress"
        const val EVENT_COMPLETE = "complete"
        const val EVENT_ERROR = "error"
        const val EVENT_CANCEL = "cancel"

        const val NOTIFICATION_ID = 1
        const val KEY_URL = "key_upload_url"
        const val KEY_FILE_PATH = "key_upload_file_path"
        const val KEY_FILE_NAME = "key_upload_file_name"
        const val KEY_MIME_TYPE = "key_upload_mime_type"
        const val KEY_FIELD_NAME = "key_upload_field_name"
        const val KEY_METHOD = "key_upload_method"
        const val KEY_HEADERS = "key_upload_headers"
        const val KEY_PROGRESS = "key_upload_progress"
    }

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW)
            )
        }
    }
}

private class ProgressRequestBody(
    private val delegate: RequestBody,
    private val progressCallback: (bytesWritten: Long, contentLength: Long) -> Unit
) : RequestBody() {

    override fun contentType() = delegate.contentType()

    override fun contentLength() = delegate.contentLength()

    override fun writeTo(sink: okio.BufferedSink) {
        val countingSink = object : ForwardingSink(sink) {
            private var bytesWrittenSoFar = 0L

            override fun write(source: Buffer, byteCount: Long) {
                super.write(source, byteCount)
                bytesWrittenSoFar += byteCount
                progressCallback(bytesWrittenSoFar, contentLength())
            }
        }

        val bufferedSink = countingSink.buffer()
        delegate.writeTo(bufferedSink)
        bufferedSink.flush()
    }
}
