/**
 * Subscription Service
 * Handles plan management, upgrades, downgrades, and limit checking
 */

import { eq } from 'drizzle-orm';
import * as db from '../db';
import { users, subscriptionHistory } from '../../drizzle/schema';
import { PLAN_CONFIG } from '../../shared/const/plans';
import type { PlanType } from '../../shared/types/subscription';

export class SubscriptionService {
  /**
   * Get user's current plan limits
   */
  async getPlanLimits(userId: number) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const config = PLAN_CONFIG[user.planType];
    const projectCount = await db.countUserProjects(userId);

    return {
      plan: user.planType,
      isActive: user.planActive,
      canCreateBook: projectCount < config.maxBooks,
      booksRemaining: Math.max(0, config.maxBooks - projectCount),
      maxChaptersPerBook: config.maxChaptersPerBook,
      canExport: config.canExport,
      canUploadCover: config.canUploadCover,
      canUseAI: config.canUseAI,
      supportLevel: config.supportLevel,
    };
  }

  /**
   * Upgrade to PRO monthly
   */
  async upgradeToProMonthly(userId: number) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Update user
    await db.updateUser(userId, {
      planType: 'PRO_MONTHLY',
      planActive: true,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate,
    });

    // Log subscription change
    await db.database.insert(subscriptionHistory).values({
      userId,
      oldPlan: user.planType,
      newPlan: 'PRO_MONTHLY',
      reason: 'UPGRADE',
      effectiveDate: new Date(),
    });

    return { success: true, message: 'Actualizado a PRO Mensual' };
  }

  /**
   * Upgrade to PRO yearly
   */
  async upgradeToProYearly(userId: number) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Update user
    await db.updateUser(userId, {
      planType: 'PRO_YEARLY',
      planActive: true,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: endDate,
    });

    // Log subscription change
    await db.database.insert(subscriptionHistory).values({
      userId,
      oldPlan: user.planType,
      newPlan: 'PRO_YEARLY',
      reason: 'UPGRADE',
      effectiveDate: new Date(),
    });

    return { success: true, message: 'Actualizado a PRO Anual' };
  }

  /**
   * Downgrade to FREE
   */
  async downgradeToFree(userId: number) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    // Check if user has more than 1 project or 5 chapters
    const projectCount = await db.countUserProjects(userId);
    if (projectCount > 1) {
      throw new Error('Debes eliminar proyectos antes de cambiar a plan gratuito');
    }

    // Update user
    await db.updateUser(userId, {
      planType: 'FREE',
      planActive: true,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
    });

    // Log subscription change
    await db.database.insert(subscriptionHistory).values({
      userId,
      oldPlan: user.planType,
      newPlan: 'FREE',
      reason: 'DOWNGRADE',
      effectiveDate: new Date(),
    });

    return { success: true, message: 'Downgradeado a plan Gratuito' };
  }

  /**
   * Check if user can create a new project
   */
  async canCreateProject(userId: number): Promise<boolean> {
    const limits = await this.getPlanLimits(userId);
    return limits.canCreateBook;
  }

  /**
   * Check if user can create a new chapter
   */
  async canCreateChapter(userId: number, projectId: number): Promise<boolean> {
    const project = await db.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');
    if (project.userId !== userId) throw new Error('No autorizado');

    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const config = PLAN_CONFIG[user.planType];
    const chapterCount = await db.countProjectChapters(projectId);

    return chapterCount < config.maxChaptersPerBook;
  }

  /**
   * Check if user can export
   */
  async canExport(userId: number): Promise<boolean> {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const config = PLAN_CONFIG[user.planType];
    return config.canExport;
  }

  /**
   * Check if user can upload cover
   */
  async canUploadCover(userId: number): Promise<boolean> {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const config = PLAN_CONFIG[user.planType];
    return config.canUploadCover;
  }

  /**
   * Check subscription status (renewal, expiration, etc)
   */
  async checkSubscriptionStatus(userId: number) {
    const user = await db.getUserById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const now = new Date();
    const isExpired =
      user.subscriptionEndDate && user.subscriptionEndDate < now;

    if (isExpired && user.planType !== 'FREE') {
      // Auto-downgrade if subscription expired
      await this.downgradeToFree(userId);
      return { status: 'expired', message: 'Suscripción expirada, downgradeado a FREE' };
    }

    return {
      status: 'active',
      plan: user.planType,
      endDate: user.subscriptionEndDate,
    };
  }
}

export const subscriptionService = new SubscriptionService();
