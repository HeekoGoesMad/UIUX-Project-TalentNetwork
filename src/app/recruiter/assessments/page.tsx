"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecruiterAssessmentList } from "@/components/assessments/assessment-ui";
export default function Page() { return <ProtectedRoute role="recruiter"><RecruiterAssessmentList /></ProtectedRoute>; }
