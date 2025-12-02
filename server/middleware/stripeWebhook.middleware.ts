/**
 * Stripe Webhook Middleware
 * Handles webhook events from Stripe
 * Must be added to Express BEFORE json() middleware to access raw body
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { paymentService } from '../services/paymentService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Express middleware for Stripe webhooks
 * IMPORTANT: Add this to server BEFORE json() middleware:
 * app.post('/api/webhook/stripe', express.raw({type: 'application/json'}), stripeWebhookMiddleware);
 */
export async function stripeWebhookMiddleware(
  req: Request,
  res: Response
): Promise<void> {
  const sig = req.headers['stripe-signature'];

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send('Webhook signature missing');
    return;
  }

  try {
    // Verify and construct the event
    const event = paymentService.verifyWebhookSignature(
      req.body,
      sig as string
    );

    // Handle the event
    await paymentService.handleWebhook(event);

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}

/**
 * Simple test endpoint to generate test webhooks
 * Only works in development
 */
export async function stripeWebhookTestMiddleware(
  req: Request,
  res: Response
): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    res.status(403).send('Not available in production');
    return;
  }

  const { eventType, data } = req.body;

  // Create a mock Stripe event
  const event: Stripe.Event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2024-04-10',
    created: Math.floor(Date.now() / 1000),
    type: eventType || 'checkout.session.completed',
    data: {
      object: data || {},
      previous_attributes: {},
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
      id: null,
      idempotency_key: null,
    },
  };

  try {
    await paymentService.handleWebhook(event);
    res.json({ received: true, event });
  } catch (error: any) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}
