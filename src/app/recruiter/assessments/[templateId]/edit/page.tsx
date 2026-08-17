"use client";
import { use } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecruiterAssessmentEditor } from "@/components/assessments/assessment-ui";
export default function Page({ params }: { params: Promise<{ templateId: string }> }) { const { templateId } = use(params); return <ProtectedRoute role="recruiter"><RecruiterAssessmentEditor templateId={templateId} /></ProtectedRoute>; }
