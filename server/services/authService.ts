/**
 * Authentication Service
 * Handles user registration, login, password reset, token management
 */

import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { eq, and } from 'drizzle-orm';
import * as db from '../db';
import { users } from '../../drizzle/schema';
import type { User, LoginRequest, RegisterRequest } from '../../shared/types/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
);

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest) {
    console.log("[AuthService] Starting registration for:", data.email);
    
    // Check if email exists
    try {
      const existing = await db.getUserByEmail(data.email);
      if (existing) {
        throw new Error('El email ya está registrado');
      }
    } catch (error: any) {
      if (error.message === 'El email ya está registrado') throw error;
      console.error("[AuthService] Check email failed:", error.message);
      // If it's a connection error, provide helpful message
      if (error.message.includes('unavailable') || error.message.includes('timeout')) {
        throw new Error('La base de datos no está disponible. Por favor intenta más tarde.');
      }
      throw new Error('Error verificando email. Intenta más tarde.');
    }

    // Hash password
    console.log("[AuthService] Hashing password...");
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with FREE plan by default
    console.log("[AuthService] Creating user...");
    try {
      const user = await db.createUser({
        email: data.email,
        name: data.name,
        passwordHash,
        planType: 'FREE',
        planActive: true,
      });
      console.log("[AuthService] User created:", user.id);

      // Generate tokens
      const { token, refreshToken } = await this.generateTokens(user.id);

      return {
        user: this.sanitizeUser(user),
        token,
        refreshToken,
      };
    } catch (error: any) {
      console.error("[AuthService] User creation failed:", error.message);
      if (error.message.includes('unavailable') || error.message.includes('timeout')) {
        throw new Error('No pudimos crear tu cuenta. La base de datos no responde. Intenta de nuevo en unos minutos.');
      }
      throw new Error('Error al crear la cuenta. Intenta más tarde.');
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest) {
    const user = await db.getUserByEmail(data.email);
    if (!user) {
      throw new Error('Email o contraseña inválidos');
    }

    // Verify password
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new Error('Email o contraseña inválidos');
    }

    // Update last signed in
    const database = await db.getDb();
    if (database) {
      await database
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));
    }

    // Generate tokens
    const { token, refreshToken } = await this.generateTokens(user.id);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  /**
   * Generate JWT tokens
   */
  async generateTokens(userId: number) {
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ userId, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT({ userId, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime('7d')
      .sign(REFRESH_SECRET);

    return { token, refreshToken };
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string) {
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      return verified.payload as { userId: number; type: string };
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string) {
    try {
      const verified = await jwtVerify(token, REFRESH_SECRET);
      return verified.payload as { userId: number; type: string };
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await db.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await db.updateUser(user.id, {
      resetPasswordToken: token,
      resetPasswordExpiry: expiry,
    });

    // TODO: Send email with token
    // For now, return token for testing
    return { success: true, token: process.env.NODE_ENV === 'development' ? token : undefined };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await db.getUserByResetToken(token);
    if (!user) {
      throw new Error('Token inválido o expirado');
    }

    if (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date()) {
      throw new Error('Token expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.updateUser(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    });

    return { success: true };
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      planType: user.planType,
      planActive: user.planActive,
      subscriptionStartDate: user.subscriptionStartDate ? new Date(user.subscriptionStartDate) : null,
      subscriptionEndDate: user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null,
      stripeCustomerId: user.stripeCustomerId,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    };
  }
}

export const authService = new AuthService();
