"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus, UserRole } from "@/types";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, GraduationCap, Info, Loader2, Lock, Mail, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConsentModal } from "./consent-modal";
import { OtpVerificationModal } from "./otp-verification-modal";
import { RoleSelector } from "./role-selector";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, hydrated, login, register, loginAsDemoCandidate, loginAsFreshCandidate, loginAsDemoPartner } = useApp();
  const [role, setRole] = useState<UserRole>("recruiter");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    email: string;
    role: UserRole;
    destinationPath: string;
    name?: string;
    companyName?: string;
  } | null>(null);

  useEffect(() => {
    if (hydrated && user && !loading && !otpModalOpen && mode === "login") {
      const dest = destination(user.role, getNext(), false, user.provisioningStatus);
      window.location.href = dest;
    }
  }, [hydrated, user, loading, mode, otpModalOpen]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    const timer = window.setTimeout(() => setErrorMessage(error), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const registrationDest = (chosenRole: UserRole) =>
    chosenRole === "recruiter"
      ? "/recruiter/onboarding"
      : chosenRole === "partner"
      ? "/partner/onboarding"
      : "/candidate/onboarding";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const rawName = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const companyName = role === "recruiter" || role === "partner" ? rawName : String(form.get("companyName") ?? "").trim();
    const name = rawName;

    if (mode === "register" && !consentAgreed) {
      setConsentModalOpen(true);
      setErrorMessage("Harap baca dan setujui Syarat & Ketentuan serta Kebijakan Privasi terlebih dahulu.");
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
      const dest = registrationDest(chosenRole);
      if (result.emailResent) toast.info("Akun sudah terdaftar — masukkan kode OTP dari email Anda.");
      setPendingRegistration({ email, role: chosenRole, destinationPath: dest, name, companyName });
      setOtpModalOpen(true);
      return;
    }

    // Login flow: app-provider's login() already synced with /api/auth/sync!
    const dest = destination(
      result.role ?? role,
      getNext(),
      false,
      result.provisioningStatus
    );
    window.location.href = dest;
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
          }}
        />
      </div>

      {errorMessage && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700 space-y-2">
          <p className="font-medium">{errorMessage}</p>
          {errorMessage.includes("Talent / Candidate") && role !== "candidate" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRole("candidate");
                setErrorMessage(null);
              }}
              className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs h-7 px-2.5 rounded-lg"
            >
              Beralih ke Tab Kandidat
            </Button>
          )}
          {errorMessage.includes("Recruiter / Hiring") && role !== "recruiter" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRole("recruiter");
                setErrorMessage(null);
              }}
              className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs h-7 px-2.5 rounded-lg"
            >
              Beralih ke Tab Rekruter
            </Button>
          )}
          {errorMessage.includes("Partnership") && role !== "partner" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRole("partner");
                setErrorMessage(null);
              }}
              className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs h-7 px-2.5 rounded-lg"
            >
              Beralih ke Tab Partnership
            </Button>
          )}
        </div>
      )}

      {mode === "register" && (
        <div>
          <label htmlFor="full-name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            {role === "recruiter" ? "Nama Perusahaan" : role === "partner" ? "Nama Lembaga / Kampus" : "Nama Lengkap"}
          </label>
          <div className="relative">
            {role === "recruiter" ? (
              <Building2 className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
            ) : role === "partner" ? (
              <GraduationCap className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
            ) : (
              <User className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
            )}
            <Input
              id="full-name"
              name="name"
              className="pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl"
              required
              autoComplete={role === "recruiter" || role === "partner" ? "organization" : "name"}
              placeholder={
                role === "recruiter"
                  ? "PT Inovasi Digital Nusantara"
                  : role === "partner"
                  ? "Universitas Indonesia / Career Center ITB"
                  : "Alex Wijaya"
              }
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
          {role === "partner" ? "Email Lembaga / Kampus" : role === "recruiter" ? "Email Perusahaan / Kerja" : "Alamat Email"}
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
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <label htmlFor="terms" className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => {
                if (!consentAgreed) {
                  setConsentModalOpen(true);
                } else {
                  setConsentAgreed(e.target.checked);
                }
              }}
              className="mt-0.5 size-4 rounded border-slate-300 accent-[#7C3AED]"
            />
            <span className="leading-relaxed">
              Saya menyetujui{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setConsentModalOpen(true);
                }}
                className="font-bold text-[#7C3AED] hover:underline underline-offset-2"
              >
                Syarat &amp; Ketentuan, Persetujuan Akses Data
              </button>{" "}
              dan{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setConsentModalOpen(true);
                }}
                className="font-bold text-[#7C3AED] hover:underline underline-offset-2"
              >
                Kebijakan Privasi
              </button>
              .
            </span>
          </label>

          {consentAgreed ? (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span>Persetujuan Akses Data, Syarat &amp; Kebijakan telah disetujui</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 pl-6">
              💡 Wajib ditinjau &amp; disetujui sebelum membuat akun di ProofyLink.
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="mt-1 w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white"
        disabled={loading || otpModalOpen}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {otpModalOpen ? "Mengalihkan ke Workspace…" : "Memproses…"}
          </>
        ) : (
          <>
            {mode === "login"
              ? role === "partner"
                ? "Masuk ke Workspace Kemitraan"
                : "Masuk ke Workspace"
              : role === "partner"
              ? "Daftar Kemitraan Talent Network"
              : "Buat Akun ProofyLink"}
            <ArrowRight className="ml-1.5 size-4" />
          </>
        )}
      </Button>

      {mode === "register" && (
        <button
          type="button"
          className="text-xs font-semibold text-[#7C3AED] hover:underline underline-offset-2"
          onClick={() => {
            const typedEmail = (document.getElementById("email") as HTMLInputElement | null)?.value?.trim();
            if (!typedEmail) {
              toast.error("Masukkan email Anda terlebih dahulu.");
              return;
            }
            setPendingRegistration({ email: typedEmail, role, destinationPath: registrationDest(role) });
            setOtpModalOpen(true);
          }}
        >
          Sudah menerima kode OTP? Verifikasi sekarang
        </button>
      )}

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
              Masuk sebagai <strong>Nadia Putri Rahayu</strong> (Senior Product Designer) dengan riwayat Tokopedia &amp; OVO.
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

      {process.env.NODE_ENV !== "production" && !supabaseConfigured && role === "partner" && (
        <div className="mt-2 space-y-2">
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 space-y-2.5 text-left shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#7C3AED] flex items-center gap-1.5">
                <Sparkles className="size-4 text-[#7C3AED]" /> Login Cepat Demo Kemitraan
              </span>
              <span className="text-[10px] bg-purple-200 text-[#7C3AED] font-bold px-2 py-0.5 rounded-full">
                Kampus Mitra
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Masuk sebagai <strong>Universitas Indonesia</strong> (Career Center) untuk verifikasi mahasiswa &amp; pantau penempatan karir.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-10 text-xs font-semibold border-purple-300 bg-white text-[#7C3AED] hover:bg-purple-100 hover:text-[#6D28D9] rounded-xl shadow-2xs gap-1.5"
              onClick={() => {
                loginAsDemoPartner();
                router.refresh();
                router.push("/partner");
              }}
            >
              <GraduationCap className="size-3.5" /> Masuk Akun Demo (Universitas Indonesia)
            </Button>
          </div>
        </div>
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
            setLoading(true);
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
            window.location.href = pendingRegistration.destinationPath;
          }}
          title="Verifikasi Akun Baru"
          description="Masukkan 6 digit kode OTP yang telah dikirimkan ke alamat email Anda untuk mengaktifkan akun."
        />
      )}

      <ConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onAccept={() => {
          setConsentAgreed(true);
          setErrorMessage(null);
        }}
      />
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
    if (isRegistration) return "/partner/onboarding";
    if (provisioningStatus !== "active") return "/partner/pending";
    if (next?.startsWith("/partner")) return next;
    return "/partner";
  }
  if (role === "recruiter") {
    if (isRegistration) return "/recruiter/onboarding";
    if (provisioningStatus !== "active") return "/recruiter/pending";
    if (next?.startsWith("/dashboard") || next?.startsWith("/search") || next?.startsWith("/shortlist") || next?.startsWith("/talent") || next?.startsWith("/recruiter") || next === "/pricing") return next;
    return "/dashboard";
  }
  if (role === "admin") {
    return next?.startsWith("/admin") ? next : "/admin";
  }
  return "/dashboard";
}

function getNext() {
  return typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("next");
}
