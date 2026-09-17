"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Candidate } from "@/types";

interface QuestionItem {
  id: string;
  category: "technical" | "behavioral" | "culture";
  text: string;
}

const CATEGORY_META = {
  technical: {
    label: "Kompetensi & Teknis",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200",
  },
  behavioral: {
    label: "STAR & Situasional",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-200",
  },
  culture: {
    label: "Budaya & Kolaborasi",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200",
  },
};

export function InterviewQuestionModal({
  open,
  onOpenChange,
  candidate,
  onSaveQuestions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate;
  onSaveQuestions?: (questions: string[]) => void;
}) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newCategory, setNewCategory] = useState<"technical" | "behavioral" | "culture">("technical");
  const [activeTab, setActiveTab] = useState<"all" | "technical" | "behavioral" | "culture">("all");

  const generateQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: candidate.role,
          headline: candidate.role,
          about: candidate.summary,
          skills: candidate.skills,
          location: candidate.location,
        }),
      });

      const payload = (await response.json()) as { questions?: string[]; error?: string };
      if (!response.ok || !payload.questions) {
        throw new Error(payload.error || "Gagal memuat pertanyaan AI.");
      }

      const generated: QuestionItem[] = [
        ...payload.questions.map((text, idx) => ({
          id: `tech-${Date.now()}-${idx}`,
          category: "technical" as const,
          text,
        })),
        {
          id: `star-${Date.now()}-1`,
          category: "behavioral" as const,
          text: `Ceritakan saat Anda menghadapi hambatan waktu atau perubahan spesifikasi mendadak dalam proyek ${candidate.skills[0] || "desain/teknis"}. Bagaimana Anda mengatasinya?`,
        },
        {
          id: `star-${Date.now()}-2`,
          category: "behavioral" as const,
          text: "Bagaimana cara Anda mengukur kesuksesan solusi yang Anda buat setelah dirilis ke pengguna nyata?",
        },
        {
          id: `cult-${Date.now()}-1`,
          category: "culture" as const,
          text: "Bagaimana preferensi Anda dalam berkolaborasi lintas tim (Product, Tech, Business) secara remote/hybrid?",
        },
      ];

      setQuestions(generated);
      toast.success("Daftar pertanyaan wawancara siap!");
    } catch (error) {
      console.error(error);
      // Fallback default
      setQuestions([
        {
          id: "def-1",
          category: "technical",
          text: `Ceritakan pengalaman paling menantang menggunakan ${candidate.skills[0] || "keahlian utama Anda"} untuk memecahkan masalah pengguna.`,
        },
        {
          id: "def-2",
          category: "behavioral",
          text: "Bagaimana cara Anda menyelaraskan prioritas saat ada feedback yang bertolak belakang dari stakeholder?",
        },
        {
          id: "def-3",
          category: "culture",
          text: "Apa nilai kerja yang paling Anda utamakan dalam sebuah tim yang bergerak cepat?",
        },
      ]);
      toast.info("Menggunakan pertanyaan standar terstruktur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && questions.length === 0) {
      const timer = window.setTimeout(() => void generateQuestions(), 0);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addCustomQuestion = () => {
    if (!newQuestionText.trim()) return;
    setQuestions((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        category: newCategory,
        text: newQuestionText.trim(),
      },
    ]);
    setNewQuestionText("");
    toast.success("Pertanyaan kustom ditambahkan.");
  };

  const removeQuestion = (id: string) => {
    setQuestions((current) => current.filter((q) => q.id !== id));
  };

  const copyAllToClipboard = async () => {
    const text = questions
      .map(
        (q, idx) =>
          `${idx + 1}. [${CATEGORY_META[q.category].label}]\n${q.text}`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Semua pertanyaan disalin ke clipboard!");
    } catch {
      toast.error("Gagal menyalin pertanyaan.");
    }
  };

  const handleExportPDF = () => {
    if (questions.length === 0) {
      toast.error("Belum ada pertanyaan untuk diekspor.");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Izinkan pop-up di browser Anda.");
      return;
    }

    const technicalQuestions = questions.filter((q) => q.category === "technical");
    const behavioralQuestions = questions.filter((q) => q.category === "behavioral");
    const cultureQuestions = questions.filter((q) => q.category === "culture");

    const renderCategoryGroup = (title: string, items: typeof questions) => {
      if (items.length === 0) return "";
      return `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-weight: 700; color: #4338ca; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1.5px solid #e0e7ff; padding-bottom: 4px;">
            ${title} (${items.length})
          </h3>
          ${items
            .map(
              (q, idx) => `
            <div style="margin-bottom: 14px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafafa;">
              <div style="font-weight: 600; font-size: 13px; color: #1e293b; margin-bottom: 6px;">
                #${idx + 1}. ${q.text}
              </div>
              <div style="height: 36px; border-bottom: 1px dashed #cbd5e1; margin-top: 10px;"></div>
              <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Catatan Pewawancara / Evaluasi:</div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    };

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Panduan Pertanyaan Wawancara - ${candidate.name}</title>
          <style>
            @page { margin: 15mm; size: A4; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 20px; line-height: 1.5; }
            .header { border-bottom: 2px solid #7c3aed; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 20px; font-weight: 800; color: #1e1b4b; }
            .candidate-info { font-size: 13px; color: #475569; margin-top: 4px; }
            .meta { font-size: 11px; color: #64748b; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Panduan Pertanyaan Wawancara</div>
              <div class="candidate-info">
                Kandidat: <strong>${candidate.name}</strong> · Posisi: <strong>${candidate.role}</strong>
              </div>
            </div>
            <div class="meta">
              Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}<br/>
              Talent Network ATS
            </div>
          </div>
          ${renderCategoryGroup("Kompetensi & Teknis", technicalQuestions)}
          ${renderCategoryGroup("STAR & Situasional", behavioralQuestions)}
          ${renderCategoryGroup("Budaya & Kolaborasi", cultureQuestions)}
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success("Dokumen PDF pertanyaan wawancara siap dicetak / disimpan!");
  };

  const filteredQuestions =
    activeTab === "all"
      ? questions
      : questions.filter((q) => q.category === activeTab);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Persiapan Pertanyaan Wawancara
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                <strong className="text-foreground">{candidate.name}</strong> · {candidate.role}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Filter & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-2 border-b text-xs">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Semua ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("technical")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "technical"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Teknis ({questions.filter((q) => q.category === "technical").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("behavioral")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "behavioral"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              STAR ({questions.filter((q) => q.category === "behavioral").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("culture")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === "culture"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Budaya ({questions.filter((q) => q.category === "culture").length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={loading}
              onClick={() => void generateQuestions()}
            >
              <RefreshCw className={`size-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Regenerasi AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => void copyAllToClipboard()}
              disabled={questions.length === 0}
            >
              <Copy className="size-3 mr-1" />
              Salin Semua
            </Button>
          </div>
        </div>

        {/* Question List View */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground space-y-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-xs">Menyusun pertanyaan wawancara berbasis kompetensi kandidat...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              Belum ada pertanyaan di kategori ini.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="group relative rounded-xl border border-border/80 bg-card p-3.5 hover:border-primary/40 hover:shadow-2xs transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{idx + 1}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${CATEGORY_META[q.category].badgeColor}`}>
                      {CATEGORY_META[q.category].label}
                    </Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1"
                    aria-label="Hapus pertanyaan"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-foreground leading-relaxed">
                  {q.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add custom question form */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="size-3.5 text-primary" /> Tambah Pertanyaan Kustom
          </p>
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as "technical" | "behavioral" | "culture")}
              className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs outline-none focus:border-primary"
            >
              <option value="technical">Teknis</option>
              <option value="behavioral">STAR Behavioral</option>
              <option value="culture">Budaya Kerja</option>
            </select>
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomQuestion();
                }
              }}
              placeholder="Ketik pertanyaan tambahan lalu tekan Enter..."
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
            />
            <Button size="sm" className="h-9 text-xs px-3" onClick={addCustomQuestion} disabled={!newQuestionText.trim()}>
              Tambah
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex sm:justify-end items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button
            size="sm"
            className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium"
            onClick={handleExportPDF}
          >
            <Printer className="size-4 mr-1.5" />
            Simpan sebagai PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
