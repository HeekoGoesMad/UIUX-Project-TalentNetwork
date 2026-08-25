import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
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

function dbError() { return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 }); }
async function recruiterContext() {
  const current = await getCurrentAppUser();
  if ("error" in current) return { error: current.error ?? "Autentikasi diperlukan.", status: current.status } as const;
  const scope = await getRecruiterScope(current.db, current.user);
  if ("error" in scope) return { error: scope.error ?? "Recruiter tidak memiliki akses.", status: scope.status } as const;
  return { ...current, scope } as const;
}

async function jobRows(db: Awaited<ReturnType<typeof getDb>>, where: ReturnType<typeof eq> | ReturnType<typeof and>) {
  const rows = await db.select({ job: schema.jobs, organizationName: schema.organizations.name, requirement: schema.jobRequirements }).from(schema.jobs)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
    .leftJoin(schema.jobRequirements, eq(schema.jobRequirements.jobId, schema.jobs.id)).where(where).orderBy(desc(schema.jobs.updatedAt));
  return rows.reduce<JobRow[]>((all, row) => {
    let item = all.find((candidate) => candidate.id === row.job.id);
    if (!item) { item = { ...row.job, organizationName: row.organizationName, requirements: [] }; all.push(item); }
    if (row.requirement) item.requirements.push({ id: row.requirement.id, type: row.requirement.type, name: row.requirement.name });
    return all;
  }, []);
}
type JobRow = Record<string, unknown> & { id: string; requirements: Array<{ id: string; type: "required" | "preferred"; name: string }>; organizationName: string };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url); const query = url.searchParams.get("q")?.trim(); const status = url.searchParams.get("status");
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
    return NextResponse.json({ jobs: await jobRows(db, where) });
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
