import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RecruiterPendingPage() {
  return (
    <AuthShell title="Akun sedang ditinjau" description="Provisioning recruiter belum selesai.">
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <Clock3 className="size-6" />
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Terima kasih sudah mendaftar. Tim kami sedang menyiapkan akses organisasi untuk akun recruiter ini.
          Fitur recruiter akan tersedia setelah status akun menjadi aktif.
        </p>
        <Button asChild className="w-full rounded-xl bg-[#0b2342]">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
      </div>
    </AuthShell>
  );
}
