"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login } = useApp();
  const [role, setRole] = useState<UserRole>("recruiter");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    window.setTimeout(() => {
      login(role);
      router.push(role === "candidate" ? "/profile" : "/dashboard");
    }, 500);
  };

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
      <RoleSelector role={role} onChange={setRole} />
      {mode === "register" && (
        <label htmlFor="full-name" className="block text-sm font-semibold">
          Nama lengkap
          <Input id="full-name" name="name" className="mt-2" required autoComplete="name" placeholder="Nama lengkap…" />
        </label>
      )}
      <label htmlFor="email" className="block text-sm font-semibold">
        Email
        <Input id="email" name="email" className="mt-2" required type="email" autoComplete="email" spellCheck={false} placeholder="nama@email.com…" />
      </label>
      <label htmlFor="password" className="block text-sm font-semibold">
        Password
        <div className="relative mt-2">
          <Input id="password" name="password" className="pr-10" required minLength={6} type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Min. 6 karakter…" />
          <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} className="absolute right-3 top-2.5 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </label>
      {mode === "register" && (
        <label htmlFor="terms" className="flex items-start gap-2 text-xs text-muted-foreground">
          <input id="terms" name="terms" required type="checkbox" className="mt-0.5 accent-[#19a974]" />
          Saya menyetujui Terms of Service dan Privacy Policy.
        </label>
      )}
      <Button className="w-full" size="lg" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {loading ? "Memproses…" : mode === "login" ? "Masuk ke ProofyLink" : "Buat akun demo"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
        <Link className="font-semibold text-[#08744f]" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Daftar sekarang" : "Masuk di sini"}
        </Link>
      </p>
      <p className="text-center font-mono text-[11px] text-muted-foreground">Demo only · No real authentication</p>
    </form>
  );
}
