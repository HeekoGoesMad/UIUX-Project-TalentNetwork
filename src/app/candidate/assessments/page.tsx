"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateAssessmentList } from "@/components/assessments/assessment-ui";

export default function CandidateAssessmentsPage() {
  return (
    <ProtectedRoute role="candidate">
      <CandidateAssessmentList />
    </ProtectedRoute>
  );
}

