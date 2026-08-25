"use client";

import Link from "next/link";
import { Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, GraduationCap, Send, Sparkles } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, hydrated, login, register, loginAsDemoCandidate } = useApp();
  const [role, setRole] = useState<UserRole>("recruiter");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedPartner, setSubmittedPartner] = useState(false);
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

    if (role === "partner") {
      window.setTimeout(() => {
        setLoading(false);
        login("partner", "mitra@kampus.ac.id", "");
        router.push("/partner");
      }, 500);
      return;
    }

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

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const next = safeNext(getNext());
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (next) redirectUrl.searchParams.set("next", next);
      redirectUrl.searchParams.set("role", role);

      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      setErrorMessage(`Tidak dapat masuk dengan Google: ${error instanceof Error ? error.message : "Coba lagi."}`);
    }
  };

  const emailPlaceholder =
    role === "recruiter"
      ? "alex@perusahaan.com"
      : role === "partner"
      ? "mitra@kampus.ac.id"
      : "nadia@email.com";

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
          Peran Akun
        </label>
        <RoleSelector
          role={role}
          onChange={(newRole) => {
            setRole(newRole);
            setSubmittedPartner(false);
          }}
        />
      </div>

      {errorMessage && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">{errorMessage}</div>}

      {role === "partner" ? (
        submittedPartner ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center space-y-3 my-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Pendaftaran Partner Terkirim!</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Permohonan pendaftaran partner telah kami terima. Tim Talent Network akan memverifikasi dan membuatkan akun khusus partner untuk lembaga Anda.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              onClick={() => setSubmittedPartner(false)}
            >
              Kirim Pendaftaran Lain
            </Button>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="partner-email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Email Lembaga / Kampus
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
                <Input
                  id="partner-email"
                  name="email"
                  className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                  required
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="mitra@kampus.ac.id"
                />
              </div>
            </div>

            <div>
              <label htmlFor="partner-institution" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Asal Lembaga / Kampus
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
                <Input
                  id="partner-institution"
                  name="institution"
                  className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                  required
                  placeholder="Universitas Indonesia / Instansi Partner"
                />
              </div>
            </div>

            <div className="rounded-xl border border-purple-100 bg-slate-100/50 p-3 text-xs text-purple-900 leading-relaxed">
              <p className="font-medium">
                💡 Pendaftaran partner akan diproses langsung untuk pembuatan akun khusus oleh tim Talent Network.
              </p>
            </div>

            <Button
              type="submit"
              className="mt-1 w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Kirim Pendaftaran ke Talent Network
                  <Send className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </>
        )
      ) : (
        <>
          {mode === "register" && (
            <div>
              <label htmlFor="full-name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
                <Input
                  id="full-name"
                  name="name"
                  className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                  required
                  autoComplete="name"
                  placeholder="Alex Wijaya"
                />
              </div>
            </div>
          )}

          {mode === "register" && role === "recruiter" && (
            <div>
              <label htmlFor="company-name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Nama Perusahaan
              </label>
              <Input id="company-name" name="companyName" className="h-10 sm:h-11 rounded-xl text-xs sm:text-sm" autoComplete="organization" placeholder="Nama perusahaan" required />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
              <Input
                id="email"
                name="email"
                className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                required
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={emailPlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
              <Input
                id="password"
                name="password"
                className="pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
                required
                minLength={6}
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Minimal 6 karakter"
              />
              <button
                type="button"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3.5 top-3 sm:top-3.5 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <label htmlFor="terms" className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-0.5">
              <input
                id="terms"
                name="terms"
                required
                type="checkbox"
                className="mt-0.5 size-4 rounded border-slate-300 accent-[#7C3AED]"
              />
              <span>Saya menyetujui Ketentuan Layanan & Privacy Policy.</span>
            </label>
          )}

          <Button
            type="submit"
            className="mt-1 w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Memproses…
              </>
            ) : (
              <>
                {mode === "login" ? "Masuk ke Workspace" : "Buat Akun ProofyLink"}
                <ArrowRight className="ml-1.5 size-4" />
              </>
            )}
          </Button>

          {supabaseConfigured && (
            <>
              <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                atau
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl text-xs sm:text-sm"
                disabled={loading}
                onClick={signInWithGoogle}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <span className="text-base font-bold text-[#4285F4]">G</span>}
                {loading ? "Menghubungkan ke Google..." : "Lanjutkan dengan Google"}
              </Button>
            </>
          )}

          {!supabaseConfigured && role === "candidate" && (
            <div className="mt-2 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 space-y-2.5 text-left shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1.5">
                  <Sparkles className="size-4 text-[#7C3AED]" /> Quick Demo Login
                </span>
                <span className="text-[10px] bg-purple-200 text-[#7C3AED] font-bold px-2 py-0.5 rounded-full">
                  Profil Lengkap
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Masuk sebagai <strong>Nadia Putri Rahayu</strong> (Senior Product Designer). Terisi penuh dengan riwayat Tokopedia & OVO untuk pengujian Career Advisor & Roadmap.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-10 text-xs font-semibold border-purple-300 bg-white text-[#7C3AED] hover:bg-purple-100 hover:text-[#6D28D9] rounded-xl shadow-2xs gap-1.5"
                onClick={() => {
                  loginAsDemoCandidate();
                  router.push("/candidate");
                }}
              >
                <User className="size-3.5" /> Masuk Akun Demo Kandidat (Nadia)
              </Button>
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs sm:text-sm text-slate-600 pt-1">
        {mode === "login" ? "Belum memiliki akun? " : "Sudah memiliki akun? "}
        <Link
          className="font-bold text-[#7C3AED] hover:underline"
          href={mode === "login" ? "/register" : "/login"}
        >
          {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
        </Link>
      </p>

      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
        <CheckCircle2 className="size-3.5 text-[#7C3AED]" />
        <span>{supabaseConfigured ? "Autentikasi Supabase aktif" : "Lingkungan demo terverifikasi"}</span>
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
  if (role === "partner") {
    return "/partner";
  }
  if (provisioningStatus !== "active") return "/recruiter/pending";
  if (next?.startsWith("/dashboard") || next?.startsWith("/search") || next?.startsWith("/shortlist") || next?.startsWith("/talent") || next?.startsWith("/recruiter") || next === "/pricing") return next;
  return "/dashboard";
}

function getNext() {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
}

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}
