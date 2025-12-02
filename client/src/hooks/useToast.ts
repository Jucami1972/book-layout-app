import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    title: string,
    type: ToastType = 'info',
    description?: string,
    duration: number = 4000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      type,
      title,
      description,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast(title, 'success', description, duration),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast(title, 'error', description, duration),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast(title, 'warning', description, duration),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string, duration?: number) =>
      addToast(title, 'info', description, duration),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
