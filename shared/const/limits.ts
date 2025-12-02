/**
 * Global limits and constraints
 */

export const LIMITS = {
  // File sizes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COVER_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CONTENT_LENGTH: 1000000, // characters per chapter

  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,

  // Email
  EMAIL_MAX_LENGTH: 320,
  EMAIL_VALIDATION_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Text fields
  PROJECT_TITLE_MAX_LENGTH: 500,
  PROJECT_SUBTITLE_MAX_LENGTH: 500,
  AUTHOR_MAX_LENGTH: 255,
  CHAPTER_TITLE_MAX_LENGTH: 500,

  // Timing
  PASSWORD_RESET_EXPIRY_MINUTES: 60,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  SESSION_EXPIRY_DAYS: 30,

  // API
  REQUEST_TIMEOUT_MS: 30000,
  MAX_REQUESTS_PER_MINUTE: 60,

  // Export
  MAX_CONCURRENT_EXPORTS: 5,
  EXPORT_TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes

  // Chapters
  MAX_CHAPTER_TITLE_LENGTH: 500,
} as const;

export const PLAN_LIMITS = {
  FREE: {
    maxBooks: 1,
    maxChaptersPerBook: 5,
    maxCoverUploads: 1,
    maxExportsPerMonth: 0,
  },
  PRO_MONTHLY: {
    maxBooks: 100,
    maxChaptersPerBook: 999,
    maxCoverUploads: 100,
    maxExportsPerMonth: 50,
  },
  PRO_YEARLY: {
    maxBooks: 100,
    maxChaptersPerBook: 999,
    maxCoverUploads: 100,
    maxExportsPerMonth: 100,
  },
} as const;
