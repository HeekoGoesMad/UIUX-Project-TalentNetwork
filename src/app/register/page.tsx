import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Buat Akun Baru"
      description="Mulai membangun koneksi yang lebih bermakna."
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
