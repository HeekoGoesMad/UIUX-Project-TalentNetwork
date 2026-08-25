import { NextResponse } from "next/server";
import { getProductionConfig, isHealthTokenValid, validateProductionConfig } from "@/lib/config/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const config = getProductionConfig();
  if (config.isProduction && !isHealthTokenValid(request.headers.get("x-healthcheck-token"))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const valid = validateProductionConfig();
    return NextResponse.json({
      status: "ready",
      environment: valid.isProduction ? "production" : "development",
      flags: valid.flags,
      readiness: valid.readiness,
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      status: "not_ready",
      environment: "production",
      error: error instanceof Error ? error.message : "Production configuration is invalid.",
      readiness: config.readiness,
      flags: config.flags,
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
