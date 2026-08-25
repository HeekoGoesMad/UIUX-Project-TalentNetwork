import { AlertCircle, AlertTriangle, Check, Cpu, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiSummary } from "@/types";

interface AiSummaryCardProps {
  data?: AiSummary | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  className?: string;
  // Legacy string fallback for backward compatibility
  children?: React.ReactNode;
}

export function AiSummaryCard({
  data,
  loading = false,
  error = null,
  onRegenerate,
  className,
  children,
}: AiSummaryCardProps) {
  const source = data?.source ?? "local";
  const modelVersion = data?.modelVersion ?? "llama3.2";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#201C45] via-[#2A2359] to-[#3B3175] p-6 text-white shadow-lg border border-purple-900/40",
        className,
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles className="size-5 text-[#DDD6FE] animate-pulse" />
            AI Summary
          </div>
          <Badge className="bg-purple-500/20 text-[#DDD6FE] border-purple-400/30 text-xs">
            AI draft
          </Badge>

          {/* Provider Badge */}
          {source === "local" ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono">
              <Cpu className="mr-1 size-3" /> Local AI ({modelVersion})
            </Badge>
          ) : source === "azure" ? (
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-xs font-mono">
              ☁️ Azure OpenAI ({modelVersion})
            </Badge>
          ) : (
            <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/40 text-xs font-mono">
              ⚡ Demo Mock ({modelVersion})
            </Badge>
          )}
        </div>

        {onRegenerate && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={onRegenerate}
            className="h-8 px-3 text-xs text-[#DDD6FE] hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={cn("mr-1.5 size-3.5", loading && "animate-spin")} />
            {loading ? "Memproses..." : "Regenerasi AI"}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 text-center" role="status">
          <Loader2 className="size-8 animate-spin text-[#DDD6FE]" />
          <p className="mt-3 text-sm font-medium text-slate-200">
            Sedang menghasilkan AI Summary dengan Local AI ({modelVersion})...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Memproses data profil untuk menganalisis keahlian &amp; rekam jejak.
          </p>
        </div>
      )}

      {/* Error state with Local AI Server guide */}
      {!loading && error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-4.5 text-red-200 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-400" />
            <div>
              <p className="font-bold text-red-100">Gagal terhubung ke Local AI Server</p>
              <p className="mt-1 text-xs leading-relaxed text-red-200/90">{error}</p>
            </div>
          </div>

          {/* Quick instructions box */}
          <div className="rounded-lg bg-black/40 p-3 text-xs font-mono space-y-1.5 text-slate-300 border border-white/5">
            <p className="font-semibold text-amber-300 font-sans">💡 Petunjuk Jalankan Local AI Server:</p>
            <p>1. Buka Terminal / PowerShell di komputermu.</p>
            <p>
              2. Jalankan command:{" "}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-400 font-bold">
                ollama run {modelVersion}
              </code>
            </p>
            <p>3. Setelah model siap di port 11434, tekan tombol &quot;Coba Lagi&quot;.</p>
          </div>

          {onRegenerate && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onRegenerate}
              className="mt-1 bg-red-800/80 text-white hover:bg-red-700 border border-red-600/50"
            >
              <RefreshCw className="mr-1.5 size-3.5" /> Coba Lagi
            </Button>
          )}
        </div>
      )}

      {/* Content state */}
      {!loading && !error && (
        <div className="mt-4 space-y-4">
          {data ? (
            <>
              {/* Summary narrative */}
              <p className="text-sm leading-7 text-slate-100">{data.summary}</p>

              {/* Strengths & Evidence grid */}
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                {data.strengths && data.strengths.length > 0 && (
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#DDD6FE]">
                      Kekuatan Utama
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {data.strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.evidence && data.evidence.length > 0 && (
                  <div className="rounded-xl bg-white/5 p-3.5 border border-white/10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#DDD6FE]">
                      Bukti Pendukung Profil
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {data.evidence.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-purple-300" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Limitations / Transparency note */}
              {data.limitations && data.limitations.length > 0 && (
                <div className="flex items-start gap-2 border-t border-white/10 pt-3 text-[11px] text-slate-300">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-400" />
                  <span>
                    Limitasi: {data.limitations.join(" • ")}
                  </span>
                </div>
              )}
            </>
          ) : children ? (
            <p className="text-sm leading-6 text-slate-200">{children}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
