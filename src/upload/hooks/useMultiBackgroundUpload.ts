import { useEffect, useMemo, useRef, useState } from 'react';
import {
  startBackgroundUpload,
  cancelUpload,
  addUploadProgressListener,
  addUploadCompleteListener,
  addUploadErrorListener,
  addUploadCancelListener,
} from '../native';
import type { StartUploadOptions } from '../types/upload';

export interface MultiUploadItem extends StartUploadOptions {
  taskId: string;
  progress: number;
  loading: boolean;
  completed: boolean;
  cancelled: boolean;
  error: string | null;
}

export function useMultiBackgroundUpload() {
  const mountedRef = useRef(true);
  const [uploadsMap, setUploadsMap] = useState<Record<string, MultiUploadItem>>(
    {}
  );

  useEffect(() => {
    mountedRef.current = true;

    const progressListener = addUploadProgressListener((event) => {
      if (!mountedRef.current) return;
      setUploadsMap((prev) => {
        const taskId =
          event?.taskId ||
          (Object.keys(prev).length === 1 ? Object.keys(prev)[0] : null);
        if (!taskId || !prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            progress: event.progress || 0,
          },
        };
      });
    });

    const completeListener = addUploadCompleteListener((event) => {
      if (!mountedRef.current) return;
      setUploadsMap((prev) => {
        const taskId =
          event?.taskId ||
          (Object.keys(prev).length === 1 ? Object.keys(prev)[0] : null);
        if (!taskId || !prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            loading: false,
            completed: true,
            progress: 1,
          },
        };
      });
    });

    const errorListener = addUploadErrorListener((event) => {
      if (!mountedRef.current) return;
      setUploadsMap((prev) => {
        const taskId =
          event?.taskId ||
          (Object.keys(prev).length === 1 ? Object.keys(prev)[0] : null);
        if (!taskId || !prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            loading: false,
            error: event?.error || 'Upload failed',
          },
        };
      });
    });

    const cancelListener = addUploadCancelListener((event) => {
      if (!mountedRef.current) return;
      setUploadsMap((prev) => {
        const taskId =
          event?.taskId ||
          (Object.keys(prev).length === 1 ? Object.keys(prev)[0] : null);
        if (!taskId || !prev[taskId]) return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            loading: false,
            cancelled: true,
          },
        };
      });
    });

    return () => {
      mountedRef.current = false;
      progressListener.remove();
      completeListener.remove();
      errorListener.remove();
      cancelListener.remove();
    };
  }, []);

  const startUploads = (optionsList: StartUploadOptions[]) => {
    const newItems: Record<string, MultiUploadItem> = {};

    optionsList.forEach((opts) => {
      const taskId = startBackgroundUpload(opts);
      newItems[taskId] = {
        ...opts,
        taskId,
        progress: 0,
        loading: true,
        completed: false,
        cancelled: false,
        error: null,
      };
    });

    setUploadsMap((prev) => ({
      ...prev,
      ...newItems,
    }));
  };

  const cancelSingleUpload = (taskId: string) => {
    cancelUpload(taskId);
    setUploadsMap((prev) => {
      if (!prev[taskId]) return prev;
      return {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          loading: false,
          cancelled: true,
        },
      };
    });
  };

  const cancelAll = () => {
    setUploadsMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((taskId) => {
        const item = next[taskId];
        if (item && item.loading) {
          cancelUpload(taskId);
          next[taskId] = {
            ...item,
            loading: false,
            cancelled: true,
          };
        }
      });
      return next;
    });
  };

  const uploadList = useMemo(() => {
    return Object.values(uploadsMap);
  }, [uploadsMap]);

  return {
    uploadList,
    uploadMap: uploadsMap,
    startUploads,
    cancelSingleUpload,
    cancelAll,
  };
}
