import { useEffect, useRef, useState } from 'react';
import { startStream, cancelStream } from '../native';
import { eventEmitter } from '../../eventEmitter';

export interface SSEEvent<T = any> {
  event?: string;
  data: string;
  json?: T;
  id?: string;
  retry?: number;
}

export interface UseSSEStreamOptions {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  onEvent?: (event: SSEEvent) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

function extractTextFromJSON(json: any): string | null {
  if (json === null || json === undefined) return null;
  if (typeof json === 'string') return json;

  if (typeof json === 'object') {
    if (typeof json.token === 'string') return json.token;
    if (typeof json.content === 'string') return json.content;
    if (typeof json.text === 'string') return json.text;
    if (typeof json.message === 'string') return json.message;
    if (json.delta && typeof json.delta.content === 'string')
      return json.delta.content;

    if (Array.isArray(json.choices) && json.choices.length > 0) {
      const choice = json.choices[0];
      if (choice.delta && typeof choice.delta.content === 'string') {
        return choice.delta.content;
      }
      if (typeof choice.text === 'string') {
        return choice.text;
      }
      if (choice.message && typeof choice.message.content === 'string') {
        return choice.message.content;
      }
    }
  }

  return null;
}

export function parseSSEEventBlock(block: string): SSEEvent | null {
  if (!block || !block.trim()) return null;

  let eventType: string | undefined;
  let dataLines: string[] = [];
  let eventId: string | undefined;
  let retryVal: number | undefined;

  const lines = block.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith(':')) {
      // Comment line, ignore
      continue;
    }
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      const field = line.trim();
      if (field === 'data') dataLines.push('');
      continue;
    }

    const field = line.substring(0, colonIdx).trim();
    let value = line.substring(colonIdx + 1);
    if (value.startsWith(' ')) {
      value = value.substring(1);
    }

    switch (field) {
      case 'event':
        eventType = value;
        break;
      case 'data':
        dataLines.push(value);
        break;
      case 'id':
        eventId = value;
        break;
      case 'retry':
        const parsedRetry = parseInt(value, 10);
        if (!isNaN(parsedRetry)) retryVal = parsedRetry;
        break;
    }
  }

  const rawData = dataLines.join('\n');

  // Fallback: If block does not contain explicit "data:" prefix (e.g. raw JSON line)
  const finalData = rawData || block.trim();
  if (!finalData && !eventType && !eventId) return null;

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(finalData);
  } catch {
    // Not valid JSON, keep as raw string
  }

  return {
    event: eventType,
    data: finalData,
    json: parsedJson,
    id: eventId,
    retry: retryVal,
  };
}

export function useSSEStream(options?: UseSSEStreamOptions) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [data, setData] = useState('');
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    mountedRef.current = true;

    const dataListener = eventEmitter.addListener(
      'onStreamData',
      (evt: any) => {
        if (!mountedRef.current) return;
        const rawChunk = evt.data || '';
        const parsed = parseSSEEventBlock(rawChunk);

        if (parsed) {
          if (parsed.data === '[DONE]') {
            setLoading(false);
            return;
          }

          setEvents((prev) => [...prev, parsed]);
          setLastEvent(parsed);

          // Extract text token from JSON or use raw text
          const extractedText = parsed.json
            ? extractTextFromJSON(parsed.json)
            : null;
          const textToAppend =
            extractedText !== null ? extractedText : parsed.data;

          setData((prev) => prev + textToAppend);

          if (optionsRef.current?.onEvent) {
            optionsRef.current.onEvent(parsed);
          }
        }
      }
    );

    const errorListener = eventEmitter.addListener(
      'onStreamError',
      (evt: any) => {
        if (!mountedRef.current) return;
        setLoading(false);
        setError(evt.data);
        if (optionsRef.current?.onError) {
          optionsRef.current.onError(evt.data);
        }
      }
    );

    const completeListener = eventEmitter.addListener(
      'onStreamComplete',
      () => {
        if (!mountedRef.current) return;
        setLoading(false);
        if (optionsRef.current?.onComplete) {
          optionsRef.current.onComplete();
        }
      }
    );

    return () => {
      mountedRef.current = false;
      dataListener.remove();
      errorListener.remove();
      completeListener.remove();
    };
  }, []);

  const start = (overrideOptions?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }) => {
    const targetUrl = overrideOptions?.url || optionsRef.current?.url;
    if (!targetUrl) {
      throw new Error('useSSEStream requires a URL');
    }

    setEvents([]);
    setData('');
    setLastEvent(null);
    setError(null);
    setLoading(true);

    const headers = {
      Accept: 'text/event-stream',
      ...(optionsRef.current?.headers || {}),
      ...(overrideOptions?.headers || {}),
    };

    const method =
      overrideOptions?.method || optionsRef.current?.method || 'GET';
    const body = overrideOptions?.body || optionsRef.current?.body || '';

    startStream(targetUrl, method, headers, body);
  };

  const cancel = () => {
    setLoading(false);
    cancelStream();
  };

  return {
    events,
    data,
    lastEvent,
    loading,
    error,
    start,
    cancel,
  };
}
