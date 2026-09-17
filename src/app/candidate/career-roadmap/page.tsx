import { Metadata } from "next";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { CareerTrackerWorkspace } from "@/components/candidate/career-tracker-workspace";

export const metadata: Metadata = {
  title: "Career Growth & Development Tracker | ProofyLink Talent Network",
  description:
    "Ruang kerja mandiri untuk merencanakan target peran, memantau aktivitas belajar, dan mendokumentasikan bukti pencapaian.",
};

export default function CandidateCareerRoadmapPage() {
  return (
    <ProtectedRoute role="candidate">
      <div className="container mx-auto px-4 py-8">
        <CareerTrackerWorkspace />
      </div>
    </ProtectedRoute>
  );
}
