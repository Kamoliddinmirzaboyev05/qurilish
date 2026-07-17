export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 50,
} as const;

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 120,
  PASSWORD_MIN: 8,
  BIO_MAX: 1000,
  ORGANIZATION_MAX: 160,
  SPECIALIZATION_MAX: 120,
  PROBLEM_TITLE_MIN: 10,
  PROBLEM_TITLE_MAX: 120,
  PROBLEM_DESCRIPTION_MIN: 50,
  PROBLEM_DESCRIPTION_MAX: 5000,
  PROPOSAL_SOLUTION_MIN: 50,
  PROPOSAL_SOLUTION_MAX: 3000,
  ESTIMATED_DAYS_MIN: 1,
  ESTIMATED_DAYS_MAX: 3650,
} as const;

export const UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_MIME_TYPES: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
  ALLOWED_EXTENSIONS: [".pdf", ".jpg", ".jpeg", ".png"],
} as const;

export const PHONE_REGEX = /^\+998\d{9}$/;
