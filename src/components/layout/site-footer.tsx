"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/providers/app-provider";

export function SiteFooter() {
  const pathname = usePathname();
  const { user, hydrated } = useApp();
  const visibleUser = hydrated ? user : null;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdmin = pathname?.startsWith("/admin");

  if (isAuthPage || isAdmin) {
    return null;
  }

  const logoHref = visibleUser
    ? visibleUser.role === "candidate"
      ? "/candidate"
      : visibleUser.role === "partner"
      ? "/partner"
      : "/recruiter/dashboard"
    : "/";

  const isRecruiter = visibleUser?.role === "recruiter" || pathname?.startsWith("/recruiter");
  const isCandidate = visibleUser?.role === "candidate" || pathname?.startsWith("/candidate");
  const isWorkspace = isRecruiter || isCandidate;

  if (isWorkspace) {
    const helpSubject = isRecruiter
      ? "Bantuan%20Rekruter%20ProofyLink"
      : "Bantuan%20Kandidat%20ProofyLink";

    return (
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-sm font-bold text-foreground transition-opacity hover:opacity-90"
            >
              <ShieldCheck className="size-5 text-[#7C3AED]" /> ProofyLink
            </Link>
            <p className="text-xs text-muted-foreground">© 2026 ProofyLink</p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-7">
            <a
              href={`mailto:support@proofylink.com?subject=${helpSubject}`}
              className="transition-colors hover:text-foreground"
            >
              Bantuan
            </a>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Syarat &amp; Ketentuan
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Kebijakan Privasi
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto flex flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={logoHref} className="flex items-center gap-2 font-bold">
            <ShieldCheck className="size-5 text-[#7C3AED]" /> ProofyLink
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Talent terverifikasi. Koneksi terpercaya.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link href="/search">Cari Talent</Link>
          <Link href="/pricing">Harga & Token</Link>
          <Link href="/jobs">Lowongan</Link>
          <Link href="/messages">Pesan</Link>
          <Link href="/terms">Syarat &amp; Ketentuan</Link>
          <Link href="/privacy">Kebijakan Privasi</Link>
        </nav>
      </div>
    </footer>
  );
}
