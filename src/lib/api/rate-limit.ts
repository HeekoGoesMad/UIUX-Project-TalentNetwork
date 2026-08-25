const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_ENTRIES = 1000;

export const RATE_LIMITS = {
  ai: { limit: 30, windowMs: 60_000 },
  aiDaily: { limit: 100, windowMs: 86_400_000 },
  cvExport: { limit: 5, windowMs: 60_000 },
  cvImport: { limit: 10, windowMs: 60_000 },
  messages: { limit: 30, windowMs: 60_000 },
  billing: { limit: 10, windowMs: 60_000 },
} as const;

// ponytail: per-serverless-instance memory only; swap for Upstash Redis if multi-instance consistency matters
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  if (buckets.size >= MAX_ENTRIES) {
    for (const [k, v] of buckets) {
      if (v.resetAt <= now) buckets.delete(k);
    }
    while (buckets.size >= MAX_ENTRIES) {
      const oldest = buckets.keys().next().value;
      if (oldest === undefined) break;
      buckets.delete(oldest);
    }
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
