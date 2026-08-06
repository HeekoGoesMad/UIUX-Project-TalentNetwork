import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
export default function LoginPage() { return <AuthShell title="Welcome back" description="Masuk untuk melanjutkan perjalananmu."><AuthForm mode="login" /></AuthShell>; }
