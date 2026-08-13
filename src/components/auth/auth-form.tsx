"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, hydrated, login, register } = useApp();
  const [role, setRole] = useState<UserRole>("recruiter");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && user && !loading) {
      router.replace(destination(user.role, getNext(), mode === "register"));
    }
  }, [hydrated, user, loading, router, mode]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    const timer = window.setTimeout(() => setErrorMessage(error), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const companyName = String(form.get("companyName") ?? "").trim();
    const result = mode === "login" ? await login(role, email, password) : await register(name, role, email, password, companyName);
    if (result.error) {
      setLoading(false);
      setErrorMessage(`Tidak dapat ${mode === "login" ? "masuk" : "mendaftar"}: ${result.error}`);
      return;
    }
    if (result.needsConfirmation) {
      setLoading(false);
      setErrorMessage("Akun dibuat. Periksa email untuk mengonfirmasi akun sebelum masuk melalui tautan di email.");
      return;
    }
    let synced: { role?: UserRole; provisioningStatus?: ProvisioningStatus } | null = null;
    if (supabaseConfigured) {
      synced = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || email.split("@")[0], companyName: companyName || undefined }),
      }).then((response) => response.ok ? response.json() : null).catch(() => null);
    }
    router.push(destination(synced?.role ?? result.role ?? role, getNext(), mode === "register", synced?.provisioningStatus ?? result.provisioningStatus));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Peran Akun
        </label>
        <RoleSelector role={role} onChange={setRole} />
      </div>

      {errorMessage && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{errorMessage}</div>}

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
              placeholder="Nama lengkap"
            />
          </div>
        </div>
      )}

      {mode === "register" && role === "recruiter" && (
        <div>
          <label htmlFor="company-name" className="block text-xs font-bold text-slate-700 mb-1">
            Nama Perusahaan
          </label>
          <Input id="company-name" name="companyName" className="h-9 rounded-xl text-xs" autoComplete="organization" placeholder="Nama perusahaan" required />
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
            placeholder="nama@perusahaan.com"
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
        <span>{supabaseConfigured ? "Autentikasi Supabase aktif" : "Lingkungan demo lokal"}</span>
      </div>
    </form>
  );
}

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== "true";

function destination(role: UserRole, next: string | null, isRegistration = false, provisioningStatus?: ProvisioningStatus) {
  if (role === "candidate") {
    if (next?.startsWith("/candidate") || (next !== null && ["/profile", "/jobs", "/messages"].includes(next))) return next;
    return isRegistration ? "/candidate/onboarding" : "/candidate";
  }
  if (provisioningStatus !== "active") return "/recruiter/pending";
  if (next?.startsWith("/dashboard") || next?.startsWith("/search") || next?.startsWith("/shortlist") || next?.startsWith("/talent") || next?.startsWith("/recruiter") || next === "/pricing") return next;
  return "/dashboard";
}

function getNext() {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
}
