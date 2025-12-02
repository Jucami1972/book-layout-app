/**
 * EXAMPLE: How to integrate Stripe webhook middleware into your Express server
 * 
 * This is a reference file showing where and how to add Stripe webhook handling.
 * Copy these patterns into your actual server/index.ts or server/main.ts file.
 */

import express, { Express } from 'express';
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { appRouter } from './server/routers';
import { stripeWebhookMiddleware, stripeWebhookTestMiddleware } from './server/middleware/stripeWebhook.middleware';

/**
 * IMPORTANT: Webhook middleware MUST be added BEFORE json() middleware
 * because it needs access to the raw request body for signature verification
 */
export function setupStripeWebhooks(app: Express) {
  console.log('Setting up Stripe webhook endpoints...');

  // Production webhook endpoint
  // Must be HTTPS and match the URL in Stripe Dashboard
  app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhookMiddleware);

  // Development-only test endpoint
  // Allows triggering test webhooks without Stripe CLI
  app.post('/api/webhook/stripe/test', express.json(), stripeWebhookTestMiddleware);

  console.log('✓ Stripe webhooks configured');
}

/**
 * EXAMPLE: Complete server setup with Stripe integration
 */
export async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // STEP 1: Setup Stripe webhooks BEFORE other middleware
  // =====================================================
  setupStripeWebhooks(app);

  // STEP 2: Setup other middleware
  // ===============================
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // STEP 3: Setup tRPC routes
  // ==========================
  app.use(
    '/api/trpc',
    createHTTPHandler({
      router: appRouter,
      createContext: (opts: any) => {
        // Your context setup
        return opts;
      },
    })
  );

  // STEP 4: Health check endpoint
  // =============================
  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  // STEP 5: Start server
  // ====================
  app.listen(PORT, () => {
    console.log(`
    🚀 BookMaster Server Started
    ├─ URL: http://localhost:${PORT}
    ├─ tRPC: http://localhost:${PORT}/api/trpc
    ├─ Stripe Webhook: http://localhost:${PORT}/api/webhook/stripe
    ${process.env.NODE_ENV === 'development' ? `└─ Test Webhook: http://localhost:${PORT}/api/webhook/stripe/test` : ''}
    `);
  });
}

// If running as main module
if (require.main === module) {
  startServer().catch(console.error);
}

export default startServer;

/**
 * CHECKLIST for integrating Stripe:
 * 
 * ✅ Server Setup
 * [ ] Add stripeWebhookMiddleware to your Express app BEFORE json()
 * [ ] Verify webhook endpoint is /api/webhook/stripe
 * [ ] Test endpoint works: curl http://localhost:3000/health
 * 
 * ✅ Environment Variables
 * [ ] Add STRIPE_SECRET_KEY to .env
 * [ ] Add STRIPE_PUBLISHABLE_KEY to .env (not used server-side, but for completeness)
 * [ ] Add STRIPE_PRICE_PRO_MONTHLY to .env
 * [ ] Add STRIPE_PRICE_PRO_YEARLY to .env
 * [ ] Add STRIPE_WEBHOOK_SECRET to .env
 * [ ] Add FRONTEND_URL to .env (for checkout redirects)
 * 
 * ✅ Database
 * [ ] Run migrations: npx drizzle-kit generate && npx drizzle-kit migrate
 * [ ] Verify users table has stripeCustomerId and stripeSubscriptionId fields
 * 
 * ✅ Dependencies
 * [ ] Install Stripe: pnpm add stripe
 * [ ] Verify paymentService.ts is in server/services/
 * [ ] Verify payment.router.ts is in server/routers/
 * [ ] Verify paymentRouter is imported in routers/index.ts
 * 
 * ✅ Testing
 * [ ] Install Stripe CLI: https://stripe.com/docs/stripe-cli
 * [ ] Run: stripe listen --forward-to localhost:3000/api/webhook/stripe
 * [ ] Trigger test: stripe trigger checkout.session.completed
 * [ ] Check server logs for webhook receipt
 * [ ] Verify audit logs in database
 * 
 * ✅ Frontend
 * [ ] StripeCheckout component is in client/src/components/
 * [ ] Pricing.tsx imports and uses StripeCheckout
 * [ ] Payment router is included in appRouter (routers/index.ts)
 * [ ] Test payment flow on localhost:5173/pricing
 * 
 * ✅ Production
 * [ ] Update Stripe keys to live keys (sk_live_, pk_live_)
 * [ ] Update webhook endpoint URL in Stripe Dashboard to production domain
 * [ ] Ensure HTTPS is enabled
 * [ ] Test with real payment (use lowest price tier)
 * [ ] Setup monitoring for webhook failures
 * [ ] Monitor database for successful audit logs
 */
