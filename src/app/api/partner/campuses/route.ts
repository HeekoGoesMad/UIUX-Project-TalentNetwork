import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const campuses = rows.map((r) => r.name);

    return NextResponse.json({
      campuses,
      partners: rows,
    });
  } catch (error) {
    console.error("Gagal memuat daftar mitra kampus:", error);
    // Graceful fallback to approved partner in DB
    return NextResponse.json({
      campuses: ["ITB STIKOM Bali"],
      partners: [{ id: "itb-stikom", name: "ITB STIKOM Bali", location: "Denpasar, Bali" }],
    });
  }
}
