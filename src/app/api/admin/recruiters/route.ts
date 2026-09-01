import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser({ allowPending: true });
    const db = "error" in current ? (await import("@/db")).getDb() : current.db;
    const recruiters = await db
      .select({
        user: schema.users,
        profile: schema.profiles,
        organization: schema.organizations,
      })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .leftJoin(schema.organizationMembers, eq(schema.organizationMembers.userId, schema.users.id))
      .leftJoin(schema.organizations, eq(schema.organizations.id, schema.organizationMembers.organizationId))
      .where(eq(schema.users.role, "recruiter"))
      .orderBy(desc(schema.users.createdAt));
    return NextResponse.json({ recruiters });
  } catch {
    return NextResponse.json({ recruiters: [] });
  }
}
