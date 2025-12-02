/**
 * Pricing Page Component - Premium Edition
 * Features: Loading states, error handling, animations, accessibility, skeleton loaders
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PLAN_CONFIG, PLAN_NAMES, YEARLY_DISCOUNT_PERCENTAGE } from '@shared/const/plans';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { StripeCheckout } from '@/components/StripeCheckout';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PricingPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { limits, isLoading: limitsLoading } = usePlanLimits();
  const [selectedPlan, setSelectedPlan] = useState<'PRO_MONTHLY' | 'PRO_YEARLY' | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading && !limitsLoading) {
      setIsInitialized(true);
    }
  }, [authLoading, limitsLoading]);

  const handleUpgrade = (plan: 'PRO_MONTHLY' | 'PRO_YEARLY') => {
    if (!isAuthenticated) {
      setCheckoutError('Debes iniciar sesión para actualizar tu plan');
      return;
    }
    setCheckoutError(null);
    setSelectedPlan(plan);
  };

  const handleCheckoutError = (error: string) => {
    setCheckoutError(error);
  };

  const handleCheckoutSuccess = () => {
    setSelectedPlan(null);
    setCheckoutError(null);
  };

  const isLoading = !isInitialized;

  return (
    <div className="container py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tight">Planes y Precios</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elige el plan perfecto para maquetar tus libros. Cancela en cualquier momento.
        </p>
      </div>

      {/* Error Alert */}
      {checkoutError && (
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{checkoutError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Actualizar a {PLAN_NAMES[selectedPlan]}</CardTitle>
                <CardDescription>
                  {selectedPlan === 'PRO_MONTHLY' ? 'Pago mensual' : 'Pago anual (17% descuento)'}
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setCheckoutError(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <StripeCheckout
                planType={selectedPlan}
                onSuccess={handleCheckoutSuccess}
                onError={handleCheckoutError}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {isLoading ? (
          <>
            {/* Skeleton Loaders */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                  <Skeleton className="h-10 w-20" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            {/* FREE Plan */}
            <Card className={user?.planType === 'FREE' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <CardTitle>{PLAN_NAMES.FREE}</CardTitle>
                <CardDescription>Perfecto para empezar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-muted-foreground ml-2">/mes</span>
                </div>

                <ul className="space-y-3">
                  {PLAN_CONFIG.FREE.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={user?.planType === 'FREE' ? 'default' : 'outline'}
                  className="w-full"
                  disabled={user?.planType === 'FREE'}
                >
                  {user?.planType === 'FREE' ? 'Plan Actual' : 'Cambiar a Gratuito'}
                </Button>
              </CardContent>
            </Card>

            {/* PRO MONTHLY Plan */}
            <Card className={user?.planType === 'PRO_MONTHLY' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{PLAN_NAMES.PRO_MONTHLY}</CardTitle>
                    <CardDescription>Lo más popular</CardDescription>
                  </div>
                  <Badge>Popular</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">€{PLAN_CONFIG.PRO_MONTHLY.price}</span>
                  <span className="text-muted-foreground ml-2">/mes</span>
                </div>

                <ul className="space-y-3">
                  {PLAN_CONFIG.PRO_MONTHLY.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade('PRO_MONTHLY')}
                  disabled={user?.planType === 'PRO_MONTHLY'}
                  className="w-full"
                >
                  {user?.planType === 'PRO_MONTHLY' ? 'Plan Actual' : 'Actualizar a PRO'}
                </Button>
              </CardContent>
            </Card>

            {/* PRO YEARLY Plan */}
            <Card className={user?.planType === 'PRO_YEARLY' ? 'ring-2 ring-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{PLAN_NAMES.PRO_YEARLY}</CardTitle>
                    <CardDescription>Mejor valor</CardDescription>
                  </div>
                  <Badge variant="secondary">Ahorra {YEARLY_DISCOUNT_PERCENTAGE}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-4xl font-bold">€{PLAN_CONFIG.PRO_YEARLY.price}</span>
                  <span className="text-muted-foreground ml-2">/año</span>
                  <div className="text-sm text-green-600 mt-1">
                    Equivale a €{(PLAN_CONFIG.PRO_YEARLY.price / 12).toFixed(2)}/mes
                  </div>
                </div>

                <ul className="space-y-3">
                  {PLAN_CONFIG.PRO_YEARLY.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade('PRO_YEARLY')}
                  disabled={user?.planType === 'PRO_YEARLY'}
                  className="w-full"
                >
                  {user?.planType === 'PRO_YEARLY' ? 'Plan Actual' : 'Actualizar a PRO'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* FAQ or notes */}
      <div className="bg-muted/50 rounded-lg p-6 text-center animate-fade-in">
        <p className="text-muted-foreground">
          ¿Preguntas? Contacta nuestro soporte en support@bookmaster.com
        </p>
      </div>
    </div>
  );
}
