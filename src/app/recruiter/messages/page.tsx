"use client";

import MessagesPage from "@/app/messages/page";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function RecruiterMessagesPage() {
  return (
    <ProtectedRoute role="recruiter">
      <MessagesPage />
    </ProtectedRoute>
  );
}
