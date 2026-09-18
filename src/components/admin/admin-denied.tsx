import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const ADMIN_CHECK_MIN_MS = 3000;

export async function settleAdminCheck(startedAt: number) {
  const elapsed = Date.now() - startedAt;
  if (elapsed < ADMIN_CHECK_MIN_MS) {
    await new Promise((resolve) => setTimeout(resolve, ADMIN_CHECK_MIN_MS - elapsed));
  }
}

export function AdminPopup({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F9FAFB] px-4 py-10 selection:bg-purple-100 selection:text-purple-900">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(124,58,237,0.08),transparent_100%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

export function AdminChecking() {
  return (
    <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 text-[#7C3AED] shadow-2xs border border-purple-200">
          <Loader2 className="size-7 animate-spin" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
          Memverifikasi Otoritas Admin
        </h2>
        <p className="mt-2 max-w-xs text-xs text-slate-500 leading-relaxed">
          Sistem sedang memvalidasi kredensial dan hak akses sesi sebelum membuka Command Center.
        </p>
      </CardContent>
    </Card>
  );
}

export function AdminDenied({ code }: { code: 401 | 403 }) {
  const loginRequired = code === 401;
  return (
    <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-2xs border border-rose-200">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-5 font-mono text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
          Akses Ditolak · Kode {code}
        </p>
        <h2 className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900">
          {loginRequired ? "Masuk Sebagai Administrator" : "Otoritas Tidak Memadai"}
        </h2>
        <p className="mt-2 max-w-sm text-xs text-slate-500 leading-relaxed">
          {loginRequired
            ? "Portal administrator memerlukan sesi autentikasi resmi dengan hak akses level superadmin. Silakan masuk terlebih dahulu."
            : "Akun Anda saat ini tidak memiliki hak akses administrator untuk melihat atau mengelola data platform ini."}
        </p>
        <div className="mt-6">
          {loginRequired ? (
            <Button asChild size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl px-5 h-9 font-bold shadow-xs">
              <Link href="/login">Masuk ke Akun</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 px-5 h-9 font-semibold">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
