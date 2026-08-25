import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentAppUser } from "@/lib/api/auth";
import { TalentSearchService } from "@/lib/services/talent-search";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  sort: z.enum(["relevance", "name", "experience"]).optional(),
  locations: z.array(z.string().min(1)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const parsed = querySchema.safeParse({
      q: request.nextUrl.searchParams.get("q") ?? undefined,
      page: request.nextUrl.searchParams.get("page") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
      sort: request.nextUrl.searchParams.get("sort") ?? undefined,
      locations: request.nextUrl.searchParams.getAll("locations").filter(Boolean),
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Parameter pencarian kandidat tidak valid." }, { status: 400 });
    }

    const { q, page, limit, sort, locations } = parsed.data;

    const result = await TalentSearchService.search(current.db, {
      q,
      page,
      limit,
      sort,
      locations: locations && locations.length > 0 ? locations : undefined,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
