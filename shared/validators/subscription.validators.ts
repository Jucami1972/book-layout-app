/**
 * Zod validators for subscription
 */

import { z } from 'zod';

export const upgradeRequestSchema = z.object({
  planType: z.enum(['PRO_MONTHLY', 'PRO_YEARLY']),
});

export const downgradeRequestSchema = z.object({
  confirm: z.boolean().refine(val => val === true, 'Debes confirmar el cambio de plan'),
});

export type UpgradeRequestInput = z.infer<typeof upgradeRequestSchema>;
export type DowngradeRequestInput = z.infer<typeof downgradeRequestSchema>;
