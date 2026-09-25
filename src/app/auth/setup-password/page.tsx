import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SetupPasswordForm } from "@/components/auth/setup-password-form";

export const metadata = {
  title: "Atur Kata Sandi Opsional | Talent Network",
  description: "Atur kata sandi agar Anda juga dapat masuk menggunakan email dan kata sandi.",
};

export default function SetupPasswordPage() {
  return (
    <AuthShell
      title="Selamat Datang"
      description="Akun Google Anda telah terhubung. Atur kata sandi agar Anda juga dapat masuk menggunakan email dan kata sandi."
    >
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400 text-sm">Memuat halaman...</div>}>
        <SetupPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
