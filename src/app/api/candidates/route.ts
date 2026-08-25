import { NextResponse } from "next/server";

import { getCurrentAppUser } from "@/lib/api/auth";
import { TalentSearchService } from "@/lib/services/talent-search";

export async function GET(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const sortParam = url.searchParams.get("sort") as "relevance" | "name" | "experience" | undefined;
    const locations = url.searchParams.getAll("locations").filter(Boolean);

    const hasPaginationParams = pageParam !== null || limitParam !== null;

    const result = await TalentSearchService.search(current.db, {
      q,
      page: pageParam ? Number(pageParam) : undefined,
      limit: limitParam ? Number(limitParam) : undefined,
      sort: sortParam,
      locations: locations.length > 0 ? locations : undefined,
    });

    if (hasPaginationParams) {
      return NextResponse.json(result);
    }

    return NextResponse.json({ candidates: result.candidates });
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
