"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
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
    }, 400);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Peran Akun
        </label>
        <RoleSelector role={role} onChange={setRole} />
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="full-name" className="block text-xs font-bold text-slate-700 mb-1">
            Nama Lengkap
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              id="full-name"
              name="name"
              className="pl-9 h-9 text-xs rounded-xl"
              required
              autoComplete="name"
              placeholder="Alex Wijaya"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1">
          Alamat Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input
            id="email"
            name="email"
            className="pl-9 h-9 text-xs rounded-xl"
            required
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="alex@perusahaan.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1">
          Kata Sandi
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input
            id="password"
            name="password"
            className="pl-9 pr-9 h-9 text-xs rounded-xl"
            required
            minLength={6}
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Minimal 6 karakter"
          />
          <button
            type="button"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {mode === "register" && (
        <label htmlFor="terms" className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer pt-0.5">
          <input
            id="terms"
            name="terms"
            required
            type="checkbox"
            className="mt-0.5 size-3.5 rounded border-slate-300 accent-[#19a974]"
          />
          <span>Saya menyetujui Ketentuan Layanan & Privacy Policy.</span>
        </label>
      )}

      <Button
        type="submit"
        className="mt-1.5 w-full rounded-xl bg-[#0b2342] py-5 text-xs font-semibold hover:bg-[#102c52] shadow-sm"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-3.5 animate-spin" />
            Memproses…
          </>
        ) : (
          <>
            {mode === "login" ? "Masuk ke Workspace" : "Buat Akun ProofyLink"}
            <ArrowRight className="ml-1.5 size-3.5" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-slate-600 pt-0.5">
        {mode === "login" ? "Belum memiliki akun? " : "Sudah memiliki akun? "}
        <Link
          className="font-bold text-[#08744f] hover:underline"
          href={mode === "login" ? "/register" : "/login"}
        >
          {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
        </Link>
      </p>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
        <CheckCircle2 className="size-3 text-[#19a974]" />
        <span>Lingkungan Demo Terverifikasi</span>
      </div>
    </form>
  );
}
