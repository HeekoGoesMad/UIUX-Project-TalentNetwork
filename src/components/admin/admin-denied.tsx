import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminDenied({ reason }: { reason: "unauthenticated" | "forbidden" }) {
  const loginRequired = reason === "unauthenticated";
  return (
    <Card className="border border-slate-200/80 bg-white shadow-xs">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-[#7C3AED]">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold tracking-tight text-slate-900">
          {loginRequired ? "Masuk sebagai admin untuk melanjutkan" : "Akses ditolak"}
        </h2>
        <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
          {loginRequired
            ? "Portal admin hanya dapat diakses dengan akun yang memiliki peran admin. Masuk terlebih dahulu untuk melihat halaman ini."
            : "Akun Anda tidak memiliki peran admin sehingga halaman ini tidak dapat ditampilkan."}
        </p>
        <div className="mt-5">
          {loginRequired ? (
            <Button asChild size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl">
              <Link href="/login">Masuk</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
