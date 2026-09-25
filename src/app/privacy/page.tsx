import type { Metadata } from "next";
import { Suspense } from "react";
import { PrivacyView } from "@/components/privacy/privacy-view";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | ProofyLink",
  description: "Kebijakan privasi dan standar perlindungan data pribadi ProofyLink Talent Network.",
};

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/50 py-12 flex justify-center text-sm text-slate-500">Memuat Kebijakan Privasi...</div>}>
      <PrivacyView />
    </Suspense>
  );
}
