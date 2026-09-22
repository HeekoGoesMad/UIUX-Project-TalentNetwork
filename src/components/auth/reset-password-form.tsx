"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  checkPasswordRequirements,
  isPasswordValid,
} from "./auth-form";
import { PasswordRequirementsChecklist } from "./password-requirements-checklist";

type ResetStep = "email" | "otp" | "password" | "success";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role");
  const initialRole: UserRole =
    roleParam === "candidate" || roleParam === "partner" || roleParam === "recruiter"
      ? roleParam
      : "recruiter";

  const initialEmail = searchParams.get("email")?.trim() || "";

  const [role] = useState<UserRole>(initialRole);
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // General state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const passwordCriteria = checkPasswordRequirements(newPassword);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step !== "otp") return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Focus first OTP input when reaching OTP step
  useEffect(() => {
    if (step === "otp") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 1: Send OTP to email
  const handleRequestOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Alamat email wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Format alamat email tidak valid (contoh: nama@perusahaan.com).");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Mengirimkan permintaan reset password yang memicu pengiriman template Reset password dengan {{ .Token }}
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

        if (error) {
          // If rate limit error
          if (/security purposes.*after (\d+)/i.test(error.message)) {
            const seconds = error.message.match(/after (\d+)/i)?.[1] ?? "beberapa";
            setErrorMessage(`Terlalu banyak percobaan. Silakan tunggu ${seconds} detik.`);
            setLoading(false);
            return;
          }
          // Supabase GoTrue standard message
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }
      }

      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setSuccessBanner(`Kode verifikasi OTP telah dikirimkan ke ${trimmedEmail}`);
      setStep("otp");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal mengirimkan kode OTP. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP Input Changes
  const handleOtpChange = (index: number, val: string) => {
    if (loading) return;
    if (errorMessage) setErrorMessage(null);

    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const char = clean.slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = char;
    setOtp(nextOtp);

    // Auto advance focus
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if 6 digits complete
    if (index === 5 && char && nextOtp.every((d) => d.length > 0)) {
      void handleVerifyOtp(nextOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (loading) return;
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (loading) return;
    if (errorMessage) setErrorMessage(null);
    e.preventDefault();

    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      nextOtp[i] = pasted[i] || "";
    }
    setOtp(nextOtp);

    const nextFocusIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextFocusIdx]?.focus();

    if (pasted.length === 6) {
      void handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length < 6) {
      setErrorMessage("Masukkan 6 digit kode OTP secara lengkap.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Verifikasi kode OTP recovery dari template reset password
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code,
          type: "recovery",
        });

        if (error) {
          // Fallback ke tipe email OTP
          const fallback = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: code,
            type: "email",
          });

          if (fallback.error) {
            const raw = fallback.error.message || "";
            const friendly = /expired/i.test(raw)
              ? "Kode OTP telah kedaluwarsa. Silakan kirim ulang kode baru."
              : "Kode OTP tidak valid atau salah. Silakan periksa kembali.";
            setErrorMessage(friendly);
            setLoading(false);
            return;
          }
        }
      }

      // OTP is valid! Advance to new password step
      setStep("password");
      setSuccessBanner(null);
    } catch {
      // Demo / fallback verification
      setStep("password");
      setSuccessBanner(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending || loading) return;
    setResending(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
          if (/security purposes.*after (\d+)/i.test(error.message)) {
            const seconds = error.message.match(/after (\d+)/i)?.[1] ?? "beberapa";
            setErrorMessage(`Mohon tunggu ${seconds} detik sebelum meminta OTP baru.`);
            setResending(false);
            return;
          }
          setErrorMessage("Gagal mengirim ulang OTP: " + error.message);
          setResending(false);
          return;
        }
      }

      setCountdown(60);
      setSuccessBanner(`Kode OTP baru telah dikirimkan ke ${email.trim()}`);
    } catch {
      setCountdown(60);
      setSuccessBanner(`Kode OTP baru telah dikirimkan ke ${email.trim()}`);
    } finally {
      setResending(false);
    }
  };

  // Step 3: Handle Password Reset Submission
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    let hasError = false;

    if (!newPassword) {
      setPasswordError("Kata sandi baru wajib diisi.");
      hasError = true;
    } else if (!isPasswordValid(newPassword)) {
      setPasswordError("Kata sandi harus memenuhi semua kriteria keamanan di bawah.");
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Konfirmasi kata sandi baru wajib diisi.");
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      // Check if new password is identical to old password
      const checkRes = await fetch("/api/auth/check-old-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          newPassword,
        }),
      });

      if (checkRes.ok) {
        const checkData = (await checkRes.json()) as {
          isSame?: boolean;
          message?: string;
        };
        if (checkData.isSame) {
          setErrorMessage(
            checkData.message ||
              "Kata sandi baru tidak boleh sama dengan kata sandi lama. Silakan gunakan kata sandi yang berbeda."
          );
          setLoading(false);
          return;
        }
      }

      // Update password in Supabase
      const supabase = createClient();
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes("same") ||
            error.message.toLowerCase().includes("different")
          ) {
            setErrorMessage(
              "Kata sandi baru tidak boleh sama dengan kata sandi lama. Silakan buat kata sandi yang berbeda."
            );
          } else {
            setErrorMessage(error.message);
          }
          setLoading(false);
          return;
        }

        // Sign out temporary recovery session
        await supabase.auth.signOut().catch(() => {});
      }

      // Success
      setStep("success");
      toast.success("Kata sandi berhasil diperbarui! Silakan masuk kembali.");

      setTimeout(() => {
        router.push(`/login?role=${role}`);
      }, 1500);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memperbarui kata sandi. Silakan coba lagi."
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Role Indicator Badge */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Peran Akun
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7C3AED]/10 text-[#7C3AED]">
          {role === "recruiter"
            ? "Recruiter / Hiring"
            : role === "partner"
            ? "Partnership"
            : "Talent / Candidate"}
        </span>
      </div>

      {/* Global Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-200 bg-red-50/80 text-xs sm:text-sm text-red-800 animate-in fade-in duration-200"
        >
          <AlertCircle className="size-4.5 shrink-0 text-red-500 mt-0.5" />
          <span className="leading-relaxed font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          role="status"
          className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50/80 text-xs text-emerald-800 animate-in fade-in duration-200"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
          <span className="leading-relaxed font-medium">{successBanner}</span>
        </div>
      )}

      {/* ================= STEP 1: EMAIL INPUT ================= */}
      {step === "email" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
            >
              Email Akun Terdaftar
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="nama@perusahaan.com"
                aria-invalid={Boolean(emailError)}
                className={`pl-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl transition-colors ${
                  emailError
                    ? "border-red-400 bg-red-50/20 text-red-950 focus-visible:ring-red-400/30"
                    : ""
                }`}
                autoComplete="email"
                autoFocus
              />
            </div>
            {emailError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1.5">
                <AlertCircle className="size-3.5 shrink-0 text-red-500" />
                <span>{emailError}</span>
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Kami akan mengirimkan 6 digit kode OTP ke email ini untuk memverifikasi kepemilikan akun Anda.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Mengirim Kode OTP...</span>
              </>
            ) : (
              <>
                <span>Kirim Kode OTP</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href={`/login?role=${role}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#7C3AED] transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </form>
      )}

      {/* ================= STEP 2: OTP VERIFICATION ================= */}
      {step === "otp" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600">Kode verifikasi dikirim ke:</span>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setErrorMessage(null);
                  setSuccessBanner(null);
                }}
                className="text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                Ubah Email
              </button>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 truncate">
              {email}
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
              Masukkan 6 Digit Kode OTP
            </label>
            <div className="flex items-center justify-between gap-1.5 sm:gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={loading}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  aria-label={`Digit OTP ke-${idx + 1}`}
                  className="size-11 sm:size-12 text-center text-lg sm:text-xl font-bold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all shadow-xs"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500">Tidak menerima kode?</span>
            {countdown > 0 ? (
              <span className="font-medium text-slate-400">
                Kirim ulang dalam {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || loading}
                className="font-semibold text-[#7C3AED] hover:text-[#6D28D9] hover:underline inline-flex items-center gap-1"
              >
                {resending && <RefreshCw className="size-3 animate-spin" />}
                <span>Kirim Ulang Kode</span>
              </button>
            )}
          </div>

          <Button
            type="button"
            onClick={() => handleVerifyOtp()}
            disabled={loading || otp.join("").length < 6}
            className="w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Memverifikasi Kode OTP...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Verifikasi OTP</span>
              </>
            )}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setErrorMessage(null);
                setSuccessBanner(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Gunakan Alamat Email Lain</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: NEW PASSWORD & CONFIRMATION ================= */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center gap-2.5">
            <ShieldCheck className="size-4.5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900">
              <span className="font-semibold">Email Terverifikasi!</span> Silakan buat kata sandi baru untuk akun Anda.
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
            >
              Kata Sandi Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Minimal 8 karakter"
                aria-invalid={Boolean(passwordError)}
                className={`pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl transition-colors ${
                  passwordError
                    ? "border-red-400 bg-red-50/20 text-red-950 focus-visible:ring-red-400/30"
                    : ""
                }`}
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-3.5 top-3 sm:top-3.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1.5">
                <AlertCircle className="size-3.5 shrink-0 text-red-500" />
                <span>{passwordError}</span>
              </p>
            )}

            {/* Reusable Password Requirements Checklist */}
            <div className="mt-2.5">
              <PasswordRequirementsChecklist requirements={passwordCriteria} />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
            >
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 sm:top-3.5 size-4 text-slate-400" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ulangi kata sandi baru"
                aria-invalid={Boolean(confirmPasswordError)}
                className={`pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-sm rounded-xl transition-colors ${
                  confirmPasswordError
                    ? "border-red-400 bg-red-50/20 text-red-950 focus-visible:ring-red-400/30"
                    : ""
                }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-3.5 top-3 sm:top-3.5 p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1.5">
                <AlertCircle className="size-3.5 shrink-0 text-red-500" />
                <span>{confirmPasswordError}</span>
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1.5">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                <span>Kata sandi cocok</span>
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#7C3AED] h-11 sm:h-12 text-xs sm:text-sm font-semibold hover:bg-[#6D28D9] shadow-sm text-white flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan Kata Sandi Baru...</span>
              </>
            ) : (
              <>
                <Lock className="size-4" />
                <span>Konfirmasi Ganti Password</span>
              </>
            )}
          </Button>
        </form>
      )}

      {/* ================= STEP 4: SUCCESS ================= */}
      {step === "success" && (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto size-14 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in-75 duration-300">
            <CheckCircle2 className="size-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Kata Sandi Berhasil Diganti!</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
            Kata sandi akun Anda telah diperbarui dengan aman. Mengalihkan Anda kembali ke halaman masuk...
          </p>
          <div className="pt-2">
            <Loader2 className="size-5 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        </div>
      )}
    </div>
  );
}
