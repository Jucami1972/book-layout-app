import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast, ToastType } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

function getToastStyles(type: ToastType) {
  const baseClass = 'bg-white border shadow-lg rounded-lg p-4 mb-3 animate-fade-in flex items-start gap-3';
  
  switch (type) {
    case 'success':
      return {
        class: cn(baseClass, 'border-green-200 bg-green-50'),
        icon: <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />,
        titleClass: 'text-green-900 font-semibold',
        descClass: 'text-green-700',
      };
    case 'error':
      return {
        class: cn(baseClass, 'border-red-200 bg-red-50'),
        icon: <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />,
        titleClass: 'text-red-900 font-semibold',
        descClass: 'text-red-700',
      };
    case 'warning':
      return {
        class: cn(baseClass, 'border-yellow-200 bg-yellow-50'),
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />,
        titleClass: 'text-yellow-900 font-semibold',
        descClass: 'text-yellow-700',
      };
    default:
      return {
        class: cn(baseClass, 'border-blue-200 bg-blue-50'),
        icon: <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />,
        titleClass: 'text-blue-900 font-semibold',
        descClass: 'text-blue-700',
      };
  }
}

export function ToastComponent({ toast, onClose }: ToastProps) {
  const styles = getToastStyles(toast.type);

  return (
    <div className={styles.class} role="alert">
      {styles.icon}
      <div className="flex-1 min-w-0">
        <p className={styles.titleClass}>{toast.title}</p>
        {toast.description && (
          <p className={cn('text-sm mt-1', styles.descClass)}>
            {toast.description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-2 p-1 hover:bg-white/50 rounded-md transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <ToastComponent
            key={toast.id}
            toast={toast}
            onClose={() => onClose(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
