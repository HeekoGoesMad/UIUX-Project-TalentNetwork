"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function RecruiterRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/recruiter/dashboard");
  }, [router]);

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted-foreground" role="status">
        Membuka recruiter dashboard...
      </main>
    </ProtectedRoute>
  );
}
