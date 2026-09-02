"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ScrollText,
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
import { cn } from "@/lib/utils";

interface AuditLogItem {
  log: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  };
  actorEmail: string | null;
  organizationName: string | null;
}

const ACTION_CATEGORIES = [
  { id: "all", label: "Semua Aktivitas" },
  { id: "company", label: "Perusahaan" },
  { id: "verification", label: "Verifikasi" },
  { id: "tokens", label: "Token" },
  { id: "unlock", label: "Talent Unlock" },
  { id: "screening", label: "Financial Screening" },
];

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-log", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      toast.error("Gagal memuat riwayat audit log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    return logs.filter((item) => {
      const action = item.log.action.toLowerCase();
      const matchesCategory =
        categoryFilter === "all" || action.includes(categoryFilter);

      const s = search.toLowerCase();
      const matchesSearch =
        !s ||
        action.includes(s) ||
        (item.actorEmail && item.actorEmail.toLowerCase().includes(s)) ||
        (item.organizationName && item.organizationName.toLowerCase().includes(s)) ||
        item.log.entityType.toLowerCase().includes(s);

      return matchesCategory && matchesSearch;
    });
  }, [logs, categoryFilter, search]);

  const getActionBadge = (action: string) => {
    if (action.includes("approved") || action.includes("active")) {
      return <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200">Approved</Badge>;
    }
    if (action.includes("reject") || action.includes("failed")) {
      return <Badge className="bg-rose-50 text-rose-800 border-rose-200">Rejected</Badge>;
    }
    if (action.includes("token")) {
      return <Badge className="bg-purple-50 text-[#7C3AED] border-purple-200">Token Activity</Badge>;
    }
    if (action.includes("screening")) {
      return <Badge className="bg-cyan-50 text-cyan-800 border-cyan-200">Financial Screening</Badge>;
    }
    if (action.includes("unlock")) {
      return <Badge className="bg-indigo-50 text-indigo-800 border-indigo-200">Talent Unlock</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{action}</Badge>;
  };

  return (
    <AdminShell title="Riwayat Jejak Aktivitas (Audit Logs)">
      <div className="space-y-6">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari aksi, email pelaku, atau nama perusahaan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200 text-xs rounded-xl h-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ACTION_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={categoryFilter === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat.id)}
                className={cn(
                  "text-xs rounded-xl h-8 font-semibold",
                  categoryFilter === cat.id
                    ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {cat.label}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              className="h-8 rounded-xl border-slate-200 px-2.5"
            >
              <RefreshCw className={cn("size-3.5", loading ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <Card className="border border-slate-200/90 bg-white shadow-2xs overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3.5 px-4">Waktu Kejadian</th>
                    <th className="py-3.5 px-4">Nama Perusahaan Terkait</th>
                    <th className="py-3.5 px-4">Pelaku (Actor)</th>
                    <th className="py-3.5 px-4">Tipe Aktivitas &amp; Aksi</th>
                    <th className="py-3.5 px-4">Detail / Entitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-[#7C3AED]" />
                        Memuat riwayat audit log...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <ScrollText className="size-8 mx-auto mb-2 text-slate-300" />
                        Belum ada jejak audit log yang sesuai filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item.log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {new Date(item.log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {item.organizationName || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-semibold">{item.actorEmail || "Sistem"}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getActionBadge(item.log.action)}
                            <span className="font-mono text-[10.5px] text-slate-600">{item.log.action}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10.5px]">
                          {item.log.entityType}
                          {item.log.entityId ? ` (${item.log.entityId.slice(0, 8)}...)` : ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
