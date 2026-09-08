"use client";

import { useState } from "react";
import { Brain, Check, ExternalLink, Sparkles, Trash2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/providers/app-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PERSONALITY_TYPES,
  OFFICIAL_16PERSONALITIES_URL,
  getPersonalityConfig,
} from "@/config/personality";
import type { CandidatePersonality } from "@/types";
import { cn } from "@/lib/utils";

export function PersonalityAdvisorCard() {
  const { cvProfile, saveCvProfile } = useApp();
  const existing = cvProfile?.personality;

  const [selectedType, setSelectedType] = useState<string>(existing?.type ?? "");
  const [testUrl, setTestUrl] = useState<string>(existing?.testUrl ?? "");
  const [prevExisting, setPrevExisting] = useState(existing);
  const [saving, setSaving] = useState(false);

  if (existing !== prevExisting) {
    setPrevExisting(existing);
    setSelectedType(existing?.type ?? "");
    setTestUrl(existing?.testUrl ?? "");
  }

  const selectedConfig = getPersonalityConfig(selectedType);

  const handleSave = async () => {
    if (!cvProfile) {
      toast.error("Profil CV Anda belum siap.");
      return;
    }

    if (!selectedType) {
      toast.info("Silakan pilih salah satu tipe kepribadian.");
      return;
    }

    const cfg = getPersonalityConfig(selectedType);
    if (!cfg) return;

    setSaving(true);
    try {
      const personality: CandidatePersonality = {
        type: cfg.type,
        label: cfg.name,
        tagline: cfg.tagline,
        summary: cfg.tagline,
        testUrl: testUrl.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      await saveCvProfile({
        ...cvProfile,
        personality,
      });

      toast.success("Tipe kepribadian berhasil disimpan ke profil Anda!", {
        description: `Tipe ${cfg.type} · ${cfg.name} kini terlihat pada preview card & profil talent rekruter.`,
      });
    } catch {
      toast.error("Gagal menyimpan tipe kepribadian.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!cvProfile) return;
    setSaving(true);
    try {
      await saveCvProfile({
        ...cvProfile,
        personality: undefined,
      });
      setSelectedType("");
      setTestUrl("");
      toast.success("Tipe kepribadian dihapus dari profil.");
    } catch {
      toast.error("Gagal menghapus tipe kepribadian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-slate-200/90 bg-white shadow-2xs rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Brain className="size-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Tes Kepribadian (16Personalities)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pilih tipe kepribadianmu untuk melengkapi profil dan menarik perhatian rekruter.
              </CardDescription>
            </div>
          </div>

          {existing?.type && (
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-2.5 py-1 text-xs">
              Aktif: {existing.type} · {existing.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Banner: Belum Pernah Tes? */}
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50/80 p-4 sm:p-4.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
            <div className="space-y-1">
              <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <HelpCircle className="size-3.5 text-indigo-600" />
                Belum tahu tipe kepribadianmu?
              </p>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Ikuti tes gratis selama ~10-12 menit di situs resmi 16Personalities. Setelah selesai dan mendapatkan tipe 4 huruf (cth: ENFJ, INTJ), kembali ke sini untuk menyimpannya.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-9 px-4 shrink-0 gap-1.5 shadow-xs"
            >
              <a
                href={OFFICIAL_16PERSONALITIES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ikuti Tes di 16Personalities ↗
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Form: Sudah Pernah Tes (Self-Reported) */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              Pilih Tipe Kepribadian (16 Tipe MBTI)
            </label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Tipe Kepribadian --</option>
                <optgroup label="Kelompok Analis (Ungu)">
                  {PERSONALITY_TYPES.filter((p) => p.category === "analyst").map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.type} - {p.name} ({p.tagline})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelompok Diplomat (Hijau)">
                  {PERSONALITY_TYPES.filter((p) => p.category === "diplomat").map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.type} - {p.name} ({p.tagline})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelompok Pengawal (Biru)">
                  {PERSONALITY_TYPES.filter((p) => p.category === "sentinel").map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.type} - {p.name} ({p.tagline})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelompok Penjelajah (Kuning)">
                  {PERSONALITY_TYPES.filter((p) => p.category === "explorer").map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.type} - {p.name} ({p.tagline})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick Selection Grid for 16 Types */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-2">
              Atau klik langsung pada salah satu tipe di bawah ini:
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {PERSONALITY_TYPES.map((p) => {
                const isSelected = selectedType === p.type;
                return (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => setSelectedType(p.type)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/90 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="text-xs font-mono font-extrabold">{p.type}</span>
                    <span className="text-[10px] text-slate-500 truncate max-w-full mt-0.5">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Preview Box */}
          {selectedConfig && (
            <div className={cn("rounded-xl border p-3.5 flex items-start gap-3", selectedConfig.badgeClass)}>
              <Sparkles className="size-4 shrink-0 mt-0.5 text-current" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs">{selectedConfig.type}</span>
                  <span className="text-xs font-semibold">· {selectedConfig.name}</span>
                  <span className="text-[10px] opacity-75">({selectedConfig.categoryLabel})</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {selectedConfig.tagline}
                </p>
              </div>
            </div>
          )}

          {/* Optional Test URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 mb-1.5">
              Tautan Hasil Tes 16Personalities (Opsional)
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Contoh: https://www.16personalities.com/profiles/abc123xyz"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Jika diisi, rekruter dapat memverifikasi hasil tes kepribadian Anda secara langsung.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
            {existing?.type ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={saving}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl h-9 px-3 gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Hapus dari Profil
              </Button>
            ) : (
              <div />
            )}

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !selectedType}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl h-9 px-5 gap-1.5 shadow-xs"
            >
              <Check className="size-3.5" />
              {saving ? "Menyimpan..." : "Simpan ke Profil"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
