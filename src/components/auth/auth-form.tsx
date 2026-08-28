"use client";

import Link from "next/link";
import { Building2, Eye, EyeOff, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, GraduationCap, Info, Send, Sparkles } from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";
import { OtpVerificationModal } from "./otp-verification-modal";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, hydrated, login, register, loginAsDemoCandidate, loginAsFreshCandidate } = useApp();
  const [role, setRole] = useState<UserRole>("recruiter");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedPartner, setSubmittedPartner] = useState(false);
  const [partnerErrors, setPartnerErrors] = useState<{ email?: string; institution?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    email: string;
    role: UserRole;
    destinationPath: string;
    name?: string;
    companyName?: string;
  } | null>(null);

  useEffect(() => {
    if (hydrated && user && !loading && !otpModalOpen && mode === "login") {
      router.replace(destination(user.role, getNext(), false));
    }
  }, [hydrated, user, loading, router, mode, otpModalOpen]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    const timer = window.setTimeout(() => setErrorMessage(error), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const companyName = String(form.get("companyName") ?? "").trim();

    if (role === "partner") {
      const institution = String(form.get("institution") ?? "").trim();
      const errors: { email?: string; institution?: string } = {};
      if (!email) {
        errors.email = "Email lembaga wajib diisi.";
      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Format email tidak valid.";
      }
      if (!institution) {
        errors.institution = "Asal lembaga atau kampus wajib diisi.";
      }
      if (Object.keys(errors).length > 0) {
        setPartnerErrors(errors);
        return;
      }
      setPartnerErrors({});
      setSubmittedPartner(true);
      return;
    }

    setLoading(true);
    const result = mode === "login" ? await login(role, email, password) : await register(name, role, email, password, companyName);
    if (result.error) {
      setLoading(false);
      setErrorMessage(`Tidak dapat ${mode === "login" ? "masuk" : "mendaftar"}: ${result.error}`);
      return;
    }
    
    // When registering, ALWAYS pop up the 6-digit OTP verification modal immediately
    if (mode === "register") {
      setLoading(false);
      const chosenRole = result.role ?? role;
      const dest = chosenRole === "recruiter" ? "/recruiter/onboarding" : chosenRole === "partner" ? "/partner" : "/candidate/onboarding";
      setPendingRegistration({ email, role: chosenRole, destinationPath: dest, name, companyName });
      setOtpModalOpen(true);
      return;
    }
    
    let synced: { role?: UserRole; provisioningStatus?: ProvisioningStatus } | null = null;
    if (supabaseConfigured) {
      synced = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || email.split("@")[0], companyName: companyName || undefined }),
      }).then((response) => response.ok ? response.json() : null).catch(() => null);
      if (!synced) {
        setLoading(false);
        setErrorMessage("Tidak dapat menyiapkan profil akun Anda. Periksa koneksi Anda dan coba lagi.");
        return;
      }
    }
    router.push(destination(synced?.role ?? result.role ?? role, getNext(), false, synced?.provisioningStatus ?? result.provisioningStatus));
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const next = getNext();
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (next && next.startsWith("/") && !next.startsWith("//")) redirectUrl.searchParams.set("next", next);
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
            setPartnerErrors({});
          }}
        />
      </div>

      {errorMessage && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{errorMessage}</div>}

      {role === "partner" ? (
        submittedPartner ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-center space-y-3 my-2">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Permintaan Partnership Dicatat</h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Permintaan partnership Anda telah dicatat dalam demo ini. Tidak ada akun sungguhan yang dibuat, tidak ada data yang dikirim ke server, dan sesi Anda tidak berubah.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              asChild
            >
              <Link href="/login">Kembali ke Halaman Masuk</Link>
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
                  aria-invalid={Boolean(partnerErrors.email)}
                  placeholder="mitra@kampus.ac.id"
                />
              </div>
              {partnerErrors.email && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  {partnerErrors.email}
                </p>
              )}
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
                  aria-invalid={Boolean(partnerErrors.institution)}
                  placeholder="Universitas Indonesia / Instansi Partner"
                />
              </div>
              {partnerErrors.institution && (
                <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
                  {partnerErrors.institution}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-purple-100 bg-slate-100/50 p-3 text-xs text-purple-900 leading-relaxed">
              <p className="font-medium">
                💡 Mode demo: pendaftaran partner hanya simulasi. Tidak ada akun yang dibuat dan data tidak dikirim ke server.
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
                  Mengirimkan…
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
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                aria-pressed={showPassword}
                className="absolute right-3.5 top-3 sm:top-3.5 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
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
              <span>
                Saya menyetujui{" "}
                <Link href="/terms" className="font-semibold text-[#7C3AED] hover:underline">
                  Syarat &amp; Ketentuan
                </Link>{" "}
                dan{" "}
                <Link href="/privacy" className="font-semibold text-[#7C3AED] hover:underline">
                  Kebijakan Privasi
                </Link>
                .
              </span>
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

          {process.env.NODE_ENV !== "production" && !supabaseConfigured && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5 shrink-0 text-[#7C3AED]" aria-hidden="true" />
              Mode demo: {mode === "login" ? "masuk" : "daftar"} dengan email apa pun
            </p>
          )}

          {process.env.NODE_ENV !== "production" && !supabaseConfigured && role === "candidate" && (
            <div className="mt-2 space-y-2">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 space-y-2.5 text-left shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1.5">
                    <Sparkles className="size-4 text-[#7C3AED]" /> Login Cepat Demo
                  </span>
                  <span className="text-[10px] bg-purple-200 text-[#7C3AED] font-bold px-2 py-0.5 rounded-full">
                    Profil Lengkap
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masuk sebagai <strong>Nadia Putri Rahayu</strong> (Senior Product Designer) dengan riwayat Tokopedia & OVO.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-10 text-xs font-semibold border-purple-300 bg-white text-[#7C3AED] hover:bg-purple-100 hover:text-[#6D28D9] rounded-xl shadow-2xs gap-1.5"
                  onClick={() => {
                    loginAsDemoCandidate();
                    router.refresh();
                    router.push("/candidate");
                  }}
                >
                  <User className="size-3.5" /> Masuk Akun Demo (Nadia)
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs font-medium border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl gap-1.5"
                onClick={() => {
                  loginAsFreshCandidate();
                  router.refresh();
                  router.push("/candidate/onboarding");
                }}
              >
                <Sparkles className="size-3.5 text-emerald-600" /> Uji Coba Daftar Kandidat Baru (Mulai Step 0)
              </Button>
            </div>
          )}

          {process.env.NODE_ENV !== "production" && !supabaseConfigured && role === "recruiter" && (
            <div className="mt-2 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs font-semibold border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 rounded-xl gap-1.5"
                onClick={() => {
                  router.push("/recruiter/onboarding");
                }}
              >
                <Building2 className="size-3.5 text-[#0b2342]" /> Uji Coba Onboarding Rekruter (3 Tahap)
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

      {pendingRegistration && (
        <OtpVerificationModal
          isOpen={otpModalOpen}
          email={pendingRegistration.email}
          onClose={() => setOtpModalOpen(false)}
          onSuccess={async () => {
            if (supabaseConfigured && pendingRegistration) {
              await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  role: pendingRegistration.role,
                  name: pendingRegistration.name || pendingRegistration.email.split("@")[0],
                  companyName: pendingRegistration.companyName || undefined,
                }),
              }).catch(() => null);
            }
            setOtpModalOpen(false);
            router.push(pendingRegistration.destinationPath);
          }}
          title="Verifikasi Akun Baru"
          description="Masukkan 6 digit kode OTP yang telah dikirimkan ke alamat email Anda untuk mengaktifkan akun."
        />
      )}
    </form>
  );
}

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function destination(role: UserRole, next: string | null, isRegistration = false, provisioningStatus?: ProvisioningStatus) {
  if (role === "candidate") {
    if (next?.startsWith("/candidate") || (next !== null && ["/profile", "/jobs", "/messages"].includes(next))) return next;
    return isRegistration ? "/candidate/onboarding" : "/candidate";
  }
  if (role === "partner") {
    return "/partner";
  }
  if (role === "recruiter") {
    if (isRegistration) return "/recruiter/onboarding";
    if (provisioningStatus !== "active") return "/recruiter/pending";
    if (next?.startsWith("/dashboard") || next?.startsWith("/search") || next?.startsWith("/shortlist") || next?.startsWith("/talent") || next?.startsWith("/recruiter") || next === "/pricing") return next;
    return "/dashboard";
  }
  return "/dashboard";
}

function getNext() {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
}
