/**
 * Payment Router - Stripe Endpoints
 * Handles checkout sessions and webhook events
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { paymentService } from '../services/paymentService';
import * as db from '../db';
import { z } from 'zod';

export const paymentRouter = router({
  /**
   * Create checkout session for plan upgrade
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planType: z.enum(['PRO_MONTHLY', 'PRO_YEARLY']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return paymentService.createCheckoutSession(ctx.user.id, input.planType);
    }),

  /**
   * Webhook endpoint for Stripe events
   * NOTE: This should be called directly from express middleware, not via tRPC
   * This is just a reference - see stripe.middleware.ts for actual implementation
   */
  handleWebhook: publicProcedure
    .input(z.any()) // Raw request body
    .mutation(async ({ input }) => {
      // This won't actually be called via tRPC due to signature verification needs
      // See stripe.middleware.ts instead
      return { received: true };
    }),

  /**
   * Check if user has an active Stripe subscription
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return {
      hasActiveSubscription: !!user.stripeSubscriptionId,
      planType: user.planType,
      subscriptionEndDate: user.subscriptionEndDate,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
  }),
});
