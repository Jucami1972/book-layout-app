/**
 * OAuth Authentication (Deprecated - SaaS uses Email/Password)
 * OAuth routes kept for reference only
 */

import type { Express } from "express";

export function registerOAuthRoutes(app: Express) {
  // OAuth disabled in SaaS version
  // Use email/password authentication instead via authService
}
