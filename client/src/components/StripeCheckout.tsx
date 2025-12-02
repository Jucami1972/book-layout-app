/**
 * Stripe Checkout Component - Premium Edition
 * Features: Better UX, loading animations, error handling, accessibility
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Loader2, CheckCircle } from 'lucide-react';

interface StripeCheckoutProps {
  planType: 'PRO_MONTHLY' | 'PRO_YEARLY';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ planType, onSuccess, onError }: StripeCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { mutate: createCheckout, isPending } = trpc.payment.createCheckoutSession.useMutation();
  const [, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Check for successful redirect from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setSearchParams({});
      setIsSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);
    }
  }, []);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      const msg = 'Por favor inicia sesión primero';
      setError(msg);
      onError?.(msg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      createCheckout(
        { planType },
        {
          onSuccess: (data: any) => {
            if (data.url) {
              // Redirect to Stripe checkout
              window.location.href = data.url;
            } else {
              const msg = 'Error creando sesión de pago';
              setError(msg);
              onError?.(msg);
              setIsLoading(false);
            }
          },
          onError: (err: any) => {
            const message = err.message || 'Error creando sesión de checkout';
            setError(message);
            onError?.(message);
            setIsLoading(false);
          },
        }
      );
    } catch (err: any) {
      const message = err.message || 'Error inesperado al procesar pago';
      setError(message);
      onError?.(message);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 text-center py-8 animate-fade-in">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
        <h3 className="font-semibold text-lg">¡Pago completado!</h3>
        <p className="text-sm text-muted-foreground">
          Tu plan ha sido actualizado. Redirigiendo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleCheckout}
        disabled={isLoading || isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
        aria-busy={isLoading || isPending}
      >
        {isLoading || isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Procesando pago...</span>
          </>
        ) : (
          'Ir a Checkout'
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm space-y-2 animate-fade-in">
          <p className="font-semibold">Error en el pago</p>
          <p>{error}</p>
          <p className="text-xs opacity-75">Por favor, intenta de nuevo o contáctanos si el problema persiste.</p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Los pagos son procesados por Stripe. Tu información está segura.
      </p>
    </div>
  );
}
