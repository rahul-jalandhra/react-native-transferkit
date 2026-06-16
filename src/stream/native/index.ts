import Transferkit from '../../NativeTransferkit';
import { eventEmitter } from '../../eventEmitter';

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
  return eventEmitter.addListener('onStreamData', callback);
}

export function onStreamCompleteListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onStreamComplete', callback);
}

export function onStreamCancelListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onStreamCancel', callback);
}

export function onStreamErrorListener(callback: (event: any) => void) {
  return eventEmitter.addListener('onStreamError', callback);
}
