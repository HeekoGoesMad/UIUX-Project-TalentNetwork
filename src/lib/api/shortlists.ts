import { and, eq } from "drizzle-orm";

import { schema, type Database } from "@/db";

export const DEFAULT_SHORTLIST_NAME = "Kandidat Baru";

type ShortlistDb = Pick<Database, "insert" | "select">;

export async function ensureDefaultShortlist(db: ShortlistDb, organizationId: string, createdBy: string) {
  const [created] = await db.insert(schema.shortlists).values({
    organizationId,
    createdBy,
    name: DEFAULT_SHORTLIST_NAME,
    description: "Kandidat yang baru ditemukan oleh tim recruiter.",
  }).onConflictDoNothing({
    target: [schema.shortlists.organizationId, schema.shortlists.name],
  }).returning({ id: schema.shortlists.id });

  if (created) return created;

  const [existing] = await db.select({ id: schema.shortlists.id })
    .from(schema.shortlists)
    .where(and(
      eq(schema.shortlists.organizationId, organizationId),
      eq(schema.shortlists.name, DEFAULT_SHORTLIST_NAME),
    ))
    .limit(1);

  return existing ?? null;
}
