// ── Authentication ──
export const BCRYPT_SALT_ROUNDS = 12;

// ── Rate Limiting ──
export const GLOBAL_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const GLOBAL_RATE_LIMIT_MAX = 200;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const AUTH_RATE_LIMIT_MAX = 10; // login/register attempts

// ── Pagination ──
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;

// ── Cache TTL (seconds) ──
export const CACHE_TTL_DASHBOARD = 60;
export const CACHE_TTL_FILTER_OPTIONS = 300;

// ── Bulk Operations ──
export const BULK_IMPORT_MAX_ITEMS = 1000;

// ── Request Body Limits ──
export const JSON_BODY_LIMIT = '10mb';

// ── Allowed inventory fields for update (whitelist) ──
export const INVENTORY_UPDATABLE_FIELDS = [
  'name', 'ipAddress', 'serialNumber', 'vendor', 'model',
  'cpu', 'ram', 'storage', 'os', 'rack', 'cabinet',
  'rackPosition', 'status', 'warrantyDate', 'notes',
] as const;

// ── Allowed site fields for update (whitelist) ──
export const SITE_UPDATABLE_FIELDS = ['name', 'code'] as const;