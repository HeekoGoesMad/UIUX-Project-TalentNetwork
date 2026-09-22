"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

  const currentYear = new Date().getFullYear();
  const djoinLogoUrl = "https://cms.solusisakti.id/assets/1b874983-6a51-42f6-873a-e504cd42e934";

  if (isWorkspace) {
    const helpSubject = isRecruiter
      ? "Bantuan%20Rekruter%20Talent%20Network"
      : "Bantuan%20Kandidat%20Talent%20Network";

    return (
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <Link
              href={logoHref}
              className="font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
            >
              <span className="text-base font-bold whitespace-nowrap text-foreground">
                Talent<span className="text-primary"> Network</span>
              </span>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <span>© {currentYear} Talent Network by</span>
              <Image
                src={djoinLogoUrl}
                alt="Djoin"
                width={64}
                height={18}
                className="h-4 w-auto object-contain inline-block"
              />
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5 sm:gap-7">
            <a
              href={`mailto:support@djoin.id?subject=${helpSubject}`}
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
    <footer className="border-t border-slate-200/80 bg-white">
      <div className="container mx-auto flex flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Link
            href={logoHref}
            className="font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <span className="text-base font-bold whitespace-nowrap text-foreground">
              Talent<span className="text-primary"> Network</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <span>© {currentYear} Talent Network by</span>
            <Image
              src={djoinLogoUrl}
              alt="Djoin"
              width={64}
              height={18}
              className="h-4 w-auto object-contain inline-block"
            />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link href="/search" className="transition-colors hover:text-foreground">Cari Talent</Link>
          <Link href="/pricing" className="transition-colors hover:text-foreground">Harga &amp; Token</Link>
          <Link href="/jobs" className="transition-colors hover:text-foreground">Lowongan</Link>
          <Link href="/messages" className="transition-colors hover:text-foreground">Pesan</Link>
          <Link href="/terms" className="transition-colors hover:text-foreground">Syarat &amp; Ketentuan</Link>
          <Link href="/privacy" className="transition-colors hover:text-foreground">Kebijakan Privasi</Link>
        </nav>
      </div>
    </footer>
  );
}
