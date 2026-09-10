import "server-only";

import { UUID_RE } from "@/lib/utils";

// ponytail: removed requireBillingManager/getOrCreateBillingAccount/writeAuditLog/requireAdmin/databaseError 2026-09-07 — zero importers; canonical audit=@/lib/audit, admin=auth.requireAdmin. isUuid delegates to UUID_RE.
export function isUuid(value: string) {
  return UUID_RE.test(value);
}
