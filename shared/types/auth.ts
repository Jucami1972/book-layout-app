/**
 * Authentication and User types
 */

export type User = {
  id: number;
  email: string;
  name: string;
  planType: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
  planActive: boolean;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
  stripeCustomerId: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserPublic = Omit<User, never>;

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export type AuthResponse = {
  user: User;
  token: string; // JWT access token
  refreshToken: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetConfirm = {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type AuthContext = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
};
