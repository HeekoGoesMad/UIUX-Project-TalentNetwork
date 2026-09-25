"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPasswordRequirements, isPasswordValid } from "@/components/auth/auth-form";

function GoogleIcon({ className = "size-4" }: { className?: string }) {
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

export function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const rawRole = searchParams.get("role");
  const nextParam = searchParams.get("next");

  const defaultNext =
    rawRole === "recruiter"
      ? "/recruiter/onboarding"
      : rawRole === "partner"
      ? "/partner/onboarding"
      : "/candidate/onboarding";

  const destination = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
    ? nextParam
    : defaultNext;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const criteria = checkPasswordRequirements(password);
  const allCriteriaMet = isPasswordValid(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage("Silakan masukkan kata sandi baru.");
      return;
    }

    if (!allCriteriaMet) {
      setErrorMessage("Kata sandi harus minimal 8 karakter dan memuat huruf besar, huruf kecil, serta angka.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/user/password/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Gagal mengatur kata sandi.");
      }

      toast.success("Kata sandi berhasil diatur! Mengalihkan ke onboarding...");
      startTransition(() => {
        window.location.href = destination;
      });
    } catch (err) {
      setLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat mengatur kata sandi.");
    }
  };

  const handleSkip = () => {
    startTransition(() => {
      window.location.href = destination;
    });
  };

  return (
    <div className="space-y-5">
      {/* Connected Google Account Badge */}
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white shadow-2xs">
          <GoogleIcon className="size-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
            <span>Akun Google Terhubung</span>
            <CheckCircle2 className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Akun Anda telah berhasil dibuat via Google Sign-In.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
          <p className="font-medium leading-relaxed">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSetPassword} className="space-y-4">
        {/* Password Input */}
        <div>
          <label htmlFor="setup-password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
            <Input
              id="setup-password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className="pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl transition-colors"
            />
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 sm:top-3.5 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {/* Password Criteria Checklist */}
          <div className="mt-2.5 space-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs text-slate-600 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700">Kriteria Kata Sandi:</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {[criteria.hasMinLength, criteria.hasUppercase, criteria.hasLowercase, criteria.hasNumber].filter(Boolean).length}/4 terpenuhi
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              <div className={`flex items-center gap-1.5 text-[11px] transition-colors ${criteria.hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <CheckCircle2 className={`size-3.5 shrink-0 ${criteria.hasMinLength ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Minimal 8 karakter</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] transition-colors ${criteria.hasUppercase ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <CheckCircle2 className={`size-3.5 shrink-0 ${criteria.hasUppercase ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Huruf besar (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] transition-colors ${criteria.hasLowercase ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <CheckCircle2 className={`size-3.5 shrink-0 ${criteria.hasLowercase ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Huruf kecil (a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 text-[11px] transition-colors ${criteria.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                <CheckCircle2 className={`size-3.5 shrink-0 ${criteria.hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                <span>Minimal 1 angka (0-9)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="setup-confirm-password" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
            Konfirmasi Kata Sandi
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
            <Input
              id="setup-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              autoComplete="new-password"
              placeholder="Ulangi kata sandi baru"
              className="pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl transition-colors"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              aria-pressed={showConfirmPassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-3 sm:top-3.5 rounded-md p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <p className={`flex items-center gap-1.5 text-xs font-medium mt-1.5 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Kata sandi cocok</span>
                </>
              ) : (
                <>
                  <AlertCircle className="size-3.5" />
                  <span>Kata sandi belum cocok</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <Button
            type="submit"
            disabled={loading || !password || !allCriteriaMet || !passwordsMatch}
            className="flex-1 rounded-xl bg-[#7C3AED] h-11 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] text-white shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                <span>Menyimpan Kata Sandi...</span>
              </>
            ) : (
              <>
                <span>Atur Kata Sandi</span>
                <ArrowRight className="ml-1.5 size-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={loading}
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 h-11 px-5 text-xs sm:text-sm font-medium"
          >
            Lewati untuk Sekarang
          </Button>
        </div>
      </form>

      {/* Helpful security explanation */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-xs text-slate-500 flex items-start gap-2">
        <ShieldCheck className="size-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          Langkah ini opsional. Anda tetap dapat masuk kapan saja menggunakan Google Sign-In, atau mengatur kata sandi nanti di menu <strong>Keamanan Akun</strong>.
        </p>
      </div>
    </div>
  );
}
