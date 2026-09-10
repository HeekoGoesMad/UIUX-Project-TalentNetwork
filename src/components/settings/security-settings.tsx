"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/providers/app-provider";

export function SecuritySettings() {
  const { user, devBypass } = useApp();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  // Criteria checks
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const hasUppercaseOrSpecial = /[A-Z!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  const strengthScore = [hasMinLength, hasNumber, hasUppercaseOrSpecial].filter(Boolean).length;
  const strengthColor =
    strengthScore === 3
      ? "bg-emerald-500"
      : strengthScore === 2
      ? "bg-amber-500"
      : "bg-red-500";
  const strengthLabel =
    strengthScore === 3 ? "Kuat" : strengthScore === 2 ? "Sedang" : "Lemah";

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword.trim()) {
      toast.error("Silakan masukkan kata sandi saat ini.");
      return;
    }

    if (!hasMinLength) {
      toast.error("Kata sandi baru minimal harus terdiri dari 8 karakter.");
      return;
    }

    if (!hasNumber) {
      toast.error("Kata sandi baru harus mengandung setidaknya satu angka.");
      return;
    }

    if (!hasUppercaseOrSpecial) {
      toast.error("Kata sandi baru harus mengandung huruf kapital atau simbol.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      // If dev bypass or demo account
      if (devBypass || !user) {
        // Simulate delay
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
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Ganti Kata Sandi</CardTitle>
                  <CardDescription className="text-xs">
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
                      className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
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

                  {/* Password Strength Indicator */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Kekuatan Sandi:</span>
                        <span className="font-semibold text-foreground">{strengthLabel}</span>
                      </div>
                      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strengthScore >= 1 ? strengthColor : "bg-transparent"
                          } ${strengthScore === 1 ? "w-1/3" : strengthScore === 2 ? "w-2/3" : "w-full"}`}
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

                {/* Checklist Syarat */}
                <div className="rounded-lg border bg-slate-50/70 p-3 text-xs space-y-1.5">
                  <p className="font-semibold text-foreground">Persyaratan Kata Sandi:</p>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {hasMinLength ? (
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="size-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Minimal 8 karakter</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasNumber ? (
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="size-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Mengandung angka (0-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasUppercaseOrSpecial ? (
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="size-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Huruf kapital atau simbol</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordsMatch ? (
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="size-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>Kata sandi cocok</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !newPassword || !passwordsMatch}
                    className="w-full sm:w-auto"
                  >
                    {loading ? "Menyimpan..." : "Perbarui Kata Sandi"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
