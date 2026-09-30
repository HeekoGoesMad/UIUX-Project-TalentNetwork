import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { apiError } from "@/lib/api/request-error";
const version = process.env.npm_package_version || "0.1.0";
export const dynamic = "force-dynamic";

function uptimeSeconds() {
  return Math.floor(process.uptime());
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { ok: false, version, uptimeSeconds: uptimeSeconds(), checks: { database: "down" } },
      { status: 503 }
    );
  }

  try {
    await Promise.race([
      getDb().execute(sql`select 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("health probe timeout")), 3000)),
    ]);
    return NextResponse.json({
      ok: true,
      version,
      uptimeSeconds: uptimeSeconds(),
      checks: { database: "up" },
    });
  } catch (error) {
    const { error: message, errorId } = await apiError("Database probe failed.", 503, error).json();
    return NextResponse.json(
      {
        ok: false,
        error: message,
        errorId,
        version,
        uptimeSeconds: uptimeSeconds(),
        checks: { database: "down" },
      },
      { status: 503 }
    );
  }
}
