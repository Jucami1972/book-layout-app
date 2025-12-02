/**
 * Register Form Component - Premium Edition
 * Features: Better UX, loading animations, error handling, validation feedback, success state
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { registerSchema, type RegisterInput } from '@shared/validators/auth.validators';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const mutation = trpc.auth.register.useMutation();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  async function onSubmit(data: RegisterInput) {
    try {
      setError(null);
      setIsSuccess(false);
      const result = await mutation.mutateAsync(data);
      login(result.user, result.token, result.refreshToken);
      setIsSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse. Por favor intenta con otro email.');
      form.reset({ 
        name: form.getValues('name'), 
        email: form.getValues('email'), 
        password: '',
        passwordConfirm: '' 
      });
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto space-y-6 text-center py-12 animate-fade-in">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold">¡Cuenta creada!</h2>
          <p className="text-muted-foreground mt-2">Redirigiendo a tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
        <p className="text-muted-foreground mt-2">Empieza a maquetar libros gratuitamente</p>
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
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Juan Pérez" 
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

          <FormField
            control={form.control}
            name="passwordConfirm"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Confirma contraseña</FormLabel>
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
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta'
            )}
          </Button>
        </form>
      </Form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">¿Ya tienes cuenta?</span>
        </div>
      </div>

      <Button variant="outline" className="w-full h-11" asChild>
        <a href="/login">Inicia sesión</a>
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Los pagos son procesados de forma segura. Tu información está protegida.
      </p>
    </div>
  );
}
