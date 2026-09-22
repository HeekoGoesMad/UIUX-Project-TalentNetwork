"use client";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { AdminSettingsView } from "@/components/admin/admin-settings-view";

export default function AdminSettingsPage() {
  const { phase: gatePhase, code: gateCode } = useAdminGate();

  if (gatePhase === "checking") {
    return (
      <AdminPopup>
        <AdminChecking />
      </AdminPopup>
    );
  }

  if (gatePhase === "denied") {
    return (
      <AdminPopup>
        <AdminDenied code={gateCode ?? 403} />
      </AdminPopup>
    );
  }

  return (
    <AdminShell
      title="Pengaturan Sistem & Akun"
      subtitle="Kelola aksesibilitas antarmuka, saluran notifikasi sistem, profil administrator, dan preferensi operasional konsol."
    >
      <AdminSettingsView />
    </AdminShell>
  );
}
