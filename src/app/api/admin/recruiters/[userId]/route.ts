import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { writeAuditLog } from "@/lib/audit";

const bodySchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(500).optional(),
    organizationId: z.string().uuid().optional(),
    organizationRole: z.enum(["owner", "admin", "recruiter", "viewer"]).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentAppUser();
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  if (current.user.role !== "admin") {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "User ID tidak valid." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success || (parsed.data.action === "reject" && !parsed.data.reason)) {
    return NextResponse.json({ error: "Action recruiter tidak valid." }, { status: 400 });
  }

  const result = await current.db.transaction(async (tx) => {
    const [user] = await tx
      .update(schema.users)
      .set({
        recruiterProvisioningStatus: parsed.data.action === "approve" ? "active" : "rejected",
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!user || user.role !== "recruiter") {
      return { error: "Recruiter tidak ditemukan.", status: 404 as const };
    }

    let membershipChanged = false;
    if (parsed.data.organizationId) {
      const role = parsed.data.organizationRole ?? "recruiter";
      const [membership] = await tx
        .insert(schema.organizationMembers)
        .values({ organizationId: parsed.data.organizationId, userId, role })
        .onConflictDoUpdate({
          target: [schema.organizationMembers.organizationId, schema.organizationMembers.userId],
          set: { role },
        })
        .returning();

      membershipChanged = Boolean(membership);
      await writeAuditLog({
        db: tx,
        actorUserId: current.user.id,
        organizationId: parsed.data.organizationId,
        action: "organization.member.updated",
        entityType: "organization_member",
        entityId: membership?.id ?? null,
        metadata: { memberUserId: userId, role },
      });
    }

    await writeAuditLog({
      db: tx,
      actorUserId: current.user.id,
      action: `admin.recruiter.${parsed.data.action}`,
      entityType: "user",
      entityId: user.id,
      metadata: {
        reason: parsed.data.reason ?? null,
        organizationId: parsed.data.organizationId ?? null,
        membershipChanged,
      },
    });

    return { user };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ user: result.user });
}
