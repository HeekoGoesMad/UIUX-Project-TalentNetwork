import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Selamat Datang Kembali"
      description="Masuk untuk melanjutkan perjalananmu."
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
