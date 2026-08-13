import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { schema, type Database } from "@/db";
import { getCurrentAppUser, getRecruiterScope, type AppUser } from "@/lib/api/auth";
import { ensureDefaultShortlist } from "@/lib/api/shortlists";

type ShortlistScope = Extract<Awaited<ReturnType<typeof getRecruiterScope>>, { membership: unknown }>;
type ShortlistContext = { db: Database; user: AppUser; scope: ShortlistScope } | { error: string; status: number };

async function getShortlistContext(): Promise<ShortlistContext> {
  const current = await getCurrentAppUser();
  if ("error" in current) return { error: current.error ?? "Autentikasi diperlukan.", status: current.status ?? 401 };
  const scope = await getRecruiterScope(current.db, current.user);
  if ("error" in scope) return { error: scope.error ?? "Recruiter tidak memiliki akses.", status: scope.status ?? 403 };
  return { db: current.db, user: current.user, scope };
}

export async function GET() {
  try {
    const current = await getShortlistContext();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const rows = await current.db.select({
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
    }).from(schema.shortlists)
      .leftJoin(schema.shortlistItems, eq(schema.shortlistItems.shortlistId, schema.shortlists.id))
      .leftJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.shortlistItems.candidateProfileId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.shortlists.organizationId, current.scope.membership.organizationId))
      .orderBy(asc(schema.shortlists.createdAt), asc(schema.shortlistItems.createdAt));

    const shortlists = rows.reduce<Array<Record<string, unknown>>>((result, row) => {
      let shortlist = result.find((item) => item.id === row.id);
      if (!shortlist) {
        shortlist = { id: row.id, name: row.name, description: row.description, createdAt: row.createdAt, updatedAt: row.updatedAt, items: [] };
        result.push(shortlist);
      }
      if (row.itemId) (shortlist.items as unknown[]).push({
        id: row.itemId,
        candidateProfileId: row.candidateProfileId,
        candidate: { name: row.candidateName, role: row.candidateRole, location: row.candidateLocation },
        status: row.status,
        notes: row.notes,
        createdAt: row.itemCreatedAt,
      });
      return result;
    }, []);

    return NextResponse.json({ shortlists });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = z.object({ candidateProfileId: z.string().uuid(), shortlistId: z.string().uuid().optional(), notes: z.string().trim().max(2_000).optional() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Candidate profile ID tidak valid." }, { status: 400 });
    const current = await getShortlistContext();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    await ensureDefaultShortlist(current.db, current.scope.membership.organizationId, current.user.id);
    const shortlist = (await current.db.select({ id: schema.shortlists.id }).from(schema.shortlists).where(and(
      eq(schema.shortlists.organizationId, current.scope.membership.organizationId),
      parsed.data.shortlistId ? eq(schema.shortlists.id, parsed.data.shortlistId) : eq(schema.shortlists.organizationId, current.scope.membership.organizationId),
    )).limit(1))[0];
    if (!shortlist) return NextResponse.json({ error: "Shortlist belum tersedia." }, { status: 404 });
    const candidate = (await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(and(
      eq(schema.candidateProfiles.id, parsed.data.candidateProfileId),
      eq(schema.candidateProfiles.isPublished, true),
    )).limit(1))[0];
    if (!candidate) return NextResponse.json({ error: "Profil kandidat tidak tersedia." }, { status: 404 });
    const [item] = await current.db.insert(schema.shortlistItems).values({ shortlistId: shortlist.id, candidateProfileId: parsed.data.candidateProfileId, notes: parsed.data.notes ?? null }).returning({ id: schema.shortlistItems.id, candidateProfileId: schema.shortlistItems.candidateProfileId, notes: schema.shortlistItems.notes });
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = z.object({ itemId: z.string().uuid(), notes: z.string().trim().max(2_000) }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data catatan shortlist tidak valid." }, { status: 400 });
    const current = await getShortlistContext();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const ownedItem = (await current.db.select({ id: schema.shortlistItems.id }).from(schema.shortlistItems).innerJoin(schema.shortlists, eq(schema.shortlists.id, schema.shortlistItems.shortlistId)).where(and(eq(schema.shortlistItems.id, parsed.data.itemId), eq(schema.shortlists.organizationId, current.scope.membership.organizationId))).limit(1))[0];
    if (!ownedItem) return NextResponse.json({ error: "Item shortlist tidak ditemukan." }, { status: 404 });
    const [item] = await current.db.update(schema.shortlistItems).set({ notes: parsed.data.notes, updatedAt: new Date() }).where(eq(schema.shortlistItems.id, parsed.data.itemId)).returning({ id: schema.shortlistItems.id, notes: schema.shortlistItems.notes });
    if (!item) return NextResponse.json({ error: "Item shortlist tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const parsed = z.object({ itemId: z.string().uuid() }).safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Item shortlist tidak valid." }, { status: 400 });
    const current = await getShortlistContext();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const ownedItem = (await current.db.select({ id: schema.shortlistItems.id }).from(schema.shortlistItems).innerJoin(schema.shortlists, eq(schema.shortlists.id, schema.shortlistItems.shortlistId)).where(and(eq(schema.shortlistItems.id, parsed.data.itemId), eq(schema.shortlists.organizationId, current.scope.membership.organizationId))).limit(1))[0];
    if (!ownedItem) return NextResponse.json({ error: "Item shortlist tidak ditemukan." }, { status: 404 });
    await current.db.delete(schema.shortlistItems).where(eq(schema.shortlistItems.id, parsed.data.itemId));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
