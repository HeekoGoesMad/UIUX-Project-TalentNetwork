import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("health probe timeout")), 3000)),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[health] database probe failed:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
