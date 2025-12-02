/**
 * DEPRECATED: This file contained OAuth authentication logic which has been
 * replaced with email/password JWT authentication in the SaaS version.
 * 
 * All authentication now uses:
 * - AuthService for token generation and verification
 * - context.ts for JWT extraction from Authorization header
 * - authService.ts for user registration/login
 * 
 * This file is kept for reference only and should not be used.
 */

export const sdk = {
  authenticateRequest: async () => {
    throw new Error(
      'OAuth SDK has been deprecated. Use JWT authentication instead via AuthService.'
    );
  },
};
