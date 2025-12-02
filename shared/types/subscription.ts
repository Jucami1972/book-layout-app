/**
 * Subscription and Plan types
 */

export type PlanType = 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired';
export type BillingPeriod = 'monthly' | 'yearly' | 'free';

export type PlanConfig = {
  maxBooks: number;
  maxChaptersPerBook: number;
  canExport: boolean;
  canUploadCover: boolean;
  canUseAI: boolean;
  supportLevel: 'none' | 'email' | 'priority';
  price: number;
  billingPeriod: BillingPeriod;
  features: string[];
};

export type PlanLimits = {
  canCreateBook: boolean;
  booksRemaining: number;
  canCreateChapter: boolean;
  chaptersRemaining: number;
  canExport: boolean;
  canUploadCover: boolean;
  canUseAI: boolean;
};

export type SubscriptionStatus_ = {
  plan: PlanType;
  isActive: boolean;
  currentPeriodEnd: Date | null;
  canUpgrade: boolean;
  canDowngrade: boolean;
};

export type UpgradeRequest = {
  planType: 'PRO_MONTHLY' | 'PRO_YEARLY';
};

export type DowngradeRequest = {
  confirm: boolean;
};

export type Subscription = {
  id: number;
  userId: number;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubscriptionHistory = {
  id: number;
  userId: number;
  oldPlan: PlanType;
  newPlan: PlanType;
  reason: 'UPGRADE' | 'DOWNGRADE' | 'CANCELED' | 'RENEWAL' | 'MANUAL_CHANGE';
  effectiveDate: Date;
  createdAt: Date;
};
