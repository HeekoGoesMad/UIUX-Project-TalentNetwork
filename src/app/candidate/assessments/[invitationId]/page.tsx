"use client";
import { use } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateAssessmentDetail } from "@/components/assessments/assessment-ui";
import { CandidateReviewStatus } from "@/components/assessments/candidate-review-status";
export default function Page({ params }: { params: Promise<{ invitationId: string }> }) { const { invitationId } = use(params); return <ProtectedRoute role="candidate"><CandidateAssessmentDetail invitationId={invitationId} /><section className="container mx-auto max-w-5xl px-4 pb-8"><CandidateReviewStatus invitationId={invitationId} /></section></ProtectedRoute>; }
