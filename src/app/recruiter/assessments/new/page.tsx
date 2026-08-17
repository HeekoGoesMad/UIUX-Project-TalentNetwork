"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecruiterAssessmentEditor } from "@/components/assessments/assessment-ui";
export default function Page() { return <ProtectedRoute role="recruiter"><RecruiterAssessmentEditor /></ProtectedRoute>; }
