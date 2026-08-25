import Link from "next/link";

export function SessionError() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
      <div className="max-w-sm rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-base font-bold text-slate-900">Sesi tidak dapat diverifikasi</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Terjadi gangguan saat memeriksa sesi Anda. Coba muat ulang halaman, atau keluar dan masuk kembali.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-[#7C3AED] px-4 text-xs font-semibold text-white hover:bg-[#6D28D9]"
        >
          Ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
}
