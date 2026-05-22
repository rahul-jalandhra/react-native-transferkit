import { useEffect, useRef, useState } from 'react';

import { startStream, cancelStream } from '../native';

import { streamEmitter } from '../events/streamEmitter';

export function useTransferStream() {
  const [data, setData] = useState('');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const dataListener = streamEmitter.addListener(
      'onStreamData',
      (event: any) => {
        if (!mountedRef.current) return;

        setData((prev) => prev + (event.data || ''));
      }
    );

    const errorListener = streamEmitter.addListener(
      'onStreamError',
      (event: any) => {
        if (!mountedRef.current) return;

        setLoading(false);

        setError(event.data);
      }
    );

    const completeListener = streamEmitter.addListener(
      'onStreamComplete',
      () => {
        if (!mountedRef.current) return;

        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;

      dataListener.remove();
      errorListener.remove();
      completeListener.remove();
    };
  }, []);

  const start = ({
    url,
    method,
    headers,
    body,
  }: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string;
  }) => {
    setData('');
    setError(null);
    setLoading(true);

    startStream(url, method, headers || {}, body || '');
  };

  const cancel = () => {
    setLoading(false);

    cancelStream();
  };

  return {
    data,
    loading,
    error,
    start,
    cancel,
  };
}
