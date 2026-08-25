import { AdminDataPage } from "@/components/admin/admin-data-page";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminOrganizationsPage() { return <AdminShell title="Organizations"><AdminDataPage endpoint="/api/admin/organizations" kind="organizations" /></AdminShell>; }
