import "server-only";

import { getDb, schema, type Database } from "@/db";

const PRIVATE_KEYS = /password|secret|authorization|cookie|message|body|note|cv|resume|full.?text|content|raw.?payload|provider.?payload|(^|[_-])(access|refresh|api)?token([_-]|$)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > 200 ? `${value.slice(0, 200)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).slice(0, 50).map(([key, item]) => [
      key,
      PRIVATE_KEYS.test(key) ? "[redacted]" : sanitize(item, depth + 1),
    ]));
  }
  return undefined;
}

export async function writeAuditLog(input: {
  db?: Database;
  actorUserId?: string | null;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const db = input.db ?? getDb();
  const [log] = await db.insert(schema.auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    organizationId: input.organizationId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    metadata: (sanitize(input.metadata ?? {}) as Record<string, unknown>) ?? {},
  }).returning();
  return log;
}
