import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { billingScope, canManageBilling, currentUserOrError } from "@/lib/billing/access";
import { createCheckout } from "@/lib/billing/provider";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import { writeAuditLog } from "@/lib/audit";

const checkoutSchema = z.object({ packageId: z.string().uuid() }).strict();

export async function POST(request: Request) {
  try {
    const scope = await billingScope(await currentUserOrError());
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    if (!scope.organizationId || !canManageBilling(scope.organizationRole)) return NextResponse.json({ error: "Hanya owner atau admin organisasi yang dapat membeli token." }, { status: 403 });
    const rate = enforceRateLimit(`billing:${scope.user.id}`, RATE_LIMITS.billing.limit, RATE_LIMITS.billing.windowMs);
    if (!rate.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Paket token tidak valid." }, { status: 400 });
    const [pkg] = await scope.db.select().from(schema.tokenPackages).where(and(eq(schema.tokenPackages.id, parsed.data.packageId), eq(schema.tokenPackages.active, true)));
    if (!pkg) return NextResponse.json({ error: "Paket token tidak ditemukan." }, { status: 404 });
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
    if (idempotencyKey && idempotencyKey.length > 0) {
      const [existing] = await scope.db.select().from(schema.tokenPurchases).where(and(eq(schema.tokenPurchases.organizationId, scope.organizationId), eq(schema.tokenPurchases.providerReference, `idempotency:${idempotencyKey}`)));
      if (existing) return NextResponse.json({ purchase: existing, checkoutUrl: existing.status === "pending" ? `/recruiter/billing?mockPurchase=${existing.id}` : null });
    }
    const [purchase] = await scope.db.insert(schema.tokenPurchases).values({ organizationId: scope.organizationId, packageId: pkg.id, purchasedBy: scope.user.id, provider: process.env.PAYMENT_PROVIDER?.trim().toLowerCase() || "mock", providerReference: idempotencyKey ? `idempotency:${idempotencyKey}` : null, amountMinor: pkg.priceMinor, currency: pkg.currency, tokenAmount: pkg.tokenAmount }).returning();
    const checkout = createCheckout({ purchaseId: purchase.id, amountMinor: pkg.priceMinor, currency: pkg.currency, description: pkg.name });
    await writeAuditLog({ db: scope.db, actorUserId: scope.user.id, organizationId: scope.organizationId, action: "billing.checkout.created", entityType: "token_purchase", entityId: purchase.id, metadata: { packageId: pkg.id, provider: purchase.provider } });
    return NextResponse.json({ purchase, checkoutUrl: checkout.checkoutUrl, developmentMock: process.env.NODE_ENV === "development" }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.error("Billing checkout failed", error);
    return NextResponse.json({ error: "Checkout pembayaran belum tersedia." }, { status: message.includes("PAYMENT_PROVIDER") ? 503 : 500 });
  }
}
