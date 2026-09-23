import type { Metadata } from "next";
import { Suspense } from "react";
import { TermsView } from "@/components/terms/terms-view";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | ProofyLink",
  description: "Syarat dan ketentuan resmi penggunaan platform ProofyLink Talent Network untuk Perusahaan Rekruter dan Talenta.",
};

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50/50 py-12 flex justify-center text-sm text-slate-500">Memuat Syarat & Ketentuan...</div>}>
      <TermsView />
    </Suspense>
  );
}
