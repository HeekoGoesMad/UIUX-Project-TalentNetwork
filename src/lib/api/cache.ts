/**
 * Standard HTTP Cache-Control header presets for API responses.
 *
 * Data Classification:
 * - PUBLIC_STATIC: Static or low-volatility public data (e.g. partner campuses, token packages).
 * - PUBLIC_PERIODIC: Periodically changing public data (e.g. public published jobs listing).
 * - PUBLIC_DETAIL: Public individual records (e.g. public candidate profile, public job detail).
 * - PRIVATE_NO_STORE: Authenticated, user-specific, or security-sensitive data (bootstrap,
 *   token ledger, notifications, messages, conversations, applications, shortlists, screenings).
 */
export const CACHE_HEADERS = {
  PUBLIC_STATIC: {
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  },
  PUBLIC_PERIODIC: {
    "Cache-Control": "public, max-age=15, s-maxage=30, stale-while-revalidate=60",
  },
  PUBLIC_DETAIL: {
    "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
  },
  PRIVATE_NO_STORE: {
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  },
} as const;
