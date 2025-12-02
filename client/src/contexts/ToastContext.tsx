import React, { createContext, useContext, ReactNode } from 'react';
import { useToast as useToastHook } from '@/hooks/useToast';
import { Toast } from '@/hooks/useToast';

interface ToastContextType {
  toasts: Toast[];
  addToast: (title: string, type: 'success' | 'error' | 'info' | 'warning', description?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string, duration?: number) => string;
  error: (title: string, description?: string, duration?: number) => string;
  warning: (title: string, description?: string, duration?: number) => string;
  info: (title: string, description?: string, duration?: number) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToastHook();

  return (
    <ToastContext.Provider value={toast}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
}
