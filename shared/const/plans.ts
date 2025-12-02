/**
 * Plan configurations and pricing
 */

import type { PlanType, PlanConfig } from '../types/subscription';

export const PLAN_CONFIG: Record<PlanType, PlanConfig> = {
  FREE: {
    maxBooks: 1,
    maxChaptersPerBook: 5,
    canExport: false,
    canUploadCover: false,
    canUseAI: false,
    supportLevel: 'none',
    price: 0,
    billingPeriod: 'free',
    features: [
      '1 libro',
      '5 capítulos máximo',
      'Editor de texto básico',
      'Vista previa',
      'No exportación',
    ],
  },
  PRO_MONTHLY: {
    maxBooks: 100,
    maxChaptersPerBook: 999,
    canExport: true,
    canUploadCover: true,
    canUseAI: true,
    supportLevel: 'email',
    price: 9.99,
    billingPeriod: 'monthly',
    features: [
      'Libros ilimitados',
      'Capítulos ilimitados',
      'Exportar a PDF/EPUB',
      'Portada personalizada',
      'Soporte por email',
      'Tabla de contenidos automática',
      'Asistencia IA básica',
    ],
  },
  PRO_YEARLY: {
    maxBooks: 100,
    maxChaptersPerBook: 999,
    canExport: true,
    canUploadCover: true,
    canUseAI: true,
    supportLevel: 'priority',
    price: 99.99,
    billingPeriod: 'yearly',
    features: [
      'Todo lo de PRO Mensual',
      'Ahorro de 17% vs mensual',
      'Soporte prioritario',
      'Actualizaciones futuras incluidas',
    ],
  },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  FREE: 'Gratuito',
  PRO_MONTHLY: 'PRO Mensual',
  PRO_YEARLY: 'PRO Anual',
};

export const PLAN_COLORS: Record<PlanType, string> = {
  FREE: 'gray',
  PRO_MONTHLY: 'blue',
  PRO_YEARLY: 'purple',
};

export const YEARLY_DISCOUNT_PERCENTAGE = 17; // 17% off
