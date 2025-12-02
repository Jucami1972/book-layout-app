/**
 * Plan Limit Middleware
 * Validates user actions against their plan limits
 */

import { TRPCError } from '@trpc/server';
import { subscriptionService } from '../services/subscriptionService';

export class PlanLimitError extends Error {
  constructor(
    public code: 'LIMIT_EXCEEDED' | 'FEATURE_NOT_AVAILABLE',
    message: string
  ) {
    super(message);
  }
}

/**
 * Check if user can create a new project
 */
export async function checkCanCreateProject(userId: number) {
  const canCreate = await subscriptionService.canCreateProject(userId);
  if (!canCreate) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Has alcanzado el límite de libros. Actualiza a PRO para crear más.',
    });
  }
}

/**
 * Check if user can create a new chapter
 */
export async function checkCanCreateChapter(userId: number, projectId: number) {
  const canCreate = await subscriptionService.canCreateChapter(userId, projectId);
  if (!canCreate) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Has alcanzado el límite de capítulos. Actualiza a PRO para crear más.',
    });
  }
}

/**
 * Check if user can export
 */
export async function checkCanExport(userId: number) {
  const canExport = await subscriptionService.canExport(userId);
  if (!canExport) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'La exportación está disponible solo para usuarios PRO. Actualiza tu plan para descargar tu libro.',
    });
  }
}

/**
 * Check if user can upload cover
 */
export async function checkCanUploadCover(userId: number) {
  const canUpload = await subscriptionService.canUploadCover(userId);
  if (!canUpload) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Las portadas personalizadas están disponibles solo para usuarios PRO.',
    });
  }
}
