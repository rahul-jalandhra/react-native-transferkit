import { eventEmitter } from '../../eventEmitter';
import Transferkit from '../../NativeTransferkit';

import type { StartUploadOptions } from '../types/upload';

export function startBackgroundUpload({
  url,
  filePath,
  fileName,
  mimeType,
  fieldName,
  method = 'POST',
  headers = {},
}: StartUploadOptions) {
  return Transferkit.startBackgroundUpload(
    url,
    filePath,
    fileName,
    mimeType,
    fieldName,
    method,
    headers
  );
}

export function cancelUpload() {
  return Transferkit.cancelUpload();
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
