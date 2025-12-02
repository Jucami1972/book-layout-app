# 🧪 FASE C: Unit Tests - Implementation Plan

## Overview

Fase B (Stripe Integration) is now **100% complete**. 

This document outlines **Fase C** - comprehensive unit testing of all critical services and middleware.

---

## 📋 What Needs Testing

### Priority 1: Core Auth & Subscription Services

#### authService.test.ts (Target: 10+ tests)
```typescript
✓ register() - successful registration
✓ register() - duplicate email error
✓ register() - weak password error
✓ login() - successful login
✓ login() - invalid credentials
✓ login() - password hashing verification
✓ generateTokens() - access token generation
✓ generateTokens() - refresh token generation
✓ verifyToken() - valid token
✓ verifyToken() - expired token
✓ requestPasswordReset() - generates token
✓ resetPassword() - updates password
✓ sanitizeUser() - removes sensitive fields
```

#### subscriptionService.test.ts (Target: 15+ tests)
```typescript
✓ getPlanLimits() - FREE plan
✓ getPlanLimits() - PRO_MONTHLY plan
✓ getPlanLimits() - PRO_YEARLY plan
✓ upgradeToProMonthly() - successful upgrade
✓ upgradeToProMonthly() - sets correct expiry
✓ upgradeToProYearly() - successful upgrade
✓ upgradeToProYearly() - sets correct expiry
✓ downgradeToFree() - successful downgrade
✓ downgradeToFree() - validates project count
✓ downgradeToFree() - rejects if too many projects
✓ canCreateProject() - FREE tier limit
✓ canCreateProject() - PRO tier unlimited
✓ canCreateChapter() - respects per-book limit
✓ canExport() - FREE tier cannot export
✓ canExport() - PRO tier can export
✓ checkSubscriptionStatus() - auto-downgrade on expiry
```

#### paymentService.test.ts (Already Started: 8+ tests)
```typescript
✓ createCheckoutSession() - existing customer
✓ createCheckoutSession() - new customer creation
✓ handleWebhook() - checkout.session.completed
✓ handleWebhook() - customer.subscription.updated
✓ handleWebhook() - customer.subscription.deleted
✓ handleWebhook() - invoice.payment_failed
✓ verifyWebhookSignature() - valid signature
✓ verifyWebhookSignature() - invalid signature
```

### Priority 2: Middleware

#### planLimitMiddleware.test.ts (Target: 8+ tests)
```typescript
✓ checkCanCreateProject() - FREE tier blocked
✓ checkCanCreateProject() - PRO tier allowed
✓ checkCanCreateChapter() - FREE tier limit
✓ checkCanCreateChapter() - PRO tier unlimited
✓ checkCanExport() - FREE blocked
✓ checkCanExport() - PRO allowed
✓ checkCanUploadCover() - FREE blocked
✓ checkCanUploadCover() - PRO allowed
```

### Priority 3: Router Endpoints

#### auth.router.test.ts (Target: 8+ tests)
```typescript
✓ POST register - successful registration
✓ POST login - successful login
✓ GET me - authenticated user
✓ POST logout - token cleanup
✓ POST refreshToken - generates new tokens
✓ POST requestPasswordReset - sends token
✓ POST confirmPasswordReset - resets password
✓ GET me - unauthenticated returns null
```

#### subscription.router.test.ts (Target: 6+ tests)
```typescript
✓ GET getPlanLimits - authenticated
✓ GET checkStatus - current plan
✓ POST upgradeToProMonthly - creates session
✓ POST upgradeToProYearly - creates session
✓ POST downgradeToFree - validates
✓ POST cancelSubscription - cancels
```

#### payment.router.test.ts (Target: 4+ tests)
```typescript
✓ POST createCheckoutSession - creates session
✓ POST createCheckoutSession - requires auth
✓ GET getSubscriptionStatus - returns status
✓ GET getSubscriptionStatus - requires auth
```

### Priority 4: Integration Tests

#### auth-flow.integration.test.ts
```typescript
✓ Full flow: register → login → me → logout
✓ Session refresh cycle
✓ Password reset flow
✓ Multiple users don't see each other's data
```

#### subscription-flow.integration.test.ts
```typescript
✓ Free → PRO upgrade flow
✓ PRO → Free downgrade flow
✓ Subscription tracking through webhook
✓ Auto-downgrade on expiry
```

---

## 🛠️ Testing Setup

