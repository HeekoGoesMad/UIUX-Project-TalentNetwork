import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { currentUserOrError } from "@/lib/billing/access";
import { writeAuditLog } from "@/lib/audit";

const packageSchema = z.object({ code: z.string().trim().min(2).max(40).regex(/^[a-z0-9_-]+$/), name: z.string().trim().min(2).max(120), tokenAmount: z.number().int().positive(), priceMinor: z.number().int().nonnegative(), currency: z.string().trim().length(3), validityDays: z.number().int().positive().nullable().optional() }).strict();

export async function GET() {
  try {
    const db = getDb();
    const packages = await db.select().from(schema.tokenPackages).where(eq(schema.tokenPackages.active, true)).orderBy(asc(schema.tokenPackages.priceMinor));
    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Billing packages failed", error);
    return NextResponse.json({ error: "Paket token belum tersedia." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await currentUserOrError();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "admin") return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
    const parsed = packageSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Paket token tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    const [item] = await current.db.insert(schema.tokenPackages).values({ ...parsed.data, currency: parsed.data.currency.toUpperCase(), validityDays: parsed.data.validityDays ?? null }).returning();
    await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: "admin.billing.package.created", entityType: "token_package", entityId: item.id, metadata: { code: item.code } });
    return NextResponse.json({ package: item }, { status: 201 });
  } catch (error) {
    console.error("Billing package create failed", error);
    return NextResponse.json({ error: "Paket token tidak dapat dibuat." }, { status: 409 });
  }
}
