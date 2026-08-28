import { AdminShell } from "@/components/admin/admin-shell";
import { RecruiterComplianceManager } from "@/components/admin/recruiter-compliance-manager";

export default function AdminRecruitersPage() {
  return (
    <AdminShell title="Verifikasi & Compliance Legalitas Rekruter">
      <RecruiterComplianceManager />
    </AdminShell>
  );
}
