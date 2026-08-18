import { AdminDataPage } from "@/components/admin/admin-data-page";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminRecruitersPage() { return <AdminShell title="Recruiter provisioning"><AdminDataPage endpoint="/api/admin/recruiters" kind="recruiters" /></AdminShell>; }
