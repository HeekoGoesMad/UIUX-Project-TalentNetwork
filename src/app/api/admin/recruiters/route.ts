import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { currentUserOrError } from "@/lib/billing/access";

async function admin() { const current = await currentUserOrError(); if ("error" in current) return current; return current.user.role === "admin" ? current : { error: "Akses admin diperlukan.", status: 403 as const }; }
const actionSchema = z.object({ action: z.enum(["approve", "reject"]), reason: z.string().trim().max(500).optional() }).strict();

export async function GET() { try { const current = await admin(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status }); const recruiters = await current.db.select({ user: schema.users, profile: schema.profiles }).from(schema.users).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id)).where(eq(schema.users.role, "recruiter")).orderBy(desc(schema.users.createdAt)); return NextResponse.json({ recruiters }); } catch { return NextResponse.json({ error: "Recruiter belum tersedia." }, { status: 503 }); } }

export async function POST(request: Request) { try { const current = await admin(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status }); const parsed = actionSchema.extend({ userId: z.string().uuid() }).safeParse(await request.json()); if (!parsed.success || (parsed.data.action === "reject" && !parsed.data.reason)) return NextResponse.json({ error: "Action recruiter tidak valid dan alasan wajib untuk reject." }, { status: 400 }); const [user] = await current.db.update(schema.users).set({ recruiterProvisioningStatus: parsed.data.action === "approve" ? "active" : "rejected", updatedAt: new Date() }).where(eq(schema.users.id, parsed.data.userId)).returning(); if (!user || user.role !== "recruiter") return NextResponse.json({ error: "Recruiter tidak ditemukan." }, { status: 404 }); await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: `admin.recruiter.${parsed.data.action}`, entityType: "user", entityId: user.id, metadata: { reason: parsed.data.reason ?? null } }); return NextResponse.json({ user }); } catch { return NextResponse.json({ error: "Status recruiter gagal diperbarui." }, { status: 503 }); } }
