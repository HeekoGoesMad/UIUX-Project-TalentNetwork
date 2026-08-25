import { ShortlistService, DEFAULT_SHORTLIST_NAME } from "@/lib/services/shortlist";
import type { Database } from "@/db";

export { DEFAULT_SHORTLIST_NAME };

type ShortlistDb = Pick<Database, "insert" | "select" | "update" | "delete">;

export async function ensureDefaultShortlist(db: ShortlistDb, organizationId: string, createdBy: string) {
  return ShortlistService.ensureDefault(db, organizationId, createdBy);
}
