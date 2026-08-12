export interface StartUploadOptions {
  taskId?: string;
  url: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fieldName: string;
  method?: string;
  headers?: { [key: string]: string };
}

export interface UploadProgressEvent {
  taskId?: string;
  progress: number;
}

export interface UploadErrorEvent {
  taskId?: string;
  error: string;
}

export interface UploadCompleteEvent {
  taskId?: string;
  success: boolean;
}

export interface UploadCancelEvent {
  taskId?: string;
  success: boolean;
}
