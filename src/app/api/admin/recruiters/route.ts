import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET() {
  const current = await getCurrentAppUser();
  if ("error" in current) {
    return NextResponse.json({ error: current.error }, { status: current.status });
  }
  if (current.user.role !== "admin") {
    return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
  }

  try {
    const recruiters = await current.db
      .select({ user: schema.users, profile: schema.profiles })
      .from(schema.users)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .where(eq(schema.users.role, "recruiter"))
      .orderBy(desc(schema.users.createdAt));
    return NextResponse.json({ recruiters });
  } catch {
    return NextResponse.json({ error: "Recruiter belum tersedia." }, { status: 503 });
  }
}
