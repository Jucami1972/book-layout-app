/**
 * Zod validators for authentication
 */

import { z } from 'zod';
import { LIMITS } from '../const/limits';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(LIMITS.EMAIL_MAX_LENGTH, 'Email muy largo'),
  password: z
    .string()
    .min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre muy largo'),
  email: z
    .string()
    .email('Email inválido')
    .max(LIMITS.EMAIL_MAX_LENGTH, 'Email muy largo'),
  password: z
    .string()
    .min(LIMITS.PASSWORD_MIN_LENGTH, `Contraseña debe tener al menos ${LIMITS.PASSWORD_MIN_LENGTH} caracteres`)
    .max(LIMITS.PASSWORD_MAX_LENGTH, 'Contraseña muy larga')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  passwordConfirm: z
    .string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['passwordConfirm'],
});

export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('Email inválido'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z
    .string()
    .min(LIMITS.PASSWORD_MIN_LENGTH, `Contraseña debe tener al menos ${LIMITS.PASSWORD_MIN_LENGTH} caracteres`)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  newPasswordConfirm: z.string(),
}).refine((data) => data.newPassword === data.newPasswordConfirm, {
  message: 'Las contraseñas no coinciden',
  path: ['newPasswordConfirm'],
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
