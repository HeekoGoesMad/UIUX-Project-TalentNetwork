import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { templateSchema } from "@/lib/assessment";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const templates = await current.db.select().from(schema.assessmentTemplates).where(eq(schema.assessmentTemplates.organizationId, scope.membership.organizationId)).orderBy(desc(schema.assessmentTemplates.updatedAt));
    return NextResponse.json({ templates });
  } catch (error) { console.error("Assessment template list failed", error); return NextResponse.json({ error: "Template assessment belum dapat dimuat." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Template assessment tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const result = await current.db.transaction(async (tx) => {
      const [template] = await tx.insert(schema.assessmentTemplates).values({ organizationId: scope.membership.organizationId, createdBy: current.user.id, name: parsed.data.name, description: parsed.data.description ?? null, timeLimitMinutes: parsed.data.timeLimitMinutes ?? null, attemptLimit: parsed.data.attemptLimit }).returning();
      await tx.insert(schema.assessmentQuestions).values(parsed.data.questions.map((question) => ({ assessmentTemplateId: template.id, type: question.type, prompt: question.prompt, options: question.options, isRequired: question.required, sortOrder: question.order })));
      return template;
    });
    return NextResponse.json({ template: result }, { status: 201 });
  } catch (error) { console.error("Assessment template create failed", error); return NextResponse.json({ error: "Template assessment belum dapat dibuat." }, { status: 503 }); }
}
