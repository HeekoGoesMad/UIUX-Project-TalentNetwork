import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { billingScope, canManageBilling, currentUserOrError } from "@/lib/billing/access";
import { writeAuditLog } from "@/lib/audit";

const accountSchema = z.object({ billingOwnerId: z.string().uuid().nullable().optional(), spendLimit: z.number().int().nonnegative().nullable().optional() }).strict();

export async function GET() {
  try {
    const current = await currentUserOrError();
    const scope = await billingScope(current);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    if (!scope.organizationId) return NextResponse.json({ account: null });
    const [account] = await scope.db.select().from(schema.billingAccounts).where(eq(schema.billingAccounts.organizationId, scope.organizationId));
    return NextResponse.json({ account: account ?? null });
  } catch { return NextResponse.json({ error: "Data billing belum tersedia." }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  try {
    const current = await currentUserOrError();
    const scope = await billingScope(current);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    if (!scope.organizationId || !canManageBilling(scope.organizationRole)) return NextResponse.json({ error: "Hanya owner atau admin organisasi yang dapat mengubah billing." }, { status: 403 });
    const parsed = accountSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data billing tidak valid.", details: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.billingOwnerId) {
      const [member] = await scope.db.select({ id: schema.organizationMembers.userId }).from(schema.organizationMembers).where(eq(schema.organizationMembers.organizationId, scope.organizationId));
      if (!member || parsed.data.billingOwnerId !== member.id) {
        const members = await scope.db.select({ id: schema.organizationMembers.userId }).from(schema.organizationMembers).where(eq(schema.organizationMembers.organizationId, scope.organizationId));
        if (!members.some((item) => item.id === parsed.data.billingOwnerId)) return NextResponse.json({ error: "Billing owner harus anggota organisasi." }, { status: 400 });
      }
    }
    const [account] = await scope.db.insert(schema.billingAccounts).values({ organizationId: scope.organizationId, billingOwnerId: parsed.data.billingOwnerId ?? scope.user.id, spendLimit: parsed.data.spendLimit ?? null }).onConflictDoUpdate({ target: schema.billingAccounts.organizationId, set: { billingOwnerId: parsed.data.billingOwnerId ?? scope.user.id, spendLimit: parsed.data.spendLimit ?? null, updatedAt: new Date() } }).returning();
    await writeAuditLog({ db: scope.db, actorUserId: scope.user.id, organizationId: scope.organizationId, action: "billing.account.updated", entityType: "billing_account", entityId: account.id, metadata: parsed.data });
    return NextResponse.json({ account });
  } catch { return NextResponse.json({ error: "Billing account gagal diperbarui." }, { status: 503 }); }
}
