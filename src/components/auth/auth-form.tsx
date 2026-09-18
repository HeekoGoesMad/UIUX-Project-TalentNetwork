"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/providers/app-provider";
import { ProvisioningStatus, UserRole } from "@/types";
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConsentModal } from "./consent-modal";
import { OtpVerificationModal } from "./otp-verification-modal";
import { RoleSelector } from "./role-selector";

function GoogleLogo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.39 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.61 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { user, hydrated, login, register, loginAsDemoCandidate, loginAsFreshCandidate, loginAsDemoPartner } = useApp();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const validRoleParam = roleParam === "candidate" || roleParam === "recruiter" || roleParam === "partner" ? roleParam : null;
  const [role, setRole] = useState<UserRole>(validRoleParam ?? "recruiter");
  const [prevRoleParam, setPrevRoleParam] = useState<UserRole | null>(validRoleParam);

  if (validRoleParam !== prevRoleParam) {
    setPrevRoleParam(validRoleParam);
    if (validRoleParam) {
      setRole(validRoleParam);
    }
  }
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [pendingGoogleAuth, setPendingGoogleAuth] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    email: string;
    role: UserRole;
    destinationPath: string;
    name?: string;
    companyName?: string;
  } | null>(null);

  useEffect(() => {
    if (hydrated && user && !loading && !googleLoading && !otpModalOpen && mode === "login") {
      const dest = destination(user.role, getNext(), false, user.provisioningStatus);
      window.location.href = dest;
    }
  }, [hydrated, user, loading, googleLoading, mode, otpModalOpen]);

  // Reset loading indicators if the user navigates back from external Google OAuth page (bfcache)
  useEffect(() => {
    const handlePageRestore = () => {
      setLoading(false);
      setGoogleLoading(false);
      setPendingGoogleAuth(false);
    };

    window.addEventListener("pageshow", handlePageRestore);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setGoogleLoading(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pageshow", handlePageRestore);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

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

  const handleGoogleClick = () => {
    setErrorMessage(null);
    setPendingGoogleAuth(true);
    setConsentModalOpen(true);
  };

  const executeGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const next = getNext();
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (next && next.startsWith("/") && !next.startsWith("//")) redirectUrl.searchParams.set("next", next);
      redirectUrl.searchParams.set("role", role);

      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      setGoogleLoading(false);
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
        <div className="space-y-1.5 py-1">
          <label htmlFor="terms" className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
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
              className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-[#7C3AED] accent-[#7C3AED] focus:ring-[#7C3AED]/20 cursor-pointer"
            />
            <span className="leading-relaxed">
              Saya menyetujui{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setConsentModalOpen(true);
                }}
                className="font-medium text-[#7C3AED] hover:underline underline-offset-2 cursor-pointer"
              >
                Syarat &amp; Ketentuan Akses Data
              </button>{" "}
              serta{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setConsentModalOpen(true);
                }}
                className="font-medium text-[#7C3AED] hover:underline underline-offset-2 cursor-pointer"
              >
                Kebijakan Privasi
              </button>
              .
            </span>
          </label>
          {consentAgreed && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 pl-6.5">
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span>Ketentuan &amp; akses data telah disetujui</span>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        className="mt-1 w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white"
        disabled={loading || googleLoading || otpModalOpen}
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
        <div className="text-center">
          <button
            type="button"
            className="text-xs font-medium text-slate-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
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
            Sudah menerima kode OTP? Verifikasi di sini
          </button>
        </div>
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
            className="h-11 w-full rounded-xl text-xs sm:text-sm font-medium border-slate-300 hover:bg-slate-50 gap-2.5 shadow-2xs"
            disabled={loading || googleLoading}
            onClick={handleGoogleClick}
          >
            {googleLoading ? <Loader2 className="size-4.5 animate-spin text-slate-500" /> : <GoogleLogo className="size-4.5 shrink-0" />}
            <span>{googleLoading ? "Menghubungkan ke Google..." : "Lanjutkan dengan Google"}</span>
          </Button>
        </>
      )}

      {process.env.NODE_ENV !== "production" && !supabaseConfigured && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {role === "candidate" && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs font-semibold border-purple-200 bg-purple-50/70 text-[#7C3AED] hover:bg-purple-100 rounded-xl gap-1.5"
                onClick={() => {
                  loginAsDemoCandidate();
                  router.refresh();
                  router.push("/candidate");
                }}
              >
                <User className="size-3.5" /> Demo Profil (Nadia)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs font-medium border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl gap-1.5"
                onClick={() => {
                  loginAsFreshCandidate();
                  router.refresh();
                  router.push("/candidate/onboarding");
                }}
              >
                <UserPlus className="size-3.5 text-emerald-600" /> Onboarding Baru
              </Button>
            </div>
          )}

          {role === "recruiter" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs font-semibold border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-xl gap-1.5"
              onClick={() => {
                router.push("/recruiter/onboarding");
              }}
            >
              <Building2 className="size-3.5 text-slate-600" /> Demo Onboarding Rekruter
            </Button>
          )}

          {role === "partner" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 text-xs font-semibold border-purple-200 bg-purple-50/70 text-[#7C3AED] hover:bg-purple-100 rounded-xl gap-1.5"
              onClick={() => {
                loginAsDemoPartner();
                router.refresh();
                router.push("/partner");
              }}
            >
              <GraduationCap className="size-3.5" /> Demo Kampus Mitra (UI)
            </Button>
          )}
        </div>
      )}

      <p className="text-center text-xs sm:text-sm text-slate-600 pt-1">
        {mode === "login" ? "Belum memiliki akun? " : "Sudah memiliki akun? "}
        <Link
          className="font-bold text-[#7C3AED] hover:underline"
          href={mode === "login" ? `/register?role=${role}` : `/login?role=${role}`}
        >
          {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
        </Link>
      </p>

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
        actionTitle={pendingGoogleAuth ? "Lanjutkan dengan Google" : undefined}
        onClose={() => {
          setConsentModalOpen(false);
          setPendingGoogleAuth(false);
        }}
        onAccept={() => {
          setConsentAgreed(true);
          setErrorMessage(null);
          if (pendingGoogleAuth) {
            setPendingGoogleAuth(false);
            void executeGoogleSignIn();
          }
        }}
      />
    </form>
  );
}

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function destination(role: UserRole, next: string | null, isRegistration = false, provisioningStatus?: ProvisioningStatus) {
  if (role === "candidate") {
    if (next?.startsWith("/candidate") || next?.startsWith("/jobs") || (next !== null && ["/profile", "/messages"].includes(next))) return next;
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
