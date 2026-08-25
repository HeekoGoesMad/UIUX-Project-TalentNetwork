import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { schema, type Database } from "@/db";

export const DEFAULT_SHORTLIST_NAME = "Kandidat Baru";

type ShortlistDb = Pick<Database, "insert" | "select" | "update" | "delete">;

export class ShortlistService {
  /**
   * Ensure default shortlist exists for an organization.
   */
  static async ensureDefault(db: ShortlistDb, organizationId: string, createdBy: string) {
    const [created] = await db
      .insert(schema.shortlists)
      .values({
        organizationId,
        createdBy,
        name: DEFAULT_SHORTLIST_NAME,
        description: "Kandidat yang baru ditemukan oleh tim recruiter.",
      })
      .onConflictDoNothing({
        target: [schema.shortlists.organizationId, schema.shortlists.name],
      })
      .returning({ id: schema.shortlists.id });

    if (created) return created;

    const [existing] = await db
      .select({ id: schema.shortlists.id })
      .from(schema.shortlists)
      .where(
        and(
          eq(schema.shortlists.organizationId, organizationId),
          eq(schema.shortlists.name, DEFAULT_SHORTLIST_NAME)
        )
      )
      .limit(1);

    return existing ?? null;
  }

  /**
   * List all shortlists and their candidate items for an organization.
   */
  static async list(db: Database, organizationId: string) {
    const rows = await db
      .select({
        id: schema.shortlists.id,
        name: schema.shortlists.name,
        description: schema.shortlists.description,
        createdAt: schema.shortlists.createdAt,
        updatedAt: schema.shortlists.updatedAt,
        itemId: schema.shortlistItems.id,
        candidateProfileId: schema.shortlistItems.candidateProfileId,
        candidateName: schema.profiles.displayName,
        candidateRole: schema.candidateProfiles.headline,
        candidateLocation: schema.candidateProfiles.location,
        status: schema.shortlistItems.status,
        notes: schema.shortlistItems.notes,
        itemCreatedAt: schema.shortlistItems.createdAt,
      })
      .from(schema.shortlists)
      .leftJoin(schema.shortlistItems, eq(schema.shortlistItems.shortlistId, schema.shortlists.id))
      .leftJoin(
        schema.candidateProfiles,
        eq(schema.candidateProfiles.id, schema.shortlistItems.candidateProfileId)
      )
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.shortlists.organizationId, organizationId))
      .orderBy(asc(schema.shortlists.createdAt), asc(schema.shortlistItems.createdAt));

    const shortlists = rows.reduce<Array<Record<string, unknown>>>((result, row) => {
      let shortlist = result.find((item) => item.id === row.id);
      if (!shortlist) {
        shortlist = {
          id: row.id,
          name: row.name,
          description: row.description,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          items: [],
        };
        result.push(shortlist);
      }
      if (row.itemId) {
        (shortlist.items as unknown[]).push({
          id: row.itemId,
          candidateProfileId: row.candidateProfileId,
          candidate: {
            name: row.candidateName,
            role: row.candidateRole,
            location: row.candidateLocation,
          },
          status: row.status,
          notes: row.notes,
          createdAt: row.itemCreatedAt,
        });
      }
      return result;
    }, []);

    return { shortlists };
  }

  /**
   * Add a candidate to a shortlist.
   */
  static async addItem(
    db: Database,
    params: {
      organizationId: string;
      createdBy: string;
      candidateProfileId: string;
      shortlistId?: string;
      notes?: string | null;
    }
  ) {
    await this.ensureDefault(db, params.organizationId, params.createdBy);

    const shortlist = (
      await db
        .select({ id: schema.shortlists.id })
        .from(schema.shortlists)
        .where(
          and(
            eq(schema.shortlists.organizationId, params.organizationId),
            params.shortlistId
              ? eq(schema.shortlists.id, params.shortlistId)
              : eq(schema.shortlists.organizationId, params.organizationId)
          )
        )
        .limit(1)
    )[0];

    if (!shortlist) {
      return { error: "Shortlist belum tersedia.", status: 404 as const };
    }

    const candidate = (
      await db
        .select({ id: schema.candidateProfiles.id })
        .from(schema.candidateProfiles)
        .where(
          and(
            eq(schema.candidateProfiles.id, params.candidateProfileId),
            eq(schema.candidateProfiles.isPublished, true)
          )
        )
        .limit(1)
    )[0];

    if (!candidate) {
      return { error: "Profil kandidat tidak tersedia.", status: 404 as const };
    }

    const [item] = await db
      .insert(schema.shortlistItems)
      .values({
        shortlistId: shortlist.id,
        candidateProfileId: params.candidateProfileId,
        notes: params.notes ?? null,
      })
      .returning({
        id: schema.shortlistItems.id,
        candidateProfileId: schema.shortlistItems.candidateProfileId,
        notes: schema.shortlistItems.notes,
      });

    return { item };
  }

  /**
   * Update candidate notes in a shortlist item.
   */
  static async updateNote(
    db: Database,
    organizationId: string,
    itemId: string,
    notes: string
  ) {
    const ownedItem = (
      await db
        .select({ id: schema.shortlistItems.id })
        .from(schema.shortlistItems)
        .innerJoin(schema.shortlists, eq(schema.shortlists.id, schema.shortlistItems.shortlistId))
        .where(
          and(
            eq(schema.shortlistItems.id, itemId),
            eq(schema.shortlists.organizationId, organizationId)
          )
        )
        .limit(1)
    )[0];

    if (!ownedItem) {
      return { error: "Item shortlist tidak ditemukan.", status: 404 as const };
    }

    const [item] = await db
      .update(schema.shortlistItems)
      .set({ notes, updatedAt: new Date() })
      .where(eq(schema.shortlistItems.id, itemId))
      .returning({ id: schema.shortlistItems.id, notes: schema.shortlistItems.notes });

    return { item };
  }

  /**
   * Remove an item from a shortlist.
   */
  static async removeItem(db: Database, organizationId: string, itemId: string) {
    const ownedItem = (
      await db
        .select({ id: schema.shortlistItems.id })
        .from(schema.shortlistItems)
        .innerJoin(schema.shortlists, eq(schema.shortlists.id, schema.shortlistItems.shortlistId))
        .where(
          and(
            eq(schema.shortlistItems.id, itemId),
            eq(schema.shortlists.organizationId, organizationId)
          )
        )
        .limit(1)
    )[0];

    if (!ownedItem) {
      return { error: "Item shortlist tidak ditemukan.", status: 404 as const };
    }

    await db.delete(schema.shortlistItems).where(eq(schema.shortlistItems.id, itemId));
    return { ok: true };
  }
}
