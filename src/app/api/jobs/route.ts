import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

const jobSchema = z.object({
  title: z.string().trim().min(2).max(160), description: z.string().trim().min(10).max(20_000),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]),
  workArrangement: z.enum(["onsite", "hybrid", "remote"]), location: z.string().trim().max(160).nullable().optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  preferredSkills: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

function dbError() { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
async function recruiterContext() {
  const current = await getCurrentAppUser();
  if ("error" in current) return { error: current.error ?? "Autentikasi diperlukan.", status: current.status } as const;
  const scope = await getRecruiterScope(current.db, current.user);
  if ("error" in scope) return { error: scope.error ?? "Recruiter tidak memiliki akses.", status: scope.status } as const;
  return { ...current, scope } as const;
}

async function jobRows(db: Awaited<ReturnType<typeof getDb>>, where: ReturnType<typeof eq> | ReturnType<typeof and>, paging: { limit: number; offset: number }) {
  const jobs = await db.select({ job: schema.jobs, organizationName: schema.organizations.name }).from(schema.jobs)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
    .where(where).orderBy(desc(schema.jobs.updatedAt)).limit(paging.limit + 1).offset(paging.offset);
  const hasMore = jobs.length > paging.limit;
  const pageJobs = hasMore ? jobs.slice(0, paging.limit) : jobs;
  if (pageJobs.length === 0) return { jobs: [] as JobRow[], hasMore: false };
  const requirements = await db.select({ id: schema.jobRequirements.id, jobId: schema.jobRequirements.jobId, type: schema.jobRequirements.type, name: schema.jobRequirements.name })
    .from(schema.jobRequirements).where(inArray(schema.jobRequirements.jobId, pageJobs.map((row) => row.job.id)));
  const byJob = new Map<string, JobRow["requirements"]>();
  for (const requirement of requirements) {
    const list = byJob.get(requirement.jobId) ?? [];
    list.push({ id: requirement.id, type: requirement.type, name: requirement.name });
    byJob.set(requirement.jobId, list);
  }
  return {
    jobs: pageJobs.map((row) => ({ ...row.job, organizationName: row.organizationName, requirements: byJob.get(row.job.id) ?? [] }) as JobRow),
    hasMore,
  };
}
type JobRow = Record<string, unknown> & { id: string; requirements: Array<{ id: string; type: "required" | "preferred"; name: string }>; organizationName: string };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const query = url.searchParams.get("q")?.trim(); const status = url.searchParams.get("status");
    const paged = paginationSchema.safeParse({ page: url.searchParams.get("page") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    if (!paged.success) return NextResponse.json({ error: "Parameter pagination tidak valid." }, { status: 400 });
    const { page, limit } = paged.data; const offset = (page - 1) * limit;
    const current = await getCurrentAppUser();
    const db = "error" in current ? getDb() : current.db;
    const recruiter = !("error" in current) && current.user.role === "recruiter";
    let where = recruiter ? undefined : eq(schema.jobs.status, "published");
    if (recruiter) {
      const scope = await getRecruiterScope(db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
      where = eq(schema.jobs.organizationId, scope.membership.organizationId);
      if (status && ["draft", "published", "closed", "archived"].includes(status)) where = and(where, eq(schema.jobs.status, status as "draft" | "published" | "closed" | "archived"));
    }
    if (!where) return dbError();
    if (query) where = and(where, or(ilike(schema.jobs.title, `%${query}%`), ilike(schema.jobs.description, `%${query}%`)));
    const { jobs, hasMore } = await jobRows(db, where, { limit, offset });
    return NextResponse.json({ jobs, page, limit, hasMore });
  } catch { return dbError(); }
}

export async function POST(request: Request) {
  try {
    const parsed = jobSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Data job tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    const current = await recruiterContext(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const values = parsed.data; const [job] = await current.db.insert(schema.jobs).values({ organizationId: current.scope.membership.organizationId, createdBy: current.user.id, title: values.title, description: values.description, employmentType: values.employmentType, workArrangement: values.workArrangement, location: values.location ?? null }).returning();
    const requirements = [...values.requiredSkills.map((name) => ({ jobId: job.id, name, type: "required" as const })), ...values.preferredSkills.map((name) => ({ jobId: job.id, name, type: "preferred" as const }))];
    if (requirements.length) await current.db.insert(schema.jobRequirements).values(requirements);
    return NextResponse.json({ job: { ...job, requirements } }, { status: 201 });
  } catch { return dbError(); }
}
