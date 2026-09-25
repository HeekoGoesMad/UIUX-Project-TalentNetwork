import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

const jobSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(20_000),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship", "temporary"]),
  workArrangement: z.enum(["onsite", "hybrid", "remote"]),
  location: z.string().trim().max(160).nullable().optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  preferredSkills: z.array(z.string().trim().min(1).max(120)).max(30).default([]),
  // Kompensasi & Gaji
  salaryMin: z.number().int().min(0).nullable().optional(),
  salaryMax: z.number().int().min(0).nullable().optional(),
  salaryCurrency: z.string().trim().default("IDR"),
  salaryPeriod: z.enum(["monthly", "hourly", "yearly"]).default("monthly"),
  isSalaryNegotiable: z.boolean().default(false),
  hideSalary: z.boolean().default(false),
  // Kriteria & Spesifikasi
  experienceLevel: z.string().trim().nullable().optional(),
  minEducation: z.string().trim().nullable().optional(),
  jobCategory: z.string().trim().nullable().optional(),
  responsibilities: z.string().trim().nullable().optional(),
  qualifications: z.string().trim().nullable().optional(),
  benefits: z.array(z.string().trim()).default([]),
  vacanciesCount: z.number().int().min(1).default(1),
  expiresAt: z.string().datetime().nullable().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

function dbError(error?: unknown) {
  if (error) {
    console.error("[GET/POST /api/jobs Database Error]:", error);
  }
  return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
}

async function recruiterContext() {
  const current = await getCurrentAppUser();
  if ("error" in current) return { error: current.error ?? "Autentikasi diperlukan.", status: current.status } as const;
  const scope = await getRecruiterScope(current.db, current.user);
  if ("error" in scope) return { error: scope.error ?? "Recruiter tidak memiliki akses.", status: scope.status } as const;
  return { ...current, scope } as const;
}

