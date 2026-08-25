import { AdminDataPage } from "@/components/admin/admin-data-page";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminTokensPage() { return <AdminShell title="Token operations"><AdminDataPage endpoint="/api/admin/tokens" kind="tokens" /></AdminShell>; }
