import { useState, useRef, useCallback } from 'react';
import type { StreamEvent } from '../types';

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000';

interface StreamState {
  content: string;
  isDone: boolean;
  isStreaming: boolean;
  reviewId: string | null;
  error: string | null;
}

interface UseReviewStreamReturn extends StreamState {
  start: (prUrl: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: StreamState = {
  content: '',
  isDone: false,
  isStreaming: false,
  reviewId: null,
  error: null,
};

export function useReviewStream(): UseReviewStreamReturn {
  const [state, setState] = useState<StreamState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  const start = useCallback(async (prUrl: string): Promise<void> => {
    // Cancel any in-flight stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ ...INITIAL_STATE, isStreaming: true });

    // Get access token from store (read directly — avoids circular import)
    const raw = localStorage.getItem('auth-store');
    const accessToken = raw
      ? (JSON.parse(raw) as { state?: { accessToken?: string } })?.state
          ?.accessToken
      : null;

    try {
      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ pr_url: prUrl }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(
          json?.error?.message ?? `Request failed with status ${res.status}`,
        );
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(raw) as StreamEvent;
          } catch {
            continue;
          }

          if ('error' in event && event.error) {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error: event.error as string,
            }));
            return;
          }

          if ('done' in event && event.done) {
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              isDone: true,
              reviewId: event.review_id ?? null,
            }));
            return;
          }

          if ('token' in event && event.token) {
            setState((prev) => ({
              ...prev,
              content: prev.content + event.token,
            }));
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        error: err instanceof Error ? err.message : 'Stream failed',
      }));
    }
  }, []);

  return { ...state, start, reset };
}
