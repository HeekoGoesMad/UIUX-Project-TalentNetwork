import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { requireAdmin } from "@/lib/api/auth";
import { apiError } from "@/lib/api/request-error";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const updatePartnershipSchema = z
  .object({
    verificationStatus: z
      .enum(["pending", "approved", "need_revision", "rejected"])
      .optional(),
    verificationNotes: z.string().trim().max(1000).optional().nullable(),
    location: z.string().trim().optional().nullable(),
    skNumber: z.string().trim().optional().nullable(),
    skDocumentUrl: z.string().trim().optional().nullable(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ partnershipId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const { partnershipId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = updatePartnershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data permohonan kemitraan tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = current.db;
    const adminUser = current.user;
    const data = parsed.data;

    const [existing] = await db
      .select()
      .from(schema.partnerships)
      .where(eq(schema.partnerships.id, partnershipId));

    if (!existing) {
      return NextResponse.json({ error: "Data kemitraan tidak ditemukan." }, { status: 404 });
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.verificationStatus !== undefined) {
      updatePayload.verificationStatus = data.verificationStatus;
      updatePayload.reviewedBy = adminUser.id;
      updatePayload.reviewedAt = new Date();
    }
    if (data.verificationNotes !== undefined) updatePayload.verificationNotes = data.verificationNotes;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.skNumber !== undefined) updatePayload.skNumber = data.skNumber;
    if (data.skDocumentUrl !== undefined) updatePayload.skDocumentUrl = data.skDocumentUrl;

    const [updated] = await db
      .update(schema.partnerships)
      .set(updatePayload)
      .where(eq(schema.partnerships.id, partnershipId))
      .returning();

    await writeAuditLog({
      db,
      actorUserId: adminUser.id,
      action: "admin.partnership.reviewed",
      entityType: "partnership",
      entityId: partnershipId,
      metadata: {
        partnerName: existing.name,
        oldStatus: existing.verificationStatus,
        newStatus: data.verificationStatus,
        notes: data.verificationNotes,
      },
    });

    return NextResponse.json({
      success: true,
      partnership: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        reviewedAt: updated.reviewedAt ? updated.reviewedAt.toISOString() : null,
      },
      message: `Status kemitraan ${updated.name} berhasil diperbarui menjadi ${updated.verificationStatus}.`,
    });
  } catch (error) {
    return apiError("Gagal memperbarui status kemitraan.", 500, error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ partnershipId: string }> }
) {
  try {
    const current = await requireAdmin();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const { partnershipId } = await params;
    const db = current.db;
    const adminUser = current.user;

    const [existing] = await db
      .select()
      .from(schema.partnerships)
      .where(eq(schema.partnerships.id, partnershipId));

    if (!existing) {
      return NextResponse.json({ error: "Data kemitraan tidak ditemukan." }, { status: 404 });
    }

    await db.delete(schema.partnerships).where(eq(schema.partnerships.id, partnershipId));

    await writeAuditLog({
      db,
      actorUserId: adminUser.id,
      action: "admin.partnership.deleted",
      entityType: "partnership",
      entityId: partnershipId,
      metadata: { deletedPartnerName: existing.name },
    });

    return NextResponse.json({
      success: true,
      message: `Kemitraan ${existing.name} berhasil dihapus.`,
    });
  } catch (error) {
    return apiError("Gagal menghapus kemitraan.", 500, error);
  }
}
