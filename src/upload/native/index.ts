import { eventEmitter } from '../../eventEmitter';
import Transferkit from '../../NativeTransferkit';
import type { StartUploadOptions } from '../types/upload';

function generateUUID(): string {
  return (
    'upload_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  );
}

export function startBackgroundUpload(options: StartUploadOptions): string {
  const taskId = options.taskId || generateUUID();
  const {
    url,
    filePath,
    fileName,
    mimeType,
    fieldName,
    method = 'POST',
    headers = {},
  } = options;

  Transferkit.startBackgroundUpload(
    taskId,
    url,
    filePath,
    fileName,
    mimeType,
    fieldName,
    method,
    headers
  );

  return taskId;
}

export function cancelUpload(taskId: string = '') {
  return Transferkit.cancelUpload(taskId);
}

export function addUploadProgressListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onUploadProgress', callback);
}

export function addUploadCompleteListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onUploadComplete', callback);
}

export function addUploadErrorListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onUploadError', callback);
}

export function addUploadCancelListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onUploadCancel', callback);
}
