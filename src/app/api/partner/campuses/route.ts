import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

let cachedCampuses: {
  data: {
    campuses: string[];
    partners: Array<{ id: string; name: string; location: string | null }>;
  };
  expiresAt: number;
} | null = null;
let fetchCampusesPromise: Promise<{
  campuses: string[];
  partners: Array<{ id: string; name: string; location: string | null }>;
}> | null = null;

const CACHE_TTL_MS = 60_000;

async function getApprovedCampuses() {
  const now = Date.now();
  if (cachedCampuses && cachedCampuses.expiresAt > now) {
    return cachedCampuses.data;
  }
  if (fetchCampusesPromise) {
    return fetchCampusesPromise;
  }

  fetchCampusesPromise = (async () => {
    try {
      const db = getDb();
      const rows = await db
        .select({
          id: schema.partnerships.id,
          name: schema.partnerships.name,
          location: schema.partnerships.location,
        })
        .from(schema.partnerships)
        .where(eq(schema.partnerships.verificationStatus, "approved"));

      const data = {
        campuses: rows.map((r) => r.name),
        partners: rows,
      };
      cachedCampuses = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    } finally {
      fetchCampusesPromise = null;
    }
  })();

  return fetchCampusesPromise;
}

export async function GET() {
  try {
    const data = await getApprovedCampuses();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Gagal memuat daftar mitra kampus:", error);
    if (cachedCampuses) {
      return NextResponse.json(cachedCampuses.data, {
        headers: {
          "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
        },
      });
    }
    return NextResponse.json({
      campuses: ["ITB STIKOM Bali"],
      partners: [{ id: "itb-stikom", name: "ITB STIKOM Bali", location: "Denpasar, Bali" }],
    });
  }
}
