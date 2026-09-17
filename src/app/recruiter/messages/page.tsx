"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import MessagesPage from "@/app/messages/page";
import { ProtectedRoute } from "@/components/auth/protected-route";

function RecruiterMessagesContent() {
  const searchParams = useSearchParams();
  return <MessagesPage conversationId={searchParams.get("conversationId") ?? undefined} />;
}

export default function RecruiterMessagesPage() {
  return (
    <ProtectedRoute role="recruiter">
      <Suspense fallback={null}>
        <RecruiterMessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
