import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { templatePatchSchema, uuidSchema } from "@/lib/assessment";

export async function GET(_request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params;
    if (!uuidSchema.safeParse(templateId).success) return NextResponse.json({ error: "ID template tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const [template] = await current.db.select().from(schema.assessmentTemplates).where(and(eq(schema.assessmentTemplates.id, templateId), eq(schema.assessmentTemplates.organizationId, scope.membership.organizationId))).limit(1);
    if (!template) return NextResponse.json({ error: "Template assessment tidak ditemukan." }, { status: 404 });
    const questions = await current.db.select().from(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.assessmentTemplateId, templateId)).orderBy(asc(schema.assessmentQuestions.sortOrder));
    const invitations = await current.db.select({ id: schema.assessmentInvitations.id }).from(schema.assessmentInvitations).where(eq(schema.assessmentInvitations.assessmentTemplateId, templateId));
    return NextResponse.json({ template: { ...template, questions, invitationCount: invitations.length } });
  } catch (error) { console.error("Assessment template detail failed", error); return NextResponse.json({ error: "Detail template belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params; if (!uuidSchema.safeParse(templateId).success) return NextResponse.json({ error: "ID template tidak valid." }, { status: 400 });
    const parsed = templatePatchSchema.safeParse(await request.json()); if (!parsed.success || !parsed.data.questions) return NextResponse.json({ error: parsed.success ? "Pertanyaan wajib dikirim saat memperbarui template." : parsed.error.issues[0]?.message }, { status: 400 });
    const questions = parsed.data.questions;
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const result = await current.db.transaction(async (tx) => {
      const [template] = await tx.select().from(schema.assessmentTemplates).where(and(eq(schema.assessmentTemplates.id, templateId), eq(schema.assessmentTemplates.organizationId, scope.membership.organizationId))).limit(1);
      if (!template) return { error: "Template assessment tidak ditemukan.", status: 404 as const };
      const [invitation] = await tx.select({ id: schema.assessmentInvitations.id }).from(schema.assessmentInvitations).where(eq(schema.assessmentInvitations.assessmentTemplateId, templateId)).limit(1);
      if (invitation) return { error: "Template tidak dapat diubah setelah invitation dibuat.", status: 409 as const };
      const [updated] = await tx.update(schema.assessmentTemplates).set({ name: parsed.data.name ?? template.name, description: parsed.data.description === undefined ? template.description : parsed.data.description, timeLimitMinutes: parsed.data.timeLimitMinutes === undefined ? template.timeLimitMinutes : parsed.data.timeLimitMinutes, attemptLimit: parsed.data.attemptLimit ?? template.attemptLimit, updatedAt: new Date() }).where(eq(schema.assessmentTemplates.id, templateId)).returning();
      await tx.delete(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.assessmentTemplateId, templateId));
      await tx.insert(schema.assessmentQuestions).values(questions.map((question) => ({ assessmentTemplateId: templateId, type: question.type, prompt: question.prompt, options: question.options, isRequired: question.required, sortOrder: question.order })));
      return { template: updated };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) { console.error("Assessment template update failed", error); return NextResponse.json({ error: "Template assessment belum dapat diperbarui." }, { status: 503 }); }
}
