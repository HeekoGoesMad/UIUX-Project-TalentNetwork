import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { getPaymentProvider, validateWebhookSecret } from "@/lib/billing/provider";

type EventBody = { eventId?: string; type?: string; purchaseId?: string; providerReference?: string };

const paidEvents = new Set(["paid", "payment_succeeded", "checkout.session.completed"]);
const refundedEvents = new Set(["refunded", "payment_refunded", "charge.refunded"]);

export async function POST(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const raw = await request.text();
  const { provider: providerName } = await params;
  try {
    const configured = getPaymentProvider();
    const expectedProvider = configured.kind === "mock" ? "mock" : configured.name;
    if (providerName !== expectedProvider) return NextResponse.json({ error: "Provider webhook tidak cocok." }, { status: 400 });
    if (!validateWebhookSecret(raw, request.headers.get("x-webhook-signature"))) return NextResponse.json({ error: "Webhook signature tidak valid." }, { status: 401 });
    const body = JSON.parse(raw) as EventBody;
    if (!body.eventId || body.eventId.length > 255 || !body.type || (!body.purchaseId && !body.providerReference)) return NextResponse.json({ error: "Payload webhook tidak valid." }, { status: 400 });
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [event] = await tx.insert(schema.paymentEvents).values({ provider: providerName, eventId: body.eventId!, type: body.type!, payload: body as Record<string, unknown>, processedAt: new Date() }).onConflictDoNothing({ target: schema.paymentEvents.eventId }).returning();
      if (!event) return { duplicate: true };
      const [purchase] = await tx.select().from(schema.tokenPurchases).where(body.purchaseId ? eq(schema.tokenPurchases.id, body.purchaseId) : eq(schema.tokenPurchases.providerReference, body.providerReference!)).limit(1);
      if (!purchase || purchase.provider !== providerName) { await tx.update(schema.paymentEvents).set({ status: "ignored" }).where(eq(schema.paymentEvents.id, event.id)); return { ignored: true }; }
      if (paidEvents.has(body.type!) && purchase.status !== "paid") {
        const [account] = await tx.insert(schema.tokenAccounts).values({ organizationId: purchase.organizationId }).onConflictDoUpdate({ target: schema.tokenAccounts.organizationId, set: { updatedAt: new Date() } }).returning();
        const [entry] = await tx.insert(schema.tokenLedgerEntries).values({ tokenAccountId: account.id, type: "grant", amount: purchase.tokenAmount, idempotencyKey: `purchase:${purchase.id}:grant`, metadata: { purchaseId: purchase.id, providerEventId: body.eventId } }).onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey }).returning();
        if (entry) await tx.update(schema.tokenAccounts).set({ balance: sql`${schema.tokenAccounts.balance} + ${purchase.tokenAmount}`, updatedAt: new Date() }).where(eq(schema.tokenAccounts.id, account.id));
        await tx.update(schema.tokenPurchases).set({ status: "paid", paidAt: new Date(), updatedAt: new Date() }).where(eq(schema.tokenPurchases.id, purchase.id));
        await writeAuditLog({ db: tx, organizationId: purchase.organizationId, action: "billing.purchase.paid", entityType: "token_purchase", entityId: purchase.id, metadata: { provider: providerName, eventId: body.eventId, tokenAmount: purchase.tokenAmount } });
      } else if (refundedEvents.has(body.type!) && purchase.status === "paid") {
        const [account] = await tx.select().from(schema.tokenAccounts).where(eq(schema.tokenAccounts.organizationId, purchase.organizationId)).limit(1);
        if (!account || account.balance < purchase.tokenAmount) throw new Error("Saldo token tidak cukup untuk refund.");
        const [entry] = await tx.insert(schema.tokenLedgerEntries).values({ tokenAccountId: account.id, type: "refund", amount: purchase.tokenAmount, idempotencyKey: `purchase:${purchase.id}:refund`, metadata: { purchaseId: purchase.id, providerEventId: body.eventId } }).onConflictDoNothing({ target: schema.tokenLedgerEntries.idempotencyKey }).returning();
        if (entry) await tx.update(schema.tokenAccounts).set({ balance: sql`${schema.tokenAccounts.balance} - ${purchase.tokenAmount}`, updatedAt: new Date() }).where(eq(schema.tokenAccounts.id, account.id));
        await tx.update(schema.tokenPurchases).set({ status: "refunded", updatedAt: new Date() }).where(eq(schema.tokenPurchases.id, purchase.id));
        await writeAuditLog({ db: tx, organizationId: purchase.organizationId, action: "billing.purchase.refunded", entityType: "token_purchase", entityId: purchase.id, metadata: { provider: providerName, eventId: body.eventId, tokenAmount: purchase.tokenAmount } });
      } else { await tx.update(schema.paymentEvents).set({ status: "ignored" }).where(eq(schema.paymentEvents.id, event.id)); }
      return { duplicate: false };
    });
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("Billing webhook failed", error);
    return NextResponse.json({ error: "Webhook belum dapat diproses." }, { status: 400 });
  }
}
