import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { writeAuditLog } from "@/lib/audit";

const bodySchema = z
  .object({
    action: z.enum(["approve", "reject", "request_revision"]),
    reason: z.string().trim().max(1000).optional(),
    organizationId: z.string().uuid().optional(),
    organizationRole: z.enum(["owner", "admin", "recruiter", "viewer"]).optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const parsed = bodySchema.safeParse(await request.json());
  if (
    !parsed.success ||
    ((parsed.data.action === "reject" || parsed.data.action === "request_revision") && !parsed.data.reason)
  ) {
    return NextResponse.json(
      { error: "Action recruiter tidak valid atau catatan revisi/penolakan belum diisi." },
      { status: 400 }
    );
  }

  let nextStatus: "active" | "rejected" | "revision_required" = "active";
  if (parsed.data.action === "reject") nextStatus = "rejected";
  if (parsed.data.action === "request_revision") nextStatus = "revision_required";

  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ success: true, status: nextStatus, demo: true });
  }

  const current = await getCurrentAppUser({ allowPending: true });
  const db = "error" in current ? (await import("@/db")).getDb() : current.db;
  const actorUserId = "error" in current ? userId : current.user.id;

  const result = await db.transaction(async (tx) => {
    let nextStatus: "active" | "rejected" | "revision_required" = "active";
    if (parsed.data.action === "reject") nextStatus = "rejected";
    if (parsed.data.action === "request_revision") nextStatus = "revision_required";

    const [user] = await tx
      .update(schema.users)
      .set({
        recruiterProvisioningStatus: nextStatus,
        recruiterRejectionReason: parsed.data.action === "approve" ? null : (parsed.data.reason ?? null),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId))
      .returning();

    if (!user || user.role !== "recruiter") {
      return { error: "Recruiter tidak ditemukan.", status: 404 as const };
    }

    // Sinkronisasi status organisasi terkait milik recruiter
    const membership = await tx
      .select({ organizationId: schema.organizationMembers.organizationId })
      .from(schema.organizationMembers)
      .where(eq(schema.organizationMembers.userId, user.id))
      .limit(1);
    let organizationId = membership[0]?.organizationId;

    if (parsed.data.action === "approve") {
      if (!organizationId) {
        const slug = `org-${user.authUserId}`;
        const [org] = await tx
          .insert(schema.organizations)
          .values({
            name: `${user.email.split("@")[0]} Organization`,
            slug,
            createdBy: user.id,
            verificationStatus: "approved",
            reviewedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: schema.organizations.slug,
            set: { verificationStatus: "approved", updatedAt: new Date(), reviewedAt: new Date() },
          })
          .returning({ id: schema.organizations.id });
        organizationId = org.id;
        await tx.insert(schema.organizationMembers).values({ organizationId: org.id, userId: user.id, role: "owner" }).onConflictDoNothing();
        await tx.insert(schema.tokenAccounts).values({ organizationId: org.id }).onConflictDoNothing();
      } else {
        await tx
          .update(schema.organizations)
          .set({
            verificationStatus: "approved",
            reviewedAt: new Date(),
            verificationNotes: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.id, organizationId));
      }
    } else if (parsed.data.action === "reject" && organizationId) {
      await tx
        .update(schema.organizations)
        .set({
          verificationStatus: "rejected",
          verificationNotes: parsed.data.reason || "Pendaftaran ditolak oleh compliance.",
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, organizationId));
    } else if (parsed.data.action === "request_revision" && organizationId) {
      await tx
        .update(schema.organizations)
        .set({
          verificationStatus: "need_revision",
          verificationNotes: parsed.data.reason || "Dokumen perlu diperbaiki.",
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, organizationId));
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
        actorUserId,
        organizationId: parsed.data.organizationId,
        action: "organization.member.updated",
        entityType: "organization_member",
        entityId: membership?.id ?? null,
        metadata: { memberUserId: userId, role },
      });
    }

    await writeAuditLog({
      db: tx,
      actorUserId,
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  if (!("error" in current) && current.user.role !== "admin" && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "User ID tidak valid." }, { status: 400 });
  }

  const db = "error" in current ? (await import("@/db")).getDb() : current.db;
  const actorUserId = "error" in current ? userId : current.user.id;

  try {
    const [deletedUser] = await db
      .delete(schema.users)
      .where(eq(schema.users.id, userId))
      .returning({ id: schema.users.id, email: schema.users.email, authUserId: schema.users.authUserId });

    if (!deletedUser) {
      return NextResponse.json({ error: "Data rekruter tidak ditemukan." }, { status: 404 });
    }

    await writeAuditLog({
      db,
      actorUserId,
      action: "admin.recruiter.deleted",
      entityType: "user",
      entityId: deletedUser.id,
      metadata: { email: deletedUser.email },
    });

    return NextResponse.json({ success: true, deleted: deletedUser });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Gagal menghapus rekruter." }, { status: 500 });
  }
}
