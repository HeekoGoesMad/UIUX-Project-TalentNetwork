"use client";

import { Command, Keyboard, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Navigasi Papan Kanban",
    shortcuts: [
      { key: "J / ↓", desc: "Pindah fokus ke kandidat berikutnya" },
      { key: "K / ↑", desc: "Pindah fokus ke kandidat sebelumnya" },
      { key: "Space / Enter", desc: "Buka laci detail (drawer) kandidat" },
      { key: "Esc", desc: "Tutup drawer atau modal aktif" },
    ],
  },
  {
    title: "Aksi Tahap Cepat (Kandidat Terfokus)",
    shortcuts: [
      { key: "1", desc: "Pindahkan ke Screening" },
      { key: "2", desc: "Pindahkan ke Interview" },
      { key: "3", desc: "Pindahkan ke Penawaran (Offer)" },
      { key: "4", desc: "Pindahkan ke Diterima (Hired)" },
      { key: "5", desc: "Tandai Tidak Lolos (Rejected)" },
    ],
  },
  {
    title: "Bantuan & Pintasan Umum",
    shortcuts: [
      { key: "?", desc: "Tampilkan / sembunyikan panduan pintasan ini" },
    ],
  },
];

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center border border-purple-100">
              <Keyboard className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Pintasan Keyboard (Power-User)
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Operasikan alur rekrutmen lebih cepat tanpa perlu melepas keyboard.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </span>
              <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {group.shortcuts.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between px-3.5 py-2 text-xs"
                  >
                    <span className="text-slate-600">{s.desc}</span>
                    <kbd className="font-mono text-[11px] font-semibold bg-white border border-slate-300/80 rounded-md px-2 py-0.5 shadow-2xs text-slate-800 shrink-0">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ATS Guardrails Notice */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldCheck className="size-3.5 text-[#7C3AED]" />
            <span>Proteksi Integritas Status (ATS Guardrails)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Pintasan tahap tunduk pada aturan alur seleksi rekrutmen:
          </p>
          <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
            <li><strong className="text-slate-800">Diterima (Hired):</strong> Terkunci secara administratif (hanya via menu Batalkan Penerimaan HRD).</li>
            <li><strong className="text-slate-800">Talent Pool:</strong> Wajib ditugaskan ke lowongan sebelum tahap Wawancara atau Penawaran.</li>
            <li><strong className="text-slate-800">Tahap Hired:</strong> Hanya dapat diakses dari tahap Penawaran (Offer).</li>
          </ul>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Command className="size-3.5 text-purple-600" />
            <span>Pintasan aktif otomatis saat berada di halaman operasi</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs font-semibold text-[#7C3AED] hover:underline"
          >
            Tutup
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