### 1. Dependencies Already Installed
```json
{
  "vitest": "^1.x",
  "@vitest/ui": "^1.x",
  "vitest/coverage": "^1.x"
}
```

### 2. Create vitest.config.ts (if not exists)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
});
```

### 3. Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

---

## 📝 Test File Structure

### Example: authService.test.ts
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './authService';
import * as db from '../db';

// Mock database
vi.mock('../db');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const data = {
        email: 'test@example.com',
        password: 'Secure123',
        name: 'Test User',
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(null);
      vi.mocked(db.createUser).mockResolvedValue({
        id: 1,
        email: data.email,
        name: data.name,
      } as any);

      const result = await authService.register(data);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(db.createUser).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      const data = {
        email: 'existing@example.com',
        password: 'Secure123',
        name: 'Test',
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue({
        id: 1,
        email: data.email,
      } as any);

      await expect(authService.register(data))
        .rejects
        .toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login user and return tokens', async () => {
      // Test implementation
    });

    it('should reject invalid credentials', async () => {
      // Test implementation
    });
  });

  // More test suites...
});
```

---

## 🚀 Execution Plan

### Step 1: Setup (10 minutes)
```bash
# Verify vitest config
ls vitest.config.ts

# Update package.json with test scripts
# Already done if following this guide
```

### Step 2: Create Test Files (2 hours)
Priority order:
1. authService.test.ts (30 min)
2. subscriptionService.test.ts (40 min)
3. paymentService.test.ts (expand existing) (20 min)
4. planLimitMiddleware.test.ts (30 min)

### Step 3: Router Tests (1.5 hours)
1. auth.router.test.ts (30 min)
2. subscription.router.test.ts (20 min)
3. payment.router.test.ts (20 min)

### Step 4: Integration Tests (1 hour)
1. auth-flow.integration.test.ts (30 min)
2. subscription-flow.integration.test.ts (30 min)

### Step 5: Run & Report (30 minutes)
```bash
# Run all tests
pnpm test

# Generate coverage report
pnpm test:coverage

# View UI
pnpm test:ui
```

---

## 🧪 Mock Patterns

### Database Mocking
```typescript
import * as db from '../db';
import { vi } from 'vitest';

vi.mock('../db');

// In test:
vi.mocked(db.getUserByEmail).mockResolvedValue(user);
vi.mocked(db.createUser).mockResolvedValue({ id: 1, ...user });
```

### Stripe Mocking
```typescript
import Stripe from 'stripe';
import { vi } from 'vitest';

vi.mock('stripe', () => {
  return {
    default: vi.fn(() => ({
      customers: { create: vi.fn(), retrieve: vi.fn() },
      checkout: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    })),
  };
});
```

### JWT Mocking
```typescript
import * as jose from 'jose';
import { vi } from 'vitest';

vi.mock('jose', async () => {
  const actual = await vi.importActual('jose');
  return {
    ...actual,
    signJWT: vi.fn((payload) => 'mocked_token'),
    verifyJWT: vi.fn((token) => ({ ...payload })),
  };
});
```

---

## 📊 Coverage Goals

```
Target: 80% coverage across:
- Statements: 80%
- Functions: 80%
- Branches: 75%
- Lines: 80%

Critical paths (100% coverage):
- Auth service register/login
- Plan limit checks
- Payment webhook handling
- Subscription upgrades/downgrades
```

---

## ✅ Quality Checklist

Before submitting tests:
- [ ] All tests pass
- [ ] No console errors
- [ ] Coverage > 80%
- [ ] Mocks properly setup
- [ ] No hardcoded values
- [ ] Error cases tested
- [ ] Happy path tested
- [ ] Edge cases covered
- [ ] Comments explain complex tests
- [ ] No duplicate test code

---

## 🎯 Success Criteria

Phase C is complete when:
✅ All 60+ tests passing
✅ Coverage report generated
✅ No console errors
✅ All critical paths tested
✅ Integration flows validated
✅ Test suite runs in < 30 seconds

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev)
- [Vitest Best Practices](https://vitest.dev/guide)
- [Mock Documentation](https://vitest.dev/guide/mocking)
- [Async Testing](https://vitest.dev/guide/testing-async)

---

## 🔄 Next After Phase C

Once all tests pass → **Phase D: Component Refinement**
- Add loading states
- Improve error messages
- Polish UI components
- Production deployment checklist

---

**Ready to begin Phase C? Execute the step-by-step plan above!**
