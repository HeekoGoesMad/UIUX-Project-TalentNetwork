import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Buat Akun Baru"
      description="Mulai membangun koneksi yang lebih bermakna."
    >
      <Suspense>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
