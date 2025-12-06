/**
 * Register Page
 */

import { RegisterForm } from '@/components/auth/RegisterForm';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function RegisterPage() {
  const [, setLocation] = useLocation();
  const { user, token } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user && token) {
      setLocation('/');
    }
  }, [user, token, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <RegisterForm onSuccess={() => {
        // Wait a bit for context to update, then redirect
        setTimeout(() => setLocation('/'), 500);
      }} />
    </div>
  );
}

export default RegisterPage;
