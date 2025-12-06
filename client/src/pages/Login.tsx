/**
 * Login Page
 */

import { LoginForm } from '@/components/auth/LoginForm';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
      <LoginForm onSuccess={() => setLocation('/')} />
    </div>
  );
}

export default LoginPage;
