import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
export default function RegisterPage() { return <AuthShell title="Create your account" description="Mulai membangun koneksi yang lebih bermakna."><AuthForm mode="register" /></AuthShell>; }
