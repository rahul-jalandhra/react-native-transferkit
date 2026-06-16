export interface StartUploadOptions {
  url: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fieldName: string;
  method?: string;
  headers?: { [key: string]: string };
}

export interface UploadProgressEvent {
  progress: number;
}

export interface UploadErrorEvent {
  error: string;
}
