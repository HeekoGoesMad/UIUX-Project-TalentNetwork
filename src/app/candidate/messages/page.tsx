"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import MessagesPage from "@/app/messages/page";
import { ProtectedRoute } from "@/components/auth/protected-route";

function CandidateMessagesContent() {
  const searchParams = useSearchParams();
  return <MessagesPage conversationId={searchParams.get("conversationId") ?? undefined} />;
}

export default function CandidateMessagesPage() {
  return (
    <ProtectedRoute role="candidate">
      <Suspense fallback={null}>
        <CandidateMessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
