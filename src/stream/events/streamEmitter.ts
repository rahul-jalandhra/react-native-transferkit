import { NativeEventEmitter, NativeModules } from 'react-native';

export const streamEmitter = new NativeEventEmitter(
  NativeModules.TransferkitEventEmitter
);
