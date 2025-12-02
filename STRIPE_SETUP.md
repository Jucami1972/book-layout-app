# Stripe Integration Guide

## Overview
BookMaster now supports Stripe for handling subscription payments. This guide walks through setup and deployment.

## Installation

### 1. Install Stripe SDK
```bash
pnpm add stripe
pnpm add -D @types/stripe
```

### 2. Get Stripe Credentials
1. Create a [Stripe account](https://stripe.com)
2. Go to Developers → API Keys
3. Copy your Secret Key (starts with `sk_test_` or `sk_live_`)
4. Copy your Publishable Key (starts with `pk_test_` or `pk_live_`)

### 3. Create Products and Prices in Stripe Dashboard

#### PRO Monthly (€9.99/month)
1. Go to Products → Create Product
2. Name: "BookMaster PRO Monthly"
3. Billing Period: Monthly
4. Price: €9.99
5. Copy the Price ID (starts with `price_`)

#### PRO Yearly (€99.99/year)
1. Go to Products → Create Product
2. Name: "BookMaster PRO Yearly"
3. Billing Period: Yearly
4. Price: €99.99
5. Copy the Price ID

### 4. Setup Webhook
1. Go to Developers → Webhooks
2. Click "Add Endpoint"
3. URL: `https://yourdomain.com/api/webhook/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy Signing Secret (starts with `whsec_`)

### 5. Environment Variables
Create `.env` file with:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
FRONTEND_URL=http://localhost:5173
```

## Server Setup

### 1. Add Webhook Middleware to Express Server
In your main server file (e.g., `server/index.ts`):

```typescript
import express from 'express';
import { stripeWebhookMiddleware } from './middleware/stripeWebhook.middleware';

const app = express();

// IMPORTANT: This must come BEFORE json() middleware
app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), stripeWebhookMiddleware);

// Then add normal json middleware
app.use(express.json());

// ... rest of your server setup
```

### 2. Verify Webhook is Working
Use Stripe CLI for local testing:
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Trigger test webhook
stripe trigger checkout.session.completed
```

## Frontend Setup

### 1. Add Stripe Checkout Component
Already included in `client/src/components/StripeCheckout.tsx`

### 2. Update Pricing Page
Already updated in `client/src/pages/Pricing.tsx`

The flow is:
1. User clicks "Upgrade" button
2. `StripeCheckout` component calls `payment.createCheckoutSession`
3. PaymentService creates Stripe checkout session
4. User redirected to Stripe Checkout
5. After payment, user redirected back to app with session ID
6. Webhook verifies payment and upgrades user plan

## Subscription Lifecycle

### On Successful Payment
1. ✅ `checkout.session.completed` webhook triggered
2. ✅ PaymentService.handleCheckoutCompleted() called
3. ✅ User plan upgraded to PRO_MONTHLY or PRO_YEARLY
4. ✅ Stripe subscription ID saved to user record
5. ✅ Audit log created

### On Subscription Updated
1. ✅ `customer.subscription.updated` webhook triggered
2. ✅ Subscription end date updated
3. ✅ Audit log created

### On Cancellation
1. ✅ `customer.subscription.deleted` webhook triggered
2. ✅ User downgraded to FREE plan
3. ✅ Audit log created

### On Payment Failed
1. ✅ `invoice.payment_failed` webhook triggered
2. ✅ Audit log created (user remains on current plan until manual action)

## Testing

### Manual Testing with Stripe CLI
```bash
# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhook/stripe

# In another terminal, trigger events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

### Test Cards
Use these test card numbers in Stripe checkout:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Expire**: Any future date
- **CVC**: Any 3 digits

### Test Flow
1. Navigate to `/pricing`
2. Click "Actualizar a PRO"
3. Select "PRO_MONTHLY" or "PRO_YEARLY"
4. Click "Ir a Checkout"
5. Enter test card: 4242 4242 4242 4242
6. Fill any required fields
7. Complete payment
8. Redirected to `/dashboard?session_id=...`
9. Plan automatically upgraded

## Production Deployment

### 1. Update Stripe Keys
Switch to live keys:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Update Webhook URL
In Stripe Dashboard, update webhook endpoint to your production URL:
```
https://yourdomain.com/api/webhook/stripe
```

### 3. Enable HTTPS
Webhook endpoint MUST be HTTPS in production

### 4. Test Payment
Process a real payment with low amount to verify integration

### 5. Monitor
- Watch Stripe Dashboard for webhook failures
- Check database for successful audit logs
- Monitor user plan upgrades

## Troubleshooting

### Webhook Not Received
- Check webhook endpoint URL is correct
- Verify HTTPS is enabled (prod only)
- Check Stripe Dashboard → Webhooks → Event attempts
- Use `stripe listen` to verify local setup

### Payment Session Not Creating
- Verify Stripe keys are correct
- Check STRIPE_PRICE_* environment variables
- Review server logs for errors
- Ensure database connection works

### User Not Upgraded After Payment
- Check webhook signature verification
- Review server logs for webhook errors
- Verify audit logs in database
- Check user record for plan type

### Test Cards Not Working
- Ensure you're using test mode keys (sk_test_, pk_test_)
- Use exact card numbers from Stripe docs
- Check Stripe Dashboard for error details

## Database Schema Changes

New fields added to `users` table:
- `stripeCustomerId`: Stripe customer ID
- `stripeSubscriptionId`: Stripe subscription ID

These are automatically set when checkout completes.

## Security Considerations

✅ Webhook signature verification (using Stripe SDK)
✅ Plan limits enforced on backend (not just UI)
✅ User ID tracked in Stripe metadata
✅ Audit logs for all payment events
✅ No payment card data stored (handled by Stripe)

## Next Steps

1. ✅ Setup Stripe account and get keys
2. ✅ Create products and prices
3. ✅ Setup webhook endpoint
4. ✅ Add environment variables
5. ✅ Test with Stripe CLI
6. ✅ Deploy to production
7. ✅ Monitor webhook events
8. ✅ Update Terms of Service and Privacy Policy

## Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Webhook Events](https://stripe.com/docs/api/events)
- [Checkout Sessions](https://stripe.com/docs/payments/checkout)
