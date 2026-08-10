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
            <ShieldCheck className="size-5 text-[#19a974]" /> ProofyLink
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified talent. Trusted connections.
          </p>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm text-muted-foreground">
          <Link href="/search">Search talent</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/messages">Messages</Link>
        </nav>
      </div>
    </footer>
  );
}
