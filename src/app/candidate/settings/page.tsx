import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateSettingsView } from "@/components/candidate/candidate-settings-view";

export default function CandidateSettingsPage() {
  return (
    <ProtectedRoute role="candidate">
      <CandidateSettingsView />
    </ProtectedRoute>
  );
}
