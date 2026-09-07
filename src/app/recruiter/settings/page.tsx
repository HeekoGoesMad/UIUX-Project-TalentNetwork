import { ProtectedRoute } from "@/components/auth/protected-route";
import { RecruiterSettingsView } from "@/components/recruiter/recruiter-settings-view";

export default function RecruiterSettingsPage() {
  return (
    <ProtectedRoute role="recruiter">
      <RecruiterSettingsView />
    </ProtectedRoute>
  );
}
