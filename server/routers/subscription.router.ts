/**
 * Subscription Router
 * Handles plan upgrades, downgrades, status checks
 */

import { protectedProcedure, router } from '../_core/trpc';
import { subscriptionService } from '../services/subscriptionService';
import { createAuditLog } from '../db';
import { z } from 'zod';
import {
  upgradeRequestSchema,
  downgradeRequestSchema,
} from '../../shared/validators/subscription.validators';
import { TRPCError } from '@trpc/server';

export const subscriptionRouter = router({
  /**
   * Get current plan and limits
   */
  getPlanLimits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const limits = await subscriptionService.getPlanLimits(ctx.user.id);
      return limits;
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }
  }),

  /**
   * Check subscription status
   */
  checkStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const status = await subscriptionService.checkSubscriptionStatus(ctx.user.id);
      return status;
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }
  }),

  /**
   * Upgrade to PRO Monthly (simulated payment)
   */
  upgradeToProMonthly: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // TODO: In production, create Stripe session here
      // For now, we simulate successful payment

      await subscriptionService.upgradeToProMonthly(ctx.user.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'UPGRADE_PLAN',
        details: { newPlan: 'PRO_MONTHLY' },
      });

      return {
        success: true,
        message: '¡Bienvenido a PRO Mensual!',
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }
  }),

  /**
   * Upgrade to PRO Yearly (simulated payment)
   */
  upgradeToProYearly: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // TODO: In production, create Stripe session here
      // For now, we simulate successful payment

      await subscriptionService.upgradeToProYearly(ctx.user.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'UPGRADE_PLAN',
        details: { newPlan: 'PRO_YEARLY' },
      });

      return {
        success: true,
        message: '¡Bienvenido a PRO Anual! Ahorras 17% vs mensual.',
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }
  }),

  /**
   * Downgrade to FREE
   */
  downgradeToFree: protectedProcedure
    .input(downgradeRequestSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        await subscriptionService.downgradeToFree(ctx.user.id);

        await createAuditLog({
          userId: ctx.user.id,
          action: 'DOWNGRADE_PLAN',
          details: { newPlan: 'FREE' },
        });

        return {
          success: true,
          message: 'Has sido cambiado al plan Gratuito',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: error.message,
        });
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // TODO: In production, cancel Stripe subscription here
      await subscriptionService.downgradeToFree(ctx.user.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'CANCEL_SUBSCRIPTION',
      });

      return {
        success: true,
        message: 'Suscripción cancelada. Tu plan es ahora Gratuito.',
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      });
    }
  }),
});
