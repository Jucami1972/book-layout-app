/**
 * Login Form Component - Premium Edition
 * Features: Better UX, loading animations, error handling, validation feedback
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { loginSchema, type LoginInput } from '@shared/validators/auth.validators';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const mutation = trpc.auth.login.useMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginInput) {
    try {
      setError(null);
      setIsSuccess(false);
      const result = await mutation.mutateAsync(data);
      login(result.user, result.token, result.refreshToken);
      setIsSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Por favor verifica tus credenciales.');
      form.reset({ email: form.getValues('email'), password: '' });
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 text-center py-12 animate-fade-in">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
          <p className="text-muted-foreground mt-2">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Inicia sesión</h1>
        <p className="text-muted-foreground mt-2">Accede a tu cuenta de BookMaster</p>
      </div>

      {error && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    disabled={mutation.isPending}
                    aria-invalid={!!fieldState.error}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    disabled={mutation.isPending}
                    aria-invalid={!!fieldState.error}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Inicia sesión'
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">¿Nuevo en BookMaster?</span>
        </div>
      </div>

      <Button variant="outline" className="w-full h-11" asChild>
        <a href="/register">Crear cuenta</a>
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Los pagos son procesados de forma segura. Tu información está protegida.
      </p>
    </div>
  );
}
