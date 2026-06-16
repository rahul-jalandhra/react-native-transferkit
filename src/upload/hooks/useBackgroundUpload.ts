import { useEffect, useRef, useState } from 'react';
import {
  startBackgroundUpload,
  cancelUpload,
  addUploadProgressListener,
  addUploadCompleteListener,
  addUploadErrorListener,
  addUploadCancelListener,
} from '../native';
import type { StartUploadOptions } from '../types/upload';

export function useBackgroundUpload() {
  const mountedRef = useRef(true);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const progressListener = addUploadProgressListener((event) => {
      if (!mountedRef.current) return;
      setProgress(event.progress || 0);
    });

    const completeListener = addUploadCompleteListener(() => {
      if (!mountedRef.current) return;
      setLoading(false);
      setCompleted(true);
    });

    const errorListener = addUploadErrorListener((event) => {
      if (!mountedRef.current) return;
      setLoading(false);
      setError(event.error);
    });

    const cancelListener = addUploadCancelListener(() => {
      if (!mountedRef.current) return;
      setLoading(false);
      setCancelled(true);
    });

    return () => {
      mountedRef.current = false;

      progressListener.remove();
      completeListener.remove();
      errorListener.remove();
      cancelListener.remove();
    };
  }, []);

  const start = (options: StartUploadOptions) => {
    setProgress(0);
    setError(null);
    setCompleted(false);
    setCancelled(false);
    setLoading(true);

    startBackgroundUpload(options);
  };

  const cancel = () => {
    cancelUpload();
  };

  return {
    progress,
    loading,
    completed,
    cancelled,
    error,
    start,
    cancel,
  };
}
