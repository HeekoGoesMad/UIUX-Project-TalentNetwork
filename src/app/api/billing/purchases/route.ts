import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { billingScope, currentUserOrError } from "@/lib/billing/access";
import { CACHE_HEADERS } from "@/lib/api/cache";

export async function GET() {
  try {
    const scope = await billingScope(await currentUserOrError());
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    if (!scope.organizationId) return NextResponse.json({ purchases: [] }, { headers: CACHE_HEADERS.PRIVATE_NO_STORE });
    const purchases = await scope.db.select({ purchase: schema.tokenPurchases, package: schema.tokenPackages.name }).from(schema.tokenPurchases).innerJoin(schema.tokenPackages, eq(schema.tokenPackages.id, schema.tokenPurchases.packageId)).where(eq(schema.tokenPurchases.organizationId, scope.organizationId)).orderBy(desc(schema.tokenPurchases.createdAt));
    return NextResponse.json({ purchases }, { headers: CACHE_HEADERS.PRIVATE_NO_STORE });
  } catch (error) {
    console.error("Billing purchases fetch failed", error);
    return NextResponse.json({ error: "Riwayat pembelian belum tersedia." }, { status: 503 });
  }
}
