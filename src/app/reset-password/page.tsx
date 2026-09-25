import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi | Talent Network",
  description: "Atur ulang kata sandi akun Anda dengan verifikasi OTP.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Atur Ulang Kata Sandi"
      description="Verifikasi email Anda dengan kode OTP dan buat kata sandi baru yang aman."
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
