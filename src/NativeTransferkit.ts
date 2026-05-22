import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  startStream(
    url: string,
    method: string,
    headers: { [key: string]: string },
    body: string
  ): void;

  cancelStream(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Transferkit');
