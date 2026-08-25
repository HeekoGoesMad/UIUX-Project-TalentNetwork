"use client";

import MessagesPage from "@/app/messages/page";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function CandidateMessagesPage() {
  return (
    <ProtectedRoute role="candidate">
      <MessagesPage />
    </ProtectedRoute>
  );
}
