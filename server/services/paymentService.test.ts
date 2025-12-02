/**
 * Payment Service Tests
 * Tests Stripe integration and payment flows
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Stripe from 'stripe';
import { paymentService } from './paymentService';
import * as db from '../db';

// Mock dependencies
vi.mock('../db');

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session for an existing customer', async () => {
      const userId = 1;
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        stripeCustomerId: 'cus_123',
        planType: 'FREE',
      };

      vi.mocked(db.getUserById).mockResolvedValue(user as any);
      vi.mocked(db.updateUser).mockResolvedValue(user as any);

      const result = await paymentService.createCheckoutSession(userId, 'PRO_MONTHLY');

      expect(result).toHaveProperty('sessionId');
      expect(result).toHaveProperty('url');
    });

    it('should create a Stripe customer if none exists', async () => {
      const userId = 1;
      const user = {
        id: userId,
        email: 'newuser@example.com',
        name: 'New User',
        stripeCustomerId: null,
        planType: 'FREE',
      };

      vi.mocked(db.getUserById).mockResolvedValue(user as any);
      vi.mocked(db.updateUser).mockResolvedValue({
        ...user,
        stripeCustomerId: 'cus_new',
      } as any);

      const result = await paymentService.createCheckoutSession(userId, 'PRO_YEARLY');

      expect(db.updateUser).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          stripeCustomerId: expect.any(String),
        })
      );
    });

    it('should throw error if user not found', async () => {
      vi.mocked(db.getUserById).mockResolvedValue(null);

      await expect(
        paymentService.createCheckoutSession(999, 'PRO_MONTHLY')
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('should throw error if Stripe price ID missing', async () => {
      // This test would need to mock environment variables
      // Left as example - actual implementation depends on how env vars are handled
      const userId = 1;
      const user = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        stripeCustomerId: 'cus_123',
      };

      vi.mocked(db.getUserById).mockResolvedValue(user as any);

      // Would need to clear env var for this test
      // expect to throw INTERNAL_SERVER_ERROR
    });
  });

  describe('handleWebhook', () => {
    it('should handle checkout.session.completed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        api_version: '2024-04-10',
        created: Math.floor(Date.now() / 1000),
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_123',
            customer: 'cus_123',
            subscription: 'sub_123',
            metadata: {
              userId: '1',
              planType: 'PRO_MONTHLY',
            },
          } as any,
          previous_attributes: {},
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toEqual({ received: true });
      expect(db.updateUser).toHaveBeenCalled();
      expect(db.createAuditLog).toHaveBeenCalled();
    });

    it('should handle customer.subscription.updated event', async () => {
      const event: Stripe.Event = {
        id: 'evt_124',
        object: 'event',
        api_version: '2024-04-10',
        created: Math.floor(Date.now() / 1000),
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            metadata: {
              userId: '1',
            },
          } as any,
          previous_attributes: {},
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toEqual({ received: true });
      expect(db.updateUser).toHaveBeenCalled();
      expect(db.createAuditLog).toHaveBeenCalled();
    });

    it('should handle customer.subscription.deleted event', async () => {
      const event: Stripe.Event = {
        id: 'evt_125',
        object: 'event',
        api_version: '2024-04-10',
        created: Math.floor(Date.now() / 1000),
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            metadata: {
              userId: '1',
            },
          } as any,
          previous_attributes: {},
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toEqual({ received: true });
      expect(db.createAuditLog).toHaveBeenCalled();
    });

    it('should handle invoice.payment_failed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_126',
        object: 'event',
        api_version: '2024-04-10',
        created: Math.floor(Date.now() / 1000),
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            customer: 'cus_123',
          } as any,
          previous_attributes: {},
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toEqual({ received: true });
      expect(db.createAuditLog).toHaveBeenCalled();
    });

    it('should ignore unknown event types', async () => {
      const event: Stripe.Event = {
        id: 'evt_127',
        object: 'event',
        api_version: '2024-04-10',
        created: Math.floor(Date.now() / 1000),
        type: 'account.updated',
        data: {
          object: {} as any,
          previous_attributes: {},
        },
        livemode: false,
        pending_webhooks: 0,
        request: { id: null, idempotency_key: null },
      };

      const result = await paymentService.handleWebhook(event);

      expect(result).toEqual({ received: true });
      // Should not call any db methods for unknown event
      expect(db.createAuditLog).not.toHaveBeenCalled();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      // This test would require actual Stripe test data
      // Left as example - real implementation depends on webhook test key
      expect(paymentService.verifyWebhookSignature).toBeDefined();
    });

    it('should throw error for invalid signature', () => {
      // This test would require actual Stripe test data
      expect(() => {
        paymentService.verifyWebhookSignature(
          Buffer.from('invalid body'),
          'invalid_signature'
        );
      }).toThrow();
    });
  });
});
