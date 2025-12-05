/**
 * Authentication Router
 * Handles register, login, logout, password reset
 */

import { publicProcedure, router } from '../_core/trpc';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { createAuditLog } from '../db';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  refreshTokenSchema,
} from '../../shared/validators/auth.validators';

export const authRouter = router({
  /**
   * Register new user
   */
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("[Auth] Register attempt:", input.email);
        const result = await authService.register(input);
        console.log("[Auth] Register success:", input.email);

        // Log signup
        try {
          await createAuditLog({
            userId: result.user.id,
            action: 'SIGNUP',
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
          });
        } catch (auditError) {
          console.warn("[Auth] Audit log failed (non-critical):", auditError);
        }

        return {
          success: true,
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        };
      } catch (error: any) {
        console.error("[Auth] Register failed:", error.message);
        throw new Error(error.message || 'Error en registro');
      }
    }),

  /**
   * Login user
   */
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.login(input);

        // Log login
        await createAuditLog({
          userId: result.user.id,
          action: 'LOGIN',
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });

        return {
          success: true,
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        };
      } catch (error: any) {
        throw new Error(error.message || 'Error en login');
      }
    }),

  /**
   * Logout (client-side mainly, but log it)
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.user) {
      await createAuditLog({
        userId: ctx.user.id,
        action: 'LOGOUT',
        ipAddress: ctx.ipAddress,
      });
    }
    return { success: true };
  }),

  /**
   * Refresh access token using refresh token
   */
  refreshToken: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ input }) => {
      try {
        const payload = await authService.verifyRefreshToken(input.refreshToken);
        const { token, refreshToken } = await authService.generateTokens(payload.userId);

        return {
          success: true,
          token,
          refreshToken,
        };
      } catch (error: any) {
        throw new Error('Token de actualización inválido');
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(passwordResetRequestSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.requestPasswordReset(input.email);

        await createAuditLog({
          userId: null,
          action: 'PASSWORD_RESET_REQUESTED',
          details: { email: input.email },
          ipAddress: ctx.ipAddress,
        });

        return {
          success: true,
          message: 'Si el email existe, recibirás un enlace de recuperación',
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    }),

  /**
   * Confirm password reset
   */
  confirmPasswordReset: publicProcedure
    .input(passwordResetConfirmSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await authService.resetPassword(input.token, input.newPassword);

        return {
          success: true,
          message: 'Contraseña actualizada exitosamente',
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    }),

  /**
   * Get current user
   */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return { user: null };
    }

    try {
      const limits = await subscriptionService.getPlanLimits(ctx.user.id);
      
      return {
        user: ctx.user,
        limits,
      };
    } catch (error) {
      return { user: ctx.user, limits: null };
    }
  }),
});
