"use client";

import { use } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateAssessmentDetail } from "@/components/assessments/assessment-ui";
import { CandidateReviewStatus } from "@/components/assessments/candidate-review-status";

export default function AssessmentDetailPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = use(params);

  return (
    <ProtectedRoute role="candidate">
      <div className="space-y-8">
        <CandidateAssessmentDetail invitationId={invitationId} />
        <CandidateReviewStatus invitationId={invitationId} />
      </div>
    </ProtectedRoute>
  );
}

