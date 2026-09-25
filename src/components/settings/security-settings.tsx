"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/providers/app-provider";
import { checkPasswordRequirements, isPasswordValid } from "@/components/auth/auth-form";

export function SecuritySettings() {
  const { user, devBypass } = useApp();

  const [passwordSetOverride, setPasswordSetOverride] = useState<boolean | null>(null);
  const [supabaseHasPassword, setSupabaseHasPassword] = useState<boolean | null>(null);
  const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(false);

  // Initial password setup fields (for OAuth users with no password set yet)
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [showSetupConfirm, setShowSetupConfirm] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  // Change password fields (for accounts with existing password)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof user?.hasPassword !== "boolean") {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          const hasEmailProvider = data.user?.app_metadata?.providers?.includes("email");
          const hasUserMetadata = Boolean(data.user?.user_metadata?.hasPassword);
          const hasIdentityEmail = data.user?.identities?.some((id) => id.provider === "email");
          if (hasEmailProvider || hasUserMetadata || hasIdentityEmail) {
            setSupabaseHasPassword(true);
          } else if (data.user?.app_metadata?.providers?.includes("google")) {
            setSupabaseHasPassword(false);
          }
        })
        .catch(() => {});
    }
  }, [user?.hasPassword]);

  const hasPassword =
    passwordSetOverride !== null
      ? passwordSetOverride
      : typeof user?.hasPassword === "boolean"
      ? user.hasPassword
      : supabaseHasPassword ?? true;

  // Initial setup criteria
  const setupCriteria = checkPasswordRequirements(setupPassword);
  const setupAllCriteriaMet = isPasswordValid(setupPassword);
  const setupPasswordsMatch = setupPassword.length > 0 && setupPassword === setupConfirm;

  // Change password criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Same password check
  const isSameAsCurrent =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword.trim() === newPassword.trim();

  // All criteria met for update
  const allCriteriaMet = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  // Total criteria fulfilled count for the checklist (5 items including match)
  const fulfilledCount = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    passwordsMatch,
  ].filter(Boolean).length;

  // Strength score (out of 4)
  const strengthScore = [hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length;
  const strengthColor =
    strengthScore === 4
      ? "bg-emerald-500"
      : strengthScore === 3
      ? "bg-emerald-400"
      : strengthScore === 2
      ? "bg-amber-500"
      : "bg-red-500";
  const strengthLabel =
    strengthScore === 4
      ? "Sangat Kuat"
      : strengthScore === 3
      ? "Kuat"
      : strengthScore === 2
      ? "Sedang"
      : "Lemah";

  const handleInitialSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!setupAllCriteriaMet) {
      toast.error("Kata sandi harus minimal 8 karakter dan memuat kombinasi huruf besar, huruf kecil, serta angka.");
      return;
    }

    if (setupPassword !== setupConfirm) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setSetupLoading(true);

    try {
      if (devBypass || !user) {
        await new Promise((res) => setTimeout(res, 600));
        toast.success("Demo Mode — kata sandi disimulasikan berhasil diatur.");
        setPasswordSetOverride(true);
        setIsSettingInitialPassword(false);
        setSetupPassword("");
        setSetupConfirm("");
        return;
      }

      const res = await fetch("/api/user/password/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: setupPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengatur kata sandi.");
      }

      toast.success("Kata sandi berhasil diatur dengan aman.");
      setPasswordSetOverride(true);
      setIsSettingInitialPassword(false);
      setSetupPassword("");
      setSetupConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengatur kata sandi.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("Silakan masukkan kata sandi saat ini.");
      return;
    }

    if (currentPassword.trim() === newPassword.trim()) {
      toast.error("Kata sandi baru tidak boleh sama dengan kata sandi saat ini.");
      return;
    }

    if (!hasMinLength) {
      toast.error("Kata sandi baru minimal harus terdiri dari 8 karakter.");
      return;
    }

    if (!hasUppercase) {
      toast.error("Kata sandi baru harus mengandung huruf besar (A-Z).");
      return;
    }

    if (!hasLowercase) {
      toast.error("Kata sandi baru harus mengandung huruf kecil (a-z).");
      return;
    }

    if (!hasNumber) {
      toast.error("Kata sandi baru harus mengandung setidaknya satu angka (0-9).");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      if (devBypass || !user) {
        await new Promise((res) => setTimeout(res, 800));
        toast.success("Demo Mode — tidak tersimpan: kata sandi tidak benar-benar diperbarui.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        return;
      }

      const supabase = createClient();
      const email =
        user?.email ?? (await supabase.auth.getUser()).data.user?.email ?? null;

      if (!email) {
        toast.error("Sesi tidak ditemukan. Silakan masuk kembali lalu coba lagi.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Kata sandi saat ini salah.");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Kata sandi berhasil diperbarui dengan aman.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui kata sandi. Silakan coba lagi nanti."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Keamanan &amp; Kata Sandi
        </h2>
        <p className="text-sm text-muted-foreground">
          Kelola kata sandi akun Anda dan pastikan kredensial login tetap aman.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!hasPassword ? (
            /* Card for Accounts where Password is NOT set */
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Kata Sandi Akun</CardTitle>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
                        Belum diatur
                      </span>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Akun Anda saat ini terhubung via Google. Atur kata sandi agar Anda juga dapat masuk dengan email dan kata sandi.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {!isSettingInitialPassword ? (
                  <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">Password</span>
                          <span className="text-xs text-amber-700 font-medium bg-amber-100/70 px-2 py-0.5 rounded">
                            Not set
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Menambahkan kata sandi memberikan Anda opsi login alternatif dan pemulihan akun yang fleksibel.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => setIsSettingInitialPassword(true)}
                        className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold h-9 px-4 shrink-0 shadow-2xs gap-1.5"
                      >
                        <KeyRound className="size-3.5" />
                        <span>Atur Kata Sandi</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInitialSetPassword} className="space-y-4 pt-1">
                    {/* Setup New Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="setup-new-password" className="text-xs font-semibold text-foreground">
                        Kata Sandi Baru
                      </label>
                      <div className="relative">
                        <input
                          id="setup-new-password"
                          name="setup-new-password"
                          autoComplete="new-password"
                          type={showSetupPassword ? "text" : "password"}
                          value={setupPassword}
                          onChange={(e) => setSetupPassword(e.target.value)}
                          required
                          placeholder="Minimal 8 karakter"
                          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSetupPassword(!showSetupPassword)}
                          aria-label={showSetupPassword ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"}
                          aria-pressed={showSetupPassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSetupPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Setup Confirm Password */}
                    <div className="space-y-1.5">
                      <label htmlFor="setup-confirm-password" className="text-xs font-semibold text-foreground">
                        Konfirmasi Kata Sandi
                      </label>
                      <div className="relative">
                        <input
                          id="setup-confirm-password"
                          name="setup-confirm-password"
                          autoComplete="new-password"
                          type={showSetupConfirm ? "text" : "password"}
                          value={setupConfirm}
                          onChange={(e) => setSetupConfirm(e.target.value)}
                          required
                          placeholder="Ulangi kata sandi baru"
                          className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSetupConfirm(!showSetupConfirm)}
                          aria-label={showSetupConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                          aria-pressed={showSetupConfirm}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSetupConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {setupConfirm.length > 0 && (
                        <p className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${setupPasswordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                          {setupPasswordsMatch ? (
                            <>
                              <CheckCircle2 className="size-3.5" />
                              <span>Kata sandi cocok</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="size-3.5" />
                              <span>Kata sandi belum cocok</span>
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Criteria Checklist */}
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-700">Kriteria Kata Sandi:</span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {[setupCriteria.hasMinLength, setupCriteria.hasUppercase, setupCriteria.hasLowercase, setupCriteria.hasNumber].filter(Boolean).length}/4 terpenuhi
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                        <div className={`flex items-center gap-1.5 text-[11px] ${setupCriteria.hasMinLength ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                          <CheckCircle2 className={`size-3.5 shrink-0 ${setupCriteria.hasMinLength ? "text-emerald-600" : "text-slate-300"}`} />
                          <span>Minimal 8 karakter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[11px] ${setupCriteria.hasUppercase ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                          <CheckCircle2 className={`size-3.5 shrink-0 ${setupCriteria.hasUppercase ? "text-emerald-600" : "text-slate-300"}`} />
                          <span>Huruf besar (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[11px] ${setupCriteria.hasLowercase ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                          <CheckCircle2 className={`size-3.5 shrink-0 ${setupCriteria.hasLowercase ? "text-emerald-600" : "text-slate-300"}`} />
                          <span>Huruf kecil (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-[11px] ${setupCriteria.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"}`}>
                          <CheckCircle2 className={`size-3.5 shrink-0 ${setupCriteria.hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                          <span>Minimal 1 angka (0-9)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2.5">
                      <Button
                        type="submit"
                        disabled={setupLoading || !setupPassword || !setupAllCriteriaMet || !setupPasswordsMatch}
                        className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold h-10 px-5"
                      >
                        {setupLoading ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          "Atur Kata Sandi"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsSettingInitialPassword(false);
                          setSetupPassword("");
                          setSetupConfirm("");
                        }}
                        disabled={setupLoading}
                        className="rounded-xl text-xs h-10 px-4"
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Card for Accounts where Password IS set */
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Ganti Kata Sandi</CardTitle>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    </div>
                    <CardDescription className="text-xs mt-0.5">
                      Perbarui kata sandi login Anda secara berkala untuk menjaga keamanan akun.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {/* Kata Sandi Saat Ini */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="current-password"
                      className="text-xs font-semibold text-foreground"
                    >
                      Kata Sandi Saat Ini
                    </label>
                    <div className="relative">
                      <input
                        id="current-password"
                        name="current-password"
                        autoComplete="current-password"
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Masukkan kata sandi lama Anda"
                        className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        aria-label={showCurrent ? "Sembunyikan kata sandi saat ini" : "Tampilkan kata sandi saat ini"}
                        aria-pressed={showCurrent}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Kata Sandi Baru */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-password"
                      className="text-xs font-semibold text-foreground"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        name="new-password"
                        autoComplete="new-password"
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Minimal 8 karakter"
                        className={`h-10 w-full rounded-lg border bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:ring-2 ${
                          isSameAsCurrent
                            ? "border-amber-500 text-foreground focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
                            : "border-input focus-visible:border-primary focus-visible:ring-primary/20"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"}
                        aria-pressed={showNew}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Alert jika kata sandi baru sama dengan kata sandi saat ini */}
                    {isSameAsCurrent && (
                      <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50/90 p-2.5 text-xs text-amber-900 transition-all animate-in fade-in"
                      >
                        <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-amber-900">Kata Sandi Baru Tidak Boleh Sama</p>
                          <p className="text-amber-800 text-[11px] mt-0.5">
                            Kata sandi baru tidak boleh sama dengan kata sandi saat ini. Silakan buat kata sandi yang berbeda untuk menjaga keamanan akun Anda.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && !isSameAsCurrent && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Kekuatan Sandi:</span>
                          <span className="font-semibold text-foreground">{strengthLabel}</span>
                        </div>
                        <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full transition-all duration-300 ${
                              strengthScore >= 1 ? strengthColor : "bg-transparent"
                            } ${
                              strengthScore === 1
                                ? "w-1/4"
                                : strengthScore === 2
                                ? "w-2/4"
                                : strengthScore === 3
                                ? "w-3/4"
                                : "w-full"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Konfirmasi Kata Sandi Baru */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm-password"
                      className="text-xs font-semibold text-foreground"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        autoComplete="new-password"
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Ulangi kata sandi baru"
                        className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                        aria-pressed={showConfirm}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checklist Syarat - 5 Kriteria */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs space-y-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-slate-800">
                        Kriteria Kata Sandi:
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          fulfilledCount === 5
                            ? "bg-emerald-100 text-emerald-700 font-semibold"
                            : "bg-slate-200/70 text-slate-600"
                        }`}
                      >
                        {fulfilledCount}/5 terpenuhi
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 pt-0.5">
                      <div
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          hasMinLength
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-4 shrink-0 transition-colors ${
                            hasMinLength ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span>Minimal 8 karakter</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          hasUppercase
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-4 shrink-0 transition-colors ${
                            hasUppercase ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span>Huruf besar (A-Z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          hasLowercase
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-4 shrink-0 transition-colors ${
                            hasLowercase ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span>Huruf kecil (a-z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          hasNumber
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-4 shrink-0 transition-colors ${
                            hasNumber ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span>Minimal 1 angka (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          passwordsMatch
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        <CheckCircle2
                          className={`size-4 shrink-0 transition-colors ${
                            passwordsMatch ? "text-emerald-600" : "text-slate-300"
                          }`}
                        />
                        <span>Kata sandi cocok</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={loading || !newPassword || !passwordsMatch || !allCriteriaMet || isSameAsCurrent}
                      className="w-full sm:w-auto"
                    >
                      {loading ? "Menyimpan..." : "Perbarui Kata Sandi"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info Keamanan */}
        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs bg-slate-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <CardTitle className="text-sm">Tips Keamanan Akun</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                • Jangan gunakan kata sandi yang sama dengan akun media sosial atau email pribadi Anda.
              </p>
              <p>
                • Hindari menyertakan informasi tanggal lahir, nomor HP, atau nama perusahaan dalam kata sandi.
              </p>
              <p>
                • Sesi login Anda dilindungi enkripsi JWT standar industri untuk menjaga data kandidat dan portofolio.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
