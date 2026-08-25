import { AdminDataPage } from "@/components/admin/admin-data-page";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminAuditPage() { return <AdminShell title="Audit log"><AdminDataPage endpoint="/api/admin/audit-log" kind="audit" /></AdminShell>; }
