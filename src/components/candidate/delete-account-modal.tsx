"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  ShieldAlert,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp } from "@/providers/app-provider";

const CONFIRMATION_PHRASE = "HAPUS AKUN SAYA";

type DeleteAccountModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string | null;
};

export function DeleteAccountModal({
  open,
  onOpenChange,
  userEmail,
}: DeleteAccountModalProps) {
  const router = useRouter();
  const { logout, devBypass } = useApp();

  const [confirmationInput, setConfirmationInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState(false);

  const cleanPhrase = confirmationInput.trim();
  const phraseMatches =
    cleanPhrase.toUpperCase() === CONFIRMATION_PHRASE ||
    (userEmail && cleanPhrase.toLowerCase() === userEmail.toLowerCase());

  const canSubmit = phraseMatches && acknowledged && !loading;

  const handleCopyPhrase = () => {
    navigator.clipboard.writeText(CONFIRMATION_PHRASE);
    setCopiedPhrase(true);
    setTimeout(() => setCopiedPhrase(false), 2000);
    toast.success("Frasa konfirmasi disalin ke clipboard.");
  };

  const handleReset = () => {
    setConfirmationInput("");
    setPassword("");
    setAcknowledged(false);
    setLoading(false);
  };

  const handleClose = (nextOpen: boolean) => {
    if (loading) return; // Prevent closing mid-flight
    if (!nextOpen) handleReset();
    onOpenChange(nextOpen);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      // In development bypass or demo mode without real backend
      if (devBypass) {
        await new Promise((res) => setTimeout(res, 1200));
        toast.success("Demo Mode: Akun kandidat berhasil di-reset.");
        await logout();
        router.push("/login?deleted=true");
        return;
      }

      const res = await fetch("/api/candidate/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationPhrase: cleanPhrase,
          password: password || undefined,
          acknowledged: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Gagal memproses penghapusan akun.");
      }

      // Cleanup local browser state
      try {
        localStorage.removeItem("proofylink_candidate_workspace");
        localStorage.removeItem("candidate-onboarding-draft");
        localStorage.removeItem("candidate-cv-storage");
        sessionStorage.clear();
      } catch {
        // ignore
      }

      toast.success(
        data?.message || "Akun dan seluruh data Anda telah berhasil dihapus secara permanen."
      );

      await logout();
      onOpenChange(false);
      router.push("/login?deleted=true");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus akun. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden sm:max-w-xl border-red-200">
        <form onSubmit={handleDeleteAccount}>
          {/* Header with Red Warning Accent */}
          <div className="bg-red-50/80 px-6 pt-6 pb-4 border-b border-red-100">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-xs">
                <ShieldAlert className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-red-950 sm:text-xl">
                  Hapus Akun Kandidat Secara Permanen
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-red-800 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Seluruh profil, berkas dokumen, riwayat
                  lamaran, dan sesi Anda akan dihapus selamanya.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Checklist of Data to be Destroyed */}
            <div className="rounded-xl border border-red-200/80 bg-red-50/30 p-4 space-y-2.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-red-600" />
                Data berikut akan dihapus secara permanen dari server &amp; cloud storage:
              </p>
              <ul className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <UserX className="size-3.5 text-red-500 shrink-0" />
                  <span>Profil kandidat, ringkasan keahlian, pengalaman, dan portofolio</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="size-3.5 text-red-500 shrink-0" />
                  <span>Semua file CV (PDF), sertifikat, dan foto avatar/banner di penyimpanan awan</span>
                </li>
                <li className="flex items-center gap-2">
                  <Trash2 className="size-3.5 text-red-500 shrink-0" />
                  <span>Seluruh riwayat lamaran pekerjaan, undangan assessment, dan hasil tes</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-red-500 shrink-0" />
                  <span>Riwayat pesan percakapan dan seluruh lampiran yang Anda kirim</span>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="size-3.5 text-red-500 shrink-0" />
                  <span>Kredensial login, sesi autentikasi, dan hak akses akun</span>
                </li>
              </ul>
            </div>

            {/* Input 1: Confirmation Phrase */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="delete-confirm-phrase"
                  className="text-xs font-semibold text-foreground"
                >
                  Ketik frasa konfirmasi:{" "}
                  <code className="font-mono text-red-600 font-bold tracking-wider">
                    {CONFIRMATION_PHRASE}
                  </code>
                </label>
                <button
                  type="button"
                  onClick={handleCopyPhrase}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium transition"
                >
                  {copiedPhrase ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedPhrase ? "Tersalin" : "Salin Frasa"}</span>
                </button>
              </div>
              <input
                id="delete-confirm-phrase"
                type="text"
                disabled={loading}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder={`Ketik "${CONFIRMATION_PHRASE}"`}
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20"
              />
              <p className="text-[11px] text-muted-foreground">
                Atau Anda juga dapat mengetikkan email akun Anda (
                <span className="font-semibold text-foreground">{userEmail || "email Anda"}</span>).
              </p>
            </div>

            {/* Input 2: Password Verification */}
            <div className="space-y-1.5">
              <label
                htmlFor="delete-password-verify"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Kata Sandi Saat Ini</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  Verifikasi kepemilikan akun
                </span>
              </label>
              <div className="relative">
                <input
                  id="delete-password-verify"
                  type={showPassword ? "text" : "password"}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi login Anda"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm shadow-xs outline-none transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Acknowledgment */}
            <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={loading}
                className="mt-0.5 size-4 rounded border-input text-red-600 focus:ring-red-500/30 accent-red-600"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                Saya memahami konsekuensi ini dan menyetujui penghapusan akun serta seluruh data
                kandidat saya secara permanen tanpa opsi pemulihan.
              </span>
            </label>
          </div>

          {/* Dialog Footer Actions */}
          <div className="bg-slate-50 px-6 py-4 border-t border-border/80">
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => handleClose(false)}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!canSubmit}
                className="w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menghapus Seluruh Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    <span>Hapus Akun Saya Selamanya</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
