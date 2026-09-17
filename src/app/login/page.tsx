import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell
      title="Selamat Datang Kembali"
      description="Masuk untuk melanjutkan perjalananmu."
    >
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
