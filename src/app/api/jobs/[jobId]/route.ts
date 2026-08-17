import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getRecruiterScope } from "@/lib/api/auth";

const updateSchema = z.object({ title: z.string().trim().min(2).max(160).optional(), description: z.string().trim().min(10).max(20_000).optional(), employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]).optional(), workArrangement: z.enum(["onsite", "hybrid", "remote"]).optional(), location: z.string().trim().max(160).nullable().optional(), status: z.enum(["draft", "published", "closed"]).optional(), requiredSkills: z.array(z.string().trim().min(1).max(120)).max(30).optional(), preferredSkills: z.array(z.string().trim().min(1).max(120)).max(30).optional() });
const allowedTransitions: Record<string, string[]> = { draft: ["published", "closed"], published: ["closed"], closed: [], archived: [] };
function unavailable() { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }

async function load(db: Awaited<ReturnType<typeof import("@/db").getDb>>, jobId: string, organizationId?: string) {
  const rows = await db.select({ job: schema.jobs, organizationName: schema.organizations.name, requirement: schema.jobRequirements }).from(schema.jobs).innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId)).leftJoin(schema.jobRequirements, eq(schema.jobRequirements.jobId, schema.jobs.id)).where(and(eq(schema.jobs.id, jobId), organizationId ? eq(schema.jobs.organizationId, organizationId) : eq(schema.jobs.status, "published")));
  if (!rows.length) return null;
  return { ...rows[0].job, organizationName: rows[0].organizationName, requirements: rows.filter((row) => row.requirement).map((row) => ({ id: row.requirement!.id, type: row.requirement!.type, name: row.requirement!.name })) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try { const { jobId } = await params; const current = await import("@/lib/api/auth").then(({ getCurrentAppUser }) => getCurrentAppUser()); const db = "error" in current ? (await import("@/db")).getDb() : current.db; const recruiter = !("error" in current) && current.user.role === "recruiter"; let organizationId: string | undefined;
    if (recruiter) { const scope = await getRecruiterScope(db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status }); organizationId = scope.membership.organizationId; }
    const job = await load(db, jobId, organizationId); return job ? NextResponse.json({ job }) : NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });
  } catch { return unavailable(); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try { const parsed = updateSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Data job tidak valid." }, { status: 400 }); const current = await (await import("@/lib/api/auth")).getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status }); const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status }); const { jobId } = await params;
    const existing = await current.db.select({ id: schema.jobs.id, status: schema.jobs.status }).from(schema.jobs).where(and(eq(schema.jobs.id, jobId), eq(schema.jobs.organizationId, scope.membership.organizationId))).limit(1); if (!existing[0]) return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });
    const next = parsed.data.status; if (next && next !== existing[0].status && !allowedTransitions[existing[0].status].includes(next)) return NextResponse.json({ error: `Transisi status ${existing[0].status} ke ${next} tidak diizinkan.` }, { status: 409 });
    const { requiredSkills, preferredSkills, status, ...fields } = parsed.data; const now = new Date(); const update = { ...fields, ...(status ? { status, publishedAt: status === "published" ? now : undefined, closedAt: status === "closed" ? now : undefined } : {}), updatedAt: now }; await current.db.update(schema.jobs).set(update).where(eq(schema.jobs.id, jobId));
    if (requiredSkills || preferredSkills) { await current.db.delete(schema.jobRequirements).where(eq(schema.jobRequirements.jobId, jobId)); const requirements = [...(requiredSkills ?? []).map((name) => ({ jobId, name, type: "required" as const })), ...(preferredSkills ?? []).map((name) => ({ jobId, name, type: "preferred" as const }))]; if (requirements.length) await current.db.insert(schema.jobRequirements).values(requirements); }
    const job = await load(current.db, jobId, scope.membership.organizationId); return NextResponse.json({ job });
  } catch { return unavailable(); }
}
