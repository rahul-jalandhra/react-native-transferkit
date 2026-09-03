import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

// On iOS, events are emitted by the dedicated TransferkitEventEmitter native
// module (an RCTEventEmitter subclass). On Android, events are emitted via the
// global RCTDeviceEventEmitter from the main Transferkit TurboModule, so no
// native module reference is needed.
const nativeModule =
  Platform?.OS === 'android'
    ? undefined
    : NativeModules?.TransferkitEventEmitter;

export const eventEmitter = new NativeEventEmitter(nativeModule as any);
