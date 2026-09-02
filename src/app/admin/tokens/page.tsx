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
      const res = await fetch("/api/admin/tokens", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      toast.error("Gagal memuat data token.");
    } finally {
      setLoading(false);
    }
  }, []);

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
      const res = await fetch("/api/admin/tokens", {
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

  return (
    <AdminShell title="Pemantauan & Kuota Token Perusahaan">
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-xs rounded-xl h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTokens}
            className="h-10 rounded-xl border-slate-200 px-3 text-xs font-semibold gap-1.5 self-end sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Perbarui
          </Button>
        </div>

        {/* Tabel Kuota Token Sesuai Kolom Spesifikasi Mentor */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Nama Perusahaan</th>
                    <th className="py-3.5 px-4">Paket Langganan</th>
                    <th className="py-3.5 px-4 text-right">Total Dibeli (Lifetime)</th>
                    <th className="py-3.5 px-4 text-right">Sisa Saldo Saat Ini</th>
                    <th className="py-3.5 px-4 text-right">Total Terpakai</th>
                    <th className="py-3.5 px-4 text-right">Untuk Talent Unlock</th>
                    <th className="py-3.5 px-4 text-right">Untuk Screening Finansial</th>
                    <th className="py-3.5 px-4 text-right">Token Kedaluwarsa</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        Memuat data kuota token perusahaan...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        <Coins className="size-8 mx-auto mb-2 text-slate-300" />
                        Tidak ada data perusahaan atau akun token ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((acc) => (
                      <tr key={acc.organizationId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                          {acc.organizationName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200 capitalize text-[10px] font-semibold">
                            {acc.subscriptionTier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {acc.totalPurchased}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-extrabold text-[#7C3AED] text-sm">
                            {acc.currentBalance}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          {acc.totalUsed}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {acc.talentUnlockUsed}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          {acc.financialScreeningUsed}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">
                          {acc.expiredTokens}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustModal(acc)}
                            className="text-xs h-7 px-2.5 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50"
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
          <DialogContent className="max-w-md p-6">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base font-bold text-slate-900">
                Penyesuaian Token: {selectedOrg?.organizationName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Saldo aktif saat ini: <span className="font-bold text-[#7C3AED]">{selectedOrg?.currentBalance ?? 0} Token</span>
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
                      "text-xs h-9 rounded-xl font-semibold",
                      adjustType === "grant" ? "bg-[#7C3AED] text-white" : ""
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
                      "text-xs h-9 rounded-xl font-semibold",
                      adjustType === "refund" ? "bg-rose-600 text-white" : ""
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
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Alasan Penyesuaian (Audit Log):</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Tuliskan alasan penyesuaian kuota token ini..."
                  className="w-full h-20 p-2.5 text-xs rounded-md border border-slate-300 bg-white resize-none"
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex flex-row items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleAdjustToken}
                disabled={adjusting}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs rounded-xl font-semibold px-4"
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
