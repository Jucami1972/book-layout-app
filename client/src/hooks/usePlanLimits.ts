/**
 * usePlanLimits Hook
 * Gets current user's plan limits
 */

import { trpc } from '@/lib/trpc';
import { useAuth } from './useAuth';

export function usePlanLimits() {
  const { isAuthenticated } = useAuth();
  
  const query = trpc.subscription.getPlanLimits.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  return {
    limits: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
