import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema, type Database } from "@/db";

export const uuidSchema = z.string().uuid();
export const verificationTypeSchema = z.enum(["identity", "email", "phone", "education", "employment", "certification", "portfolio"]);
export const verificationStatusSchema = z.enum(["pending", "verified", "expired", "revoked", "disputed"]);

export async function candidateProfileForUser(db: Database, userId: string) {
  const [profile] = await db.select({ id: schema.candidateProfiles.id })
    .from(schema.candidateProfiles)
    .where(eq(schema.candidateProfiles.userId, userId)).limit(1);
  return profile ?? null;
}

export async function ownedCvDocument(db: Database, documentId: string, userId: string) {
  const [row] = await db.select({ document: schema.cvDocuments, profileUserId: schema.candidateProfiles.userId })
    .from(schema.cvDocuments)
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.cvDocuments.candidateProfileId))
    .where(and(eq(schema.cvDocuments.id, documentId), eq(schema.candidateProfiles.userId, userId))).limit(1);
  return row?.document ?? null;
}
