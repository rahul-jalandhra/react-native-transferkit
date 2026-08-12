import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startStream(
    url: string,
    method: string,
    headers: { [key: string]: string },
    body: string
  ): void;

  cancelStream(): void;

  startBackgroundUpload(
    taskId: string,
    url: string,
    filePath: string,
    fileName: string,
    mimeType: string,
    fieldName: string,
    method: string,
    headers: { [key: string]: string }
  ): void;

  cancelUpload(taskId: string): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Transferkit');
