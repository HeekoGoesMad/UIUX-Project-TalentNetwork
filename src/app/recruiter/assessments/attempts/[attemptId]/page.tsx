"use client";

import { use } from "react";
import { RecruiterAttemptReview } from "@/components/assessments/recruiter-attempt-review";

export default function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  return <RecruiterAttemptReview attemptId={attemptId} />;
}