async function jobRows(
  db: Awaited<ReturnType<typeof getDb>>,
  where: ReturnType<typeof eq> | ReturnType<typeof and>,
  paging: { limit: number; offset: number }
) {
  const jobs = await db
    .select({
      id: schema.jobs.id,
      organizationId: schema.jobs.organizationId,
      title: schema.jobs.title,
      description: schema.jobs.description,
      employmentType: schema.jobs.employmentType,
      workArrangement: schema.jobs.workArrangement,
      location: schema.jobs.location,
      status: schema.jobs.status,
      salaryMin: schema.jobs.salaryMin,
      salaryMax: schema.jobs.salaryMax,
      salaryCurrency: schema.jobs.salaryCurrency,
      salaryPeriod: schema.jobs.salaryPeriod,
      isSalaryNegotiable: schema.jobs.isSalaryNegotiable,
      hideSalary: schema.jobs.hideSalary,
      experienceLevel: schema.jobs.experienceLevel,
      minEducation: schema.jobs.minEducation,
      jobCategory: schema.jobs.jobCategory,
      responsibilities: schema.jobs.responsibilities,
      qualifications: schema.jobs.qualifications,
      benefits: schema.jobs.benefits,
      vacanciesCount: schema.jobs.vacanciesCount,
      expiresAt: schema.jobs.expiresAt,
      publishedAt: schema.jobs.publishedAt,
      closedAt: schema.jobs.closedAt,
      createdAt: schema.jobs.createdAt,
      updatedAt: schema.jobs.updatedAt,
      organizationName: schema.organizations.name,
      organizationLogoUrl: schema.organizations.logoUrl,
      organizationBannerUrl: schema.organizations.bannerUrl,
      organizationDescription: schema.organizations.description,
      organizationAddress: schema.organizations.officeAddress,
      organizationCity: schema.organizations.city,
      organizationProvince: schema.organizations.province,
      organizationEmail: schema.organizations.companyEmail,
      organizationPhone: schema.organizations.companyPhone,
      organizationWebsite: schema.organizations.website,
      organizationLinkedin: schema.organizations.linkedinUrl,
      organizationIndustry: schema.organizations.industry,
      organizationScale: schema.organizations.companyScale,
      organizationVerificationStatus: schema.organizations.verificationStatus,
    })
    .from(schema.jobs)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
    .where(where)
    .orderBy(desc(schema.jobs.updatedAt))
    .limit(paging.limit + 1)
    .offset(paging.offset);

  const hasMore = jobs.length > paging.limit;
  const pageJobs = hasMore ? jobs.slice(0, paging.limit) : jobs;
  if (pageJobs.length === 0) return { jobs: [], hasMore: false };

  const requirements = await db
    .select({
      id: schema.jobRequirements.id,
      jobId: schema.jobRequirements.jobId,
      type: schema.jobRequirements.type,
      name: schema.jobRequirements.name,
    })
    .from(schema.jobRequirements)
    .where(inArray(schema.jobRequirements.jobId, pageJobs.map((row) => row.id)));

  const byJob = new Map<string, Array<{ id: string; type: "required" | "preferred"; name: string }>>();
  for (const requirement of requirements) {
    const list = byJob.get(requirement.jobId) ?? [];
    list.push({ id: requirement.id, type: requirement.type, name: requirement.name });
    byJob.set(requirement.jobId, list);
  }

  return {
    jobs: pageJobs.map((row) => ({
      ...row,
      description: row.description && row.description.length > 600 ? `${row.description.slice(0, 600)}...` : row.description,
      requirements: byJob.get(row.id) ?? [],
      organization: {
        id: row.organizationId,
        name: row.organizationName,
        logoUrl: row.organizationLogoUrl,
        bannerUrl: row.organizationBannerUrl,
        description: row.organizationDescription,
        officeAddress: row.organizationAddress,
        city: row.organizationCity,
        province: row.organizationProvince,
        companyEmail: row.organizationEmail,
        companyPhone: row.organizationPhone,
        website: row.organizationWebsite,
        linkedinUrl: row.organizationLinkedin,
        industry: row.organizationIndustry,
        companyScale: row.organizationScale,
        verificationStatus: row.organizationVerificationStatus,
      },
    })),
    hasMore,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const paged = paginationSchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!paged.success) return NextResponse.json({ error: "Parameter pagination tidak valid." }, { status: 400 });
    const { page, limit } = paged.data;
    const offset = (page - 1) * limit;

    const current = await getCurrentAppUser();
    const db = "error" in current ? getDb() : current.db;
    const recruiter = !("error" in current) && current.user.role === "recruiter";

    let where = recruiter ? undefined : eq(schema.jobs.status, "published");
    if (recruiter) {
      const scope = await getRecruiterScope(db, current.user);
      if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
      where = eq(schema.jobs.organizationId, scope.membership.organizationId);
      if (status && ["draft", "published", "closed", "archived"].includes(status)) {
        where = and(where, eq(schema.jobs.status, status as "draft" | "published" | "closed" | "archived"));
      }
    }

    if (!where) return dbError();
    if (query) {
      where = and(
        where,
        or(
          ilike(schema.jobs.title, `%${query}%`),
          ilike(schema.jobs.description, `%${query}%`),
          ilike(schema.organizations.name, `%${query}%`)
        )
      );
    }

    const { jobs, hasMore } = await jobRows(db, where, { limit, offset });
    return NextResponse.json({ jobs, page, limit, hasMore });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = jobSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data job tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    }
    const current = await recruiterContext();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const values = parsed.data;
    const [job] = await current.db
      .insert(schema.jobs)
      .values({
        organizationId: current.scope.membership.organizationId,
        createdBy: current.user.id,
        title: values.title,
        description: values.description,
        employmentType: values.employmentType,
        workArrangement: values.workArrangement,
        location: values.location ?? null,
        salaryMin: values.salaryMin ?? null,
        salaryMax: values.salaryMax ?? null,
        salaryCurrency: values.salaryCurrency,
        salaryPeriod: values.salaryPeriod,
        isSalaryNegotiable: values.isSalaryNegotiable,
        hideSalary: values.hideSalary,
        experienceLevel: values.experienceLevel ?? null,
        minEducation: values.minEducation ?? null,
        jobCategory: values.jobCategory ?? null,
        responsibilities: values.responsibilities ?? null,
        qualifications: values.qualifications ?? null,
        benefits: values.benefits,
        vacanciesCount: values.vacanciesCount,
        expiresAt: values.expiresAt ? new Date(values.expiresAt) : null,
      })
      .returning();

    const requirements = [
      ...values.requiredSkills.map((name) => ({ jobId: job.id, name, type: "required" as const })),
      ...values.preferredSkills.map((name) => ({ jobId: job.id, name, type: "preferred" as const })),
    ];
    if (requirements.length) await current.db.insert(schema.jobRequirements).values(requirements);

    return NextResponse.json({ job: { ...job, requirements } }, { status: 201 });
  } catch (error) {
    return dbError(error);
  }
}
