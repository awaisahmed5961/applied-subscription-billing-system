export const ERROR_MESSAGES = {
  BAD_REQUEST: 'Invalid request data',
  UNAUTHORIZED: 'Authentication token is missing or invalid',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred',
  CONFLICT: 'Resource already exists',
} as const;
