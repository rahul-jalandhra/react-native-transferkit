import { NativeEventEmitter, NativeModules } from 'react-native';
import Transferkit from '../../NativeTransferkit';

const emitter = new NativeEventEmitter(NativeModules.TransferkitEventEmitter);

export function startStream(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string
) {
  return Transferkit.startStream(url, method, headers, body);
}

export function cancelStream() {
  return Transferkit.cancelStream();
}

export function onStreamDataListener(callback: (event: any) => void) {
  return emitter.addListener('onStreamData', callback);
}

export function onStreamCompleteListener(callback: (event: any) => void) {
  return emitter.addListener('onStreamComplete', callback);
}

export function onStreamCancelListener(callback: (event: any) => void) {
  return emitter.addListener('onStreamCancel', callback);
}

export function onStreamErrorListener(callback: (event: any) => void) {
  return emitter.addListener('onStreamError', callback);
}
