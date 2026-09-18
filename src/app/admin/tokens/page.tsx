"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Coins,
  Search,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminChecking, AdminDenied, AdminPopup } from "@/components/admin/admin-denied";
import { useAdminGate } from "@/components/admin/admin-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TokenAccountItem {
  organizationId: string;
  organizationName: string;
  subscriptionTier: string;
  totalPurchased: number;
  currentBalance: number;
  totalUsed: number;
  talentUnlockUsed: number;
  financialScreeningUsed: number;
  expiredTokens: number;
}

export default function AdminTokensPage() {
  const [accounts, setAccounts] = useState<TokenAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { phase: gatePhase, code: gateCode, fail: failGate } = useAdminGate();
  const [search, setSearch] = useState("");

  // Grant / Adjust Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<TokenAccountItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(50);
  const [adjustType, setAdjustType] = useState<"grant" | "refund">("grant");
  const [adjustReason, setAdjustReason] = useState("Bonus onboarding & kuota verifikasi perusahaan");
  const [adjusting, setAdjusting] = useState(false);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(new URL("/api/admin/tokens", window.location.origin), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      } else if (res.status === 401) {
        failGate(401);
      } else if (res.status === 403) {
        failGate(403);
      }
    } catch {
      toast.error("Gagal memuat data token.");
    } finally {
      setLoading(false);
    }
  }, [failGate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTokens();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTokens]);

  const openAdjustModal = (acc: TokenAccountItem) => {
    setSelectedOrg(acc);
    setAdjustAmount(50);
    setAdjustType("grant");
    setAdjustReason("Penyesuaian kuota token oleh administrator");
    setAdjustModalOpen(true);
  };

  const handleAdjustToken = async () => {
    if (!selectedOrg) return;
    if (adjustAmount <= 0) {
      toast.warning("Jumlah token harus lebih besar dari 0.");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch(new URL("/api/admin/tokens", window.location.origin), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: selectedOrg.organizationId,
          amount: adjustAmount,
          type: adjustType,
          reason: adjustReason,
          idempotencyKey: `adj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyesuaikan token.");
      }

      toast.success(
        `Berhasil ${adjustType === "grant" ? "menambahkan" : "mengurangi"} ${adjustAmount} token untuk ${selectedOrg.organizationName}!`
      );
      setAdjustModalOpen(false);
      fetchTokens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses penyesuaian token.";
      toast.error(msg);
    } finally {
      setAdjusting(false);
    }
  };

  const filtered = useMemo(() => {
    return accounts.filter((acc) => {
      const s = search.toLowerCase();
      return !s || acc.organizationName.toLowerCase().includes(s) || acc.subscriptionTier.toLowerCase().includes(s);
    });
  }, [accounts, search]);

  const totalBeredar = useMemo(() => accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0), [accounts]);
  const totalDibeli = useMemo(() => accounts.reduce((sum, a) => sum + (a.totalPurchased || 0), 0), [accounts]);
  const totalKonsumsi = useMemo(() => accounts.reduce((sum, a) => sum + (a.totalUsed || 0), 0), [accounts]);

  if (gatePhase === "checking") {
    return (
      <AdminPopup>
        <AdminChecking />
      </AdminPopup>
    );
  }

  if (gatePhase === "denied") {
    return (
      <AdminPopup>
        <AdminDenied code={gateCode ?? 403} />
      </AdminPopup>
    );
  }

  return (
    <AdminShell title="Pemantauan & Kuota Token Perusahaan">
      <div className="space-y-6">
        {/* Top Summary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Token Beredar (Aktif)
            </p>
            <p className="text-3xl font-extrabold text-[#7C3AED] mt-2 font-mono tracking-tight">
              {totalBeredar.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Saldo aktif siap pakai seluruh perusahaan</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Pembelian (Lifetime)
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
              {totalDibeli.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Akumulasi kuota paket yang diterbitkan</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Penggunaan Fitur
            </p>
            <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight">
              {totalKonsumsi.toLocaleString("id-ID")}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Unlock kontak profil &amp; screening selesai</p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama perusahaan atau paket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-xs rounded-xl h-10 shadow-2xs"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTokens}
            className="h-10 rounded-xl border-slate-200 px-3.5 text-xs font-bold gap-2 self-end sm:self-auto bg-white hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-2xs transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className={cn("size-3.5", loading ? "animate-spin" : "")} />
            Perbarui Data
          </Button>
        </div>

        {/* Tabel Kuota Token */}
        <Card className="border border-slate-200/90 bg-white shadow-xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Nama Perusahaan</th>
                    <th className="py-3.5 px-4">Paket Langganan</th>
                    <th className="py-3.5 px-4 text-right">Total Dibeli</th>
                    <th className="py-3.5 px-4 text-right">Sisa Saldo</th>
                    <th className="py-3.5 px-4 text-right">Total Digunakan</th>
                    <th className="py-3.5 px-4 text-right">Talent Unlock</th>
                    <th className="py-3.5 px-4 text-right">Screening Finansial</th>
                    <th className="py-3.5 px-4 text-right">Kedaluwarsa</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center text-muted-foreground">
                        <Loader2 className="size-7 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        <span className="font-medium text-xs">Memuat data kuota token perusahaan...</span>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center text-muted-foreground">
                        <Coins className="size-9 mx-auto mb-2 text-slate-300" />
                        <span className="font-medium text-xs">Tidak ada data perusahaan atau akun token ditemukan.</span>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((acc) => (
                      <tr key={acc.organizationId} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                          {acc.organizationName}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 capitalize text-[10px] font-bold">
                            {acc.subscriptionTier}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-700 font-mono">
                          {acc.totalPurchased}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          <span className="font-extrabold text-[#7C3AED] text-sm">
                            {acc.currentBalance}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                          {acc.totalUsed}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                          {acc.talentUnlockUsed}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                          {acc.financialScreeningUsed}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                          {acc.expiredTokens}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustModal(acc)}
                            className="border-purple-200 text-[#7C3AED] hover:bg-purple-50 hover:border-purple-300 text-xs font-semibold h-8 px-3 rounded-xl shadow-2xs cursor-pointer transition-all hover:-translate-y-0.5"
                          >
                            Sesuaikan
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Grant / Adjust Token */}
        <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader className="border-b border-slate-100 pb-3.5">
              <DialogTitle className="text-base font-bold text-slate-900">
                Penyesuaian Kuota Token
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Perusahaan: <span className="font-semibold text-slate-900">{selectedOrg?.organizationName}</span> · Saldo aktif saat ini:{" "}
                <span className="font-bold text-[#7C3AED]">{selectedOrg?.currentBalance ?? 0} Token</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">Tipe Operasi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={adjustType === "grant" ? "default" : "outline"}
                    onClick={() => setAdjustType("grant")}
                    className={cn(
                      "text-xs h-9 rounded-xl font-semibold transition-all cursor-pointer",
                      adjustType === "grant"
                        ? "bg-purple-50 text-[#7C3AED] border border-purple-300 shadow-2xs font-bold"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Tambah Token (Grant)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={adjustType === "refund" ? "default" : "outline"}
                    onClick={() => setAdjustType("refund")}
                    className={cn(
                      "text-xs h-9 rounded-xl font-semibold transition-all cursor-pointer",
                      adjustType === "refund"
                        ? "bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs font-bold"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    Kurangi Token (Deduct)
                  </Button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Jumlah Token:</label>
                <Input
                  type="number"
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9 text-xs rounded-xl border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan Penyesuaian (Audit Log):</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Tuliskan alasan penyesuaian kuota token ini..."
                  className="w-full h-20 p-2.5 text-xs rounded-xl border border-slate-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalOpen(false)}
                className="text-xs rounded-xl h-9 border-slate-200"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleAdjustToken}
                disabled={adjusting}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4 h-9 shadow-xs hover:-translate-y-0.5 transition-all"
              >
                {adjusting ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                Konfirmasi Penyesuaian
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminShell>
  );
}
