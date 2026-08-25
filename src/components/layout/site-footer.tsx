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

  if (isAuthPage) {
    return null;
  }

  const logoHref = visibleUser
    ? visibleUser.role === "candidate"
      ? "/candidate"
      : "/dashboard"
    : "/";

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
        </nav>
      </div>
    </footer>
  );
}
