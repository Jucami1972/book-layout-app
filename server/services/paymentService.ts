/**
 * Payment Service - Stripe Integration
 * Handles checkout sessions, webhook verification, and payment processing
 */

import Stripe from 'stripe';
import * as db from '../db';
import { subscriptionService } from './subscriptionService';
import { TRPCError } from '@trpc/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export class PaymentService {
  /**
   * Create checkout session for plan upgrade
   */
  async createCheckoutSession(
    userId: number,
    planType: 'PRO_MONTHLY' | 'PRO_YEARLY'
  ) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const priceId = 
      planType === 'PRO_MONTHLY'
        ? process.env.STRIPE_PRICE_PRO_MONTHLY
        : process.env.STRIPE_PRICE_PRO_YEARLY;

    if (!priceId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Configuración de Stripe incompleta',
      });
    }

    try {
      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: String(user.id),
          },
        });
        stripeCustomerId = customer.id;

        // Save Stripe customer ID
        await db.updateUser(userId, {
          stripeCustomerId,
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/pricing?canceled=true`,
        customer_email: user.email,
        metadata: {
          userId: String(user.id),
          planType,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error creando sesión de checkout',
      });
    }
  }

  /**
   * Handle webhook from Stripe
   */
  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error: any) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  /**
   * Handle successful checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = Number(session.metadata?.userId);
    const planType = session.metadata?.planType as 'PRO_MONTHLY' | 'PRO_YEARLY';

    if (!userId || !planType) {
      throw new Error('Metadata incompleta en sesión');
    }

    const subscription = session.subscription as string;

    if (planType === 'PRO_MONTHLY') {
      await subscriptionService.upgradeToProMonthly(userId);
    } else {
      await subscriptionService.upgradeToProYearly(userId);
    }

    // Save Stripe subscription ID
    const user = await db.getUserById(userId);
    if (user) {
      await db.updateUser(userId, {
        stripeSubscriptionId: subscription,
      });
    }

    // Log in audit
    await db.createAuditLog({
      userId,
      action: 'PAYMENT_SUCCESSFUL',
      details: { planType, stripeSubscriptionId: subscription },
    });
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    const userId = Number(metadata?.userId);

    if (!userId) return;

    // Update subscription end date
    const periodEnd = (subscription as any).current_period_end || 0;
    const currentPeriodEnd = new Date(periodEnd * 1000);

    await db.updateUser(userId, {
      subscriptionEndDate: currentPeriodEnd,
    });

    await db.createAuditLog({
      userId,
      action: 'SUBSCRIPTION_UPDATED',
      details: { stripeSubscriptionId: subscription.id },
    });
  }

  /**
   * Handle subscription deleted (cancellation)
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata;
    const userId = Number(metadata?.userId);

    if (!userId) return;

    // Downgrade to FREE
    await subscriptionService.downgradeToFree(userId);

    await db.createAuditLog({
      userId,
      action: 'SUBSCRIPTION_CANCELED',
      details: { stripeSubscriptionId: subscription.id },
    });
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;

    // Find user by Stripe customer ID
    // TODO: Need to add query function to db
    console.log(`Payment failed for customer: ${customerId}`);

    await db.createAuditLog({
      userId: null,
      action: 'PAYMENT_FAILED',
      details: { stripeCustomerId: customerId },
    });
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    body: string | Buffer,
    signature: string
  ): Stripe.Event {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  }
}

export const paymentService = new PaymentService();
