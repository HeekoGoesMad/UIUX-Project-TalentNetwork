"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateAssessmentList } from "@/components/assessments/assessment-ui";
import { CandidateReviewList } from "@/components/assessments/candidate-review-status";
export default function Page() { return <ProtectedRoute role="candidate"><CandidateAssessmentList /><section className="container mx-auto max-w-5xl px-4 pb-8"><h2 className="text-xl font-semibold">Status review</h2><CandidateReviewList /></section></ProtectedRoute>; }
