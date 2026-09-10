import type { ReactNode } from "react";

import { AdminGateProvider } from "@/components/admin/admin-gate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGateProvider>{children}</AdminGateProvider>;
}
