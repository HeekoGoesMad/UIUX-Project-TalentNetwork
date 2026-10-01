import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { TalentSearchService } from "@/lib/services/talent-search";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  sort: z.enum(["relevance", "name", "experience"]).optional(),
  locations: z.array(z.string().min(1)).optional(),
  talentCategories: z.array(z.string().min(1)).optional(),
  careerStatuses: z.array(z.string().min(1)).optional(),
  campusVerifiedOnly: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentAppUser();
    const db = "error" in current ? getDb() : current.db;

    const rawLocs = [
      ...request.nextUrl.searchParams.getAll("locations"),
      ...(request.nextUrl.searchParams.get("loc")?.split(",") ?? []),
    ].map((s) => s.trim()).filter(Boolean);

    const rawCats = [
      ...request.nextUrl.searchParams.getAll("cat"),
      ...request.nextUrl.searchParams.getAll("talentCategories"),
      ...(request.nextUrl.searchParams.get("cat")?.split(",") ?? []),
    ].map((s) => s.trim()).filter(Boolean);

    const rawStatuses = [
      ...request.nextUrl.searchParams.getAll("cs"),
      ...request.nextUrl.searchParams.getAll("careerStatuses"),
      ...(request.nextUrl.searchParams.get("cs")?.split(",") ?? []),
    ].map((s) => s.trim()).filter(Boolean);

    const parsed = querySchema.safeParse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      locations: rawLocs.length > 0 ? rawLocs : undefined,
      talentCategories: rawCats.length > 0 ? rawCats : undefined,
      careerStatuses: rawStatuses.length > 0 ? rawStatuses : undefined,
      campusVerifiedOnly: request.nextUrl.searchParams.get("campusVerifiedOnly") === "true" ? true : undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Parameter pencarian kandidat tidak valid." }, { status: 400 });
    }

    const { q, page, limit, sort, locations, talentCategories, careerStatuses, campusVerifiedOnly } = parsed.data;

    const result = await TalentSearchService.search(db, {
      q,
      page,
      limit,
      sort,
      locations: locations && locations.length > 0 ? locations : undefined,
      talentCategories: talentCategories && talentCategories.length > 0 ? talentCategories : undefined,
      careerStatuses: careerStatuses && careerStatuses.length > 0 ? careerStatuses : undefined,
      campusVerifiedOnly,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
