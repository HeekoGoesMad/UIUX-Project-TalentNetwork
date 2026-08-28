import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

const onboardingSchema = z.object({
  picName: z.string().trim().min(2),
  picEmail: z.string().email(),
  picPhone: z.string().trim().min(6),
  picPosition: z.string().trim().optional(),
  companyName: z.string().trim().min(2),
  description: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  city: z.string().trim().optional(),
  officeAddress: z.string().trim().optional(),
  website: z.string().trim().optional(),
  nibNumber: z.string().trim().optional(),
  nibFileName: z.string().trim().optional(),
  npwpNumber: z.string().trim().optional(),
  npwpFileName: z.string().trim().optional(),
  aktaFileName: z.string().trim().optional(),
  ktpFileName: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const current = await getCurrentAppUser({ allowPending: true });
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }

  const parsed = onboardingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data onboarding rekruter tidak valid." }, { status: 400 });
  }

  const { data } = parsed;
  const db = current.db;
  const user = current.user;

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Update or create Profile
      await tx
        .insert(schema.profiles)
        .values({
          userId: user.id,
          displayName: data.picName,
          phone: data.picPhone,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: data.picName,
            phone: data.picPhone,
            updatedAt: new Date(),
          },
        });

      // 2. Create or update Organization
      const slug = `org-${user.authUserId}-${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}`;
      const [existingOrgMember] = await tx
        .select({ organizationId: schema.organizationMembers.organizationId })
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, user.id))
        .limit(1);

      let orgId = existingOrgMember?.organizationId;
      if (!orgId) {
        const [newOrg] = await tx
          .insert(schema.organizations)
          .values({
            name: data.companyName,
            slug,
            createdBy: user.id,
          })
          .returning({ id: schema.organizations.id });
        orgId = newOrg.id;

        await tx.insert(schema.organizationMembers).values({
          organizationId: orgId,
          userId: user.id,
          role: "owner",
        }).onConflictDoNothing();

        await tx.insert(schema.tokenAccounts).values({
          organizationId: orgId,
        }).onConflictDoNothing();
      } else {
        await tx
          .update(schema.organizations)
          .set({
            name: data.companyName,
            updatedAt: new Date(),
          })
          .where(eq(schema.organizations.id, orgId));
      }

      // 3. Ensure recruiter status is pending review
      await tx
        .update(schema.users)
        .set({
          recruiterProvisioningStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id));

      return { success: true, organizationId: orgId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menyimpan data onboarding:", error);
    return NextResponse.json({ error: "Gagal menyimpan data ke database." }, { status: 500 });
  }
}
