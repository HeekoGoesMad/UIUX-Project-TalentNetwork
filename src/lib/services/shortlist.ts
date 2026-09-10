import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { writeAuditLog } from "@/lib/audit";

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
   * List shortlists and their candidate items for an organization (paginated).
   */
  static async list(db: Database, organizationId: string, opts?: { page?: number; limit?: number }) {
    const page = Math.max(1, Math.floor(opts?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(opts?.limit ?? 24)));
    const offset = (page - 1) * limit;

    const lists = await db
      .select({
        id: schema.shortlists.id,
        name: schema.shortlists.name,
        description: schema.shortlists.description,
        createdAt: schema.shortlists.createdAt,
        updatedAt: schema.shortlists.updatedAt,
      })
      .from(schema.shortlists)
      .where(eq(schema.shortlists.organizationId, organizationId))
      .orderBy(asc(schema.shortlists.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = lists.length > limit;
    const pageLists = hasMore ? lists.slice(0, limit) : lists;
    if (pageLists.length === 0) return { shortlists: [], page, limit, hasMore: false };

    const items = await db
      .select({
        shortlistId: schema.shortlistItems.shortlistId,
        itemId: schema.shortlistItems.id,
        candidateProfileId: schema.shortlistItems.candidateProfileId,
        candidateName: schema.profiles.displayName,
        candidateRole: schema.candidateProfiles.headline,
        candidateLocation: schema.candidateProfiles.location,
        status: schema.shortlistItems.status,
        notes: schema.shortlistItems.notes,
        itemCreatedAt: schema.shortlistItems.createdAt,
      })
      .from(schema.shortlistItems)
      .leftJoin(
        schema.candidateProfiles,
        eq(schema.candidateProfiles.id, schema.shortlistItems.candidateProfileId)
      )
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(inArray(schema.shortlistItems.shortlistId, pageLists.map((list) => list.id)))
      .orderBy(asc(schema.shortlistItems.createdAt));

    const shortlists = pageLists.map((list) => ({ ...list, items: [] as unknown[] }));
    const shortlistMap = new Map(shortlists.map((item) => [item.id, item]));
    for (const row of items) {
      const shortlist = shortlistMap.get(row.shortlistId);
      if (!shortlist || !row.itemId) continue;
      shortlist.items.push({
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

    return { shortlists, page, limit, hasMore };
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
    return db.transaction(async (tx) => {
      await this.ensureDefault(tx, params.organizationId, params.createdBy);

      const [shortlist] = await tx
        .select({ id: schema.shortlists.id })
        .from(schema.shortlists)
        .where(
          params.shortlistId
            ? and(
                eq(schema.shortlists.organizationId, params.organizationId),
                eq(schema.shortlists.id, params.shortlistId)
              )
            : and(
                eq(schema.shortlists.organizationId, params.organizationId),
                eq(schema.shortlists.name, DEFAULT_SHORTLIST_NAME)
              )
        )
        .orderBy(asc(schema.shortlists.createdAt))
        .limit(1);

      if (!shortlist) {
        return { error: "Shortlist belum tersedia.", status: 404 as const };
      }

      const [candidate] = await tx
        .select({ id: schema.candidateProfiles.id })
        .from(schema.candidateProfiles)
        .where(
          and(
            eq(schema.candidateProfiles.id, params.candidateProfileId),
            eq(schema.candidateProfiles.isPublished, true)
          )
        )
        .limit(1);

      if (!candidate) {
        return { error: "Profil kandidat tidak tersedia.", status: 404 as const };
      }

      const [inserted] = await tx
        .insert(schema.shortlistItems)
        .values({
          shortlistId: shortlist.id,
          candidateProfileId: params.candidateProfileId,
          notes: params.notes ?? null,
        })
        .onConflictDoNothing({
          target: [schema.shortlistItems.shortlistId, schema.shortlistItems.candidateProfileId],
        })
        .returning({
          id: schema.shortlistItems.id,
          candidateProfileId: schema.shortlistItems.candidateProfileId,
          notes: schema.shortlistItems.notes,
        });

      if (inserted) {
        await writeAuditLog({
          db: tx,
          actorUserId: params.createdBy,
          organizationId: params.organizationId,
          action: "shortlist.item.added",
          entityType: "shortlist_item",
          entityId: inserted.id,
          metadata: { shortlistId: shortlist.id, candidateProfileId: params.candidateProfileId },
        });
        return { item: inserted };
      }

      const [existing] = await tx
        .select({
          id: schema.shortlistItems.id,
          candidateProfileId: schema.shortlistItems.candidateProfileId,
          notes: schema.shortlistItems.notes,
        })
        .from(schema.shortlistItems)
        .where(
          and(
            eq(schema.shortlistItems.shortlistId, shortlist.id),
            eq(schema.shortlistItems.candidateProfileId, params.candidateProfileId)
          )
        )
        .limit(1);

      if (existing) {
        await writeAuditLog({
          db: tx,
          actorUserId: params.createdBy,
          organizationId: params.organizationId,
          action: "shortlist.item.added",
          entityType: "shortlist_item",
          entityId: existing.id,
          metadata: {
            shortlistId: shortlist.id,
            candidateProfileId: params.candidateProfileId,
            idempotent: true,
          },
        });
      }

      return { item: existing, idempotent: true as const };
    });
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

    try {
      await writeAuditLog({
        db,
        organizationId,
        action: "shortlist.item.removed",
        entityType: "shortlist_item",
        entityId: itemId,
      });
    } catch (error) {
      console.error("Shortlist audit log failed", error);
    }

    return { ok: true };
  }
}
