import React from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { useToastContext } from '@/contexts/ToastContext';

export function Toaster() {
  const { toasts, removeToast } = useToastContext();

  return <ToastContainer toasts={toasts} onClose={removeToast} />;
}
