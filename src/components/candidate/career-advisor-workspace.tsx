"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import {
    AlertTriangle,
    BarChart3,
    Bot,
    CheckCircle2,
    Compass,
    Copy,
    Download,
    FileText,
    FolderOpen,
    Lightbulb,
    Mic,
    Search,
    SlidersHorizontal,
    Sparkles,
    Star,
    Target,
    Trophy,
    Users,
    Wrench,
    Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { checkSkillsQuality } from "@/lib/ai/skills-check";
import { cn } from "@/lib/utils";

export type FocusType = "cv_review" | "gap_analysis" | "career_consultation" | "career_roadmap" | "ats" | "headline" | "star";

interface SectionAudit {
  section: string;
  status: "good" | "needs_improvement";
  notes: string[];
  recommendation: string;
}

interface FormatCheck {
  check: string;
  passed: boolean;
  tip: string;
}

interface CvReviewDetails {
  readinessLevel: string;
  overallScore: number;
  executiveSummary: string;
  sectionAudits: SectionAudit[];
  formatChecks: FormatCheck[];
  priorityActionItems: string[];
}

interface CoreCompetency {
  competency: string;
  candidateLevel: string;
  requiredLevel: string;
  status: "match" | "gap" | "exceeds";
  recommendation?: string;
}

interface GapAnalysisDetails {
  targetRole: string;
  matchScore: number;
  matchLevel: string;
  coreCompetencies: CoreCompetency[];
  criticalGaps: string[];
  transferableStrengths: string[];
  strategicRecommendations: string[];
}

interface CareerPhase {
  phaseNumber: number;
  phaseName: string;
  timeframe: string;
  outcome: string;
  keyActions: string[];
  milestone: string;
}

interface CareerConsultationDetails {
  targetRole: string;
  targetTimeline: string;
  targetLevel: string;
  phases: CareerPhase[];
  recommendedCertifications: string[];
  strategicAdvice: string[];
  interviewPitchTips?: string[];
}

interface StructuredAdvice {
  opening: string;
  whatGood: string[];
  whatNotGood: string[];
  conclusion: string;
}

interface AdvisorResult {
  focus: FocusType;
  summary: string;
  structuredAdvice?: StructuredAdvice;
  cvReviewDetails?: CvReviewDetails;
  gapAnalysisDetails?: GapAnalysisDetails;
  careerConsultationDetails?: CareerConsultationDetails;
  careerRoadmapDetails?: CareerConsultationDetails;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure" | "local";
}

const focusPresets: { id: FocusType; label: string; icon: typeof FileText; desc: string; badge: string }[] = [
  {
    id: "cv_review",
    label: "Review CV Keseluruhan",
    icon: FileText,
    desc: "Evaluasi menyeluruh susunan CV, ringkasan profil, relevansi pengalaman, dan kemudahan dibaca perekrut.",
    badge: "Pilar 1",
  },
  {
    id: "gap_analysis",
    label: "Gap Analysis Karir",
    icon: Target,
    desc: "Cek karir hari ini: Analisis kesenjangan skill & kompetensi saat ini terhadap ekspektasi peran impian.",
    badge: "Pilar 2",
  },
  {
    id: "career_consultation",
    label: "Career Consultation",
    icon: Compass,
    desc: "Rencana karir kedepan: Konsultasi tahapan strategis, pembuktian portofolio (proof of work), dan tips wawancara HRD.",
    badge: "Pilar 3",
  },
];

export function CareerAdvisorWorkspace({ initialFocus = "cv_review" }: { initialFocus?: FocusType } = {}) {
  const { cvProfile, saveCvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>(initialFocus);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const about = cvProfile?.about || "Product designer yang fokus pada user research dan perancangan antarmuka digital.";
  const defaultTargetRole = cvProfile?.targetRole || "Product Designer";
  const skills = useMemo(() => cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma", "User Journey Mapping"], [cvProfile?.skills]);

  const [customRoleInput, setCustomRoleInput] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const [appliedToCv, setAppliedToCv] = useState(false);
  // Quick prompt chip selection — keyset, auto-reset saat ganti pilar
  const [selectedQuickPrompts, setSelectedQuickPrompts] = useState<Set<string>>(new Set());

  // Sync initialFocus when prop changes
  const [prevInitialFocus, setPrevInitialFocus] = useState(initialFocus);
  if (initialFocus !== prevInitialFocus) {
    setPrevInitialFocus(initialFocus);
    setSelectedFocus(initialFocus);
  }

  const handleApplyToCv = () => {
    if (!cvProfile) {
      toast.error("Profil CV belum tersedia untuk disinkronkan.");
      return;
    }

    // Collect new recommended skills or actions
    const newSkills = new Set(cvProfile.skills || []);
    if (result?.gapAnalysisDetails?.coreCompetencies) {
      result.gapAnalysisDetails.coreCompetencies.forEach((c) => {
        if (c.status === "match" || c.status === "exceeds") {
          newSkills.add(c.competency);
        }
      });
    }

    const updatedProfile = {
      ...cvProfile,
      skills: Array.from(newSkills),
      updatedAt: new Date().toISOString(),
    };

    saveCvProfile(updatedProfile);
    setAppliedToCv(true);
    toast.success("Rekomendasi AI berhasil diterapkan ke draf CV Anda!", {
      description: "Buka halaman CV & Profil untuk meninjau pratinjau ATS terbaru.",
    });
  };

  const activeTargetRole = (customRoleInput !== null ? customRoleInput.trim() : "") || defaultTargetRole;

  const skillCheck = useMemo(() => checkSkillsQuality(skills, activeTargetRole), [skills, activeTargetRole]);

  const quickPromptsByFocus: Record<string, { text: string; icon: typeof FileText }[]> = {
    cv_review: [
      { text: "Perjelas bukti hasil kerja nyata (angka % dan efisiensi waktu)", icon: BarChart3 },
      { text: "Optimalkan kata kunci agar mudah dipindai HRD", icon: Search },
      { text: "Tandai kalimat bertele-tele pada deskripsi pengalaman", icon: FileText },
      { text: "Perkuat ringkasan profesional (About Me)", icon: Lightbulb },
    ],
    gap_analysis: [
      { text: "Analisis keselarasan skill untuk target posisi ini", icon: Target },
      { text: "Keahlian apa yang wajib saya tambahkan di profil?", icon: Zap },
      { text: "Bagaimana menonjolkan transferable skills yang saya miliki?", icon: Star },
      { text: "Cek relevansi tools dan teknologi industri terkini", icon: Wrench },
    ],
    career_consultation: [
      { text: "Bagaimana cara meyakinkan HRD jika saya transisi karir?", icon: Users },
      { text: "Studi kasus portofolio apa yang paling cepat dilirik perekrut?", icon: FolderOpen },
      { text: "Bagaimana cara pitching pencapaian saat wawancara kerja?", icon: Mic },
      { text: "Kriteria utama apa yang dicari HRD untuk level berikutnya?", icon: Trophy },
    ],
  };

  const currentQuickPrompts = quickPromptsByFocus[selectedFocus] || quickPromptsByFocus.cv_review;

  // Ganti pilar: reset quick prompts yang dipilih & hasil analisis sebelumnya
  function handleFocusChange(newFocus: FocusType) {
    setSelectedFocus(newFocus);
    setSelectedQuickPrompts(new Set());
    setResult(null);
  }

  function toggleQuickPrompt(promptText: string) {
    setSelectedQuickPrompts((prev) => {
      const next = new Set(prev);
      if (next.has(promptText)) {
        next.delete(promptText);
      } else {
        next.add(promptText);
      }
      return next;
    });
  }

  useEffect(() => {
    if (isStreaming && result) {
      const interval = setInterval(() => {
        setStreamProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsStreaming(false);
            return 100;
          }
          return prev + 5;
        });
      }, 35);

      return () => clearInterval(interval);
    }
  }, [isStreaming, result]);

  async function runAdvisor() {
    setLoading(true);
    setIsStreaming(false);
    setResult(null);
    // Gabungkan quick prompts terpilih + catatan manual jadi satu instruksi kontekstual
    const quickPromptsNote = selectedQuickPrompts.size > 0
      ? `Fokus analisis khusus pada aspek berikut: ${[...selectedQuickPrompts].join("; ")}.`
      : "";
    const combinedInstruction = [quickPromptsNote, customInstruction.trim()].filter(Boolean).join(" ");
    try {
      const response = await fetch("/api/ai/career-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: selectedFocus,
          headline,
          about,
          targetRole: activeTargetRole,
          skills,
          location: cvProfile?.location || "Jakarta",
          customInstruction: combinedInstruction,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Gagal mengambil rekomendasi karier.");
      }

      setStreamProgress(0);
      setResult(data as AdvisorResult);
      setIsStreaming(true);
      toast.success("Analisis rekomendasi karier berhasil dihasilkan!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPdf() {
    window.print();
  }

  function handleCopyAdvice() {
    if (!result) return;
    const focusLabel = focusPresets.find((p) => p.id === selectedFocus)?.label || selectedFocus.replaceAll("_", " ");
    const textToCopy = `ProofyLink Career Advisor - ${focusLabel}\nTarget peran: ${activeTargetRole}\n\nRingkasan:\n${result.summary}\n\nSaran utama:\n- Hal baik: ${adviceData.whatGood.join("; ")}\n- Perlu penguatan: ${adviceData.whatNotGood.join("; ")}\n\nLangkah selanjutnya:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Rangkuman rekomendasi AI berhasil disalin ke clipboard!");
  }

  // Fallback data for CV Review
  const cvReviewData: CvReviewDetails = result?.cvReviewDetails || {
    readinessLevel: skillCheck.isPlausible
      ? (skills.length >= 6 ? "Sangat siap dan mudah dipindai" : "Cukup siap (perlu pengayaan)")
      : "Perlu penyesuaian keahlian",
    overallScore: skillCheck.isPlausible
      ? Math.min(95, 72 + skills.length * 4)
      : 48,
    executiveSummary: skillCheck.isPlausible
      ? `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Struktur informasi dan riwayat pengalaman kerja sudah rapi serta mudah dibaca oleh perekrut. Rekomendasi utama adalah melengkapi bukti hasil kerja nyata dan memperjelas keahlian unggulanmu.`
      : `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Susunan dasar CV sudah rapi, namun keahlian yang tercantum saat ini (${skills.join(", ") || "belum lengkap"}) belum sesuai dengan kebutuhan posisi ${activeTargetRole}. Prioritaskan perbaikan kompetensi agar sesuai dengan standar industri.`,
    sectionAudits: [
      {
        section: "1. Headline dan identitas profesional",
        status: "good",
        notes: [
          `Menyebutkan istilah peran target (${activeTargetRole}) secara jelas dan profesional.`,
          "Format teks bersih, rapi, dan mudah dibaca oleh sistem seleksi maupun tim perekrut."
        ],
        recommendation: "Tambahkan bidang industri yang kamu minati (misal: teknologi, keuangan, atau retail) agar profilmu semakin mudah ditemukan perekrut.",
      },
      {
        section: "2. Ringkasan profil (tentang saya)",
        status: "needs_improvement",
        notes: [
          "Belum merangkum total tahun pengalaman kerja secara ringkas.",
          "Kalimat pembuka masih bisa diperkuat dengan nilai tambah atau pencapaian terbaikmu."
        ],
        recommendation: "Gunakan pola 3-bagian: Peran utama, Keahlian andalan, dan Bukti hasil kerja nyata yang pernah dicapai.",
      },
      {
        section: "3. Riwayat pengalaman kerja",
        status: "needs_improvement",
        notes: [
          "Sebagian poin deskripsi masih berupa uraian tugas harian biasa.",
          "Belum konsisten menyertakan bukti hasil kerja nyata (misal: persentase keberhasilan, jumlah proyek, efisiensi waktu)."
        ],
        recommendation: "Gunakan kata kerja aktif yang jelas di awal setiap poin (misal: Mengembangkan, Memimpin, Merancang) dan sertakan contoh hasil nyata.",
      },
      {
        section: "4. Daftar keahlian dan alat kerja",
        status: skillCheck.isPlausible ? "good" : "needs_improvement",
        notes: skillCheck.isPlausible
          ? [
              `Terdaftar ${skills.length} keahlian yang relevan dengan kebutuhan peran ${activeTargetRole}.`,
              "Kombinasi keahlian teknis dan cara kerja tim sudah terlihat."
            ]
          : [
              `Keahlian yang tercantum (${skills.join(", ") || "belum lengkap"}) belum sesuai dengan standar kompetensi peran ${activeTargetRole}.`,
              "Perekrut membutuhkan keahlian nyata yang sesuai dengan posisi yang dilamar."
            ],
        recommendation: skillCheck.isPlausible
          ? "Kelompokkan keahlian ke dalam Keahlian Teknis, Alat Kerja (Tools), dan Metode Kerja agar mudah dipindai rekruter dalam hitungan detik."
          : `Perbaiki kompetensi agar sesuai dengan peran ${activeTargetRole}, misalnya dengan mempelajari: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
      },
      {
        section: "5. Pendidikan dan bukti portofolio",
        status: "good",
        notes: [
          "Riwayat pendidikan tertera jelas dan tautan proyek dapat diakses dengan baik."
        ],
        recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifikmu dan hasil nyata yang dicapai.",
      },
    ],
    formatChecks: [
      { check: "Kerapian Format & Judul Bagian CV Baku", passed: true, tip: "Gunakan nama bagian standar: Pengalaman Kerja, Pendidikan, Keahlian, Portofolio." },
      { check: "Kesesuaian Kata Kunci & Keahlian Inti", passed: skillCheck.isPlausible, tip: "Gunakan istilah dan kata kunci yang umum dicari rekruter untuk posisi ini." },
      { check: "Keterbacaan Poin Uraian & Tata Letak", passed: true, tip: "Gunakan poin-poin ringkas dan rapi yang nyaman dipindai oleh tim rekruter." },
      { check: "Kelengkapan Tautan Kontak & Portofolio", passed: true, tip: "Tautan profil profesional, portofolio online, dan email kontak telah aktif dan valid." },
    ],
    priorityActionItems: skillCheck.isPlausible
      ? [
          "Tambahkan bukti hasil kerja nyata (angka %, jumlah proyek, efisiensi waktu) pada 2 pengalaman kerja teratas.",
          "Perkaya ringkasan 'Tentang Saya' dengan menyertakan bidang industri yang kamu kuasai (misal: teknologi, keuangan, ritel).",
          "Kelompokkan keahlian teknis dan alat kerja agar mudah dipindai oleh tim perekrut dalam hitungan detik.",
        ]
      : [
          `Perbarui daftar keahlian di CV agar sesuai dengan kompetensi peran ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Tambahkan bukti hasil kerja nyata pada uraian pengalaman kerja agar rekruter lebih yakin.",
          "Tulis ringkasan singkat di bagian 'Tentang Saya' yang menjelaskan keunggulan dan minat karirmu.",
        ],
  };

  // Fallback data for Gap Analysis
  const gapData: GapAnalysisDetails = result?.gapAnalysisDetails || {
    targetRole: activeTargetRole,
    matchScore: skillCheck.isPlausible ? 84 : 40,
    matchLevel: skillCheck.isPlausible ? "Tinggi (selaras baik)" : "Perlu penyesuaian kompetensi",
    coreCompetencies: [
      {
        competency: "Riset Kebutuhan Pengguna & Validasi Solusi",
        candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
        requiredLevel: "Mahir",
        status: skillCheck.isPlausible ? "match" : "gap",
        recommendation: "Pelajari metode riset sederhana dan sertakan contoh proses kerja di portofolio.",
      },
      {
        competency: "Perancangan Komponen & Standar Desain Konsisten",
        candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
        requiredLevel: "Mahir",
        status: "gap",
        recommendation: "Pelajari cara menyusun komponen desain yang terstruktur dan mudah digunakan tim.",
      },
      {
        competency: "Komunikasi & Kolaborasi Antar-Tim",
        candidateLevel: "Menengah",
        requiredLevel: "Menengah",
        status: "match",
        recommendation: "Keunggulan kerja sama tim yang baik untuk posisi ini.",
      },
      {
        competency: "Analisis Data Pengguna & Uji Coba Peningkatan Solusi",
        candidateLevel: "Dasar",
        requiredLevel: "Menengah",
        status: "gap",
        recommendation: "Sertakan contoh metrik hasil atau efisiensi kerja di portofolio.",
      },
    ],
    criticalGaps: skillCheck.isPlausible
      ? [
          "Pengalaman mengukur dampak nyata setelah proyek selesai perlu lebih dipertegas di CV.",
          "Portofolio studi kasus perlu menyertakan proses perancangan yang terstruktur dari awal hingga akhir.",
          "Perjelas peran kepemimpinan atau inisiatif mandiri saat bekerja bersama tim.",
        ]
      : [
          skillCheck.competencyFeedback,
          "Belum ada bukti proyek portofolio atau studi kasus yang relevan dengan peran target ini.",
          "Perlu membangun pemahaman tentang alat kerja dan metode kerja yang umum digunakan.",
        ],
    transferableStrengths: [
      "Keahlian komunikasi yang baik dan kemudahan berkolaborasi dengan rekan tim.",
      "Kemampuan mengolah data dan masukan menjadi solusi nyata yang bermanfaat.",
    ],
    strategicRecommendations: skillCheck.isPlausible
      ? [
          "Tutup kesenjangan dengan membuat 1 studi kasus mendalam tentang proses kerja di portofolio.",
          "Cantumkan alat kerja (tools) yang kamu kuasai secara jelas di bagian keahlian.",
          "Tuliskan kontribusimu bersama tim pada deskripsi pencapaian karir.",
        ]
      : [
          `Perbarui profil dengan mempelajari keahlian dasar untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Buat minimal satu proyek sederhana atau studi kasus untuk membuktikan kemampuanmu.",
          "Ikuti kursus atau pelatihan daring untuk membangun fondasi keahlian yang dibutuhkan.",
        ],
  };

  // Fallback data for Career Consultation
  const consultationData: CareerConsultationDetails = result?.careerConsultationDetails || result?.careerRoadmapDetails || {
    targetRole: activeTargetRole,
    targetTimeline: "3–6 bulan kesiapan",
    targetLevel: skillCheck.isPlausible ? `Kesiapan kompetitif untuk ${activeTargetRole}` : `Kandidat siap kerja untuk ${activeTargetRole}`,
    phases: [
      {
        phaseNumber: 1,
        phaseName: skillCheck.isPlausible ? "Pembuktian Portofolio & Keunggulan Relevan" : "Penyelarasan & Pembangunan Keahlian Inti",
        timeframe: "Bulan 1 — 2",
        outcome: skillCheck.isPlausible
          ? "Portofolio proyek memiliki bukti hasil kerja nyata yang langsung memikat HRD saat peninjauan pertama."
          : `Keahlian inti untuk posisi ${activeTargetRole} mulai dikuasai dan portofolio awal terbentuk.`,
        keyActions: skillCheck.isPlausible
          ? [
              "Poles 1-2 studi kasus portofolio dengan menekankan peran spesifik dan metrik dampak positif",
              "Perbarui headline dan ringkasan profil agar mencerminkan spesialisasi bidang kerjamu",
              "Kelompokkan keahlian teknis dan alat kerja utama agar mudah dipindai HRD",
            ]
          : [
              `Fokus pelajari 2-3 keahlian utama untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")})`,
              "Perbarui daftar keahlian di CV setelah menguasai materi baru",
              "Buat 1 proyek latihan terstruktur sebagai bukti portofolio awal",
            ],
        milestone: skillCheck.isPlausible
          ? "Profil & Portofolio memiliki daya tarik tinggi saat disaring oleh HRD"
          : `Keahlian di profil selaras dengan kebutuhan peran ${activeTargetRole}`,
      },
      {
        phaseNumber: 2,
        phaseName: "Personal Branding & Visibilitas ke Perekrut",
        timeframe: "Bulan 2 — 4",
        outcome: "Profil aktif terlihat di radar pencarian talent dan mulai menerima undangan peluang kerja.",
        keyActions: [
          "Publikasikan rangkuman pembelajaran proyek atau studi kasus di komunitas profesional atau LinkedIn",
          "Lengkapi seluruh bagian profil ProofyLink untuk memaksimalkan peluang rekomendasi otomatis",
          "Minta umpan balik dari rekan kerja atau mentor mengenai kejelasan portofoliomu",
        ],
        milestone: "Mendapatkan tanggapan positif dan undangan wawancara dari perekrut",
      },
      {
        phaseNumber: 3,
        phaseName: "Strategi Pitching Wawancara & Evaluasi Tawaran",
        timeframe: "Bulan 4 — 6",
        outcome: "Mampu menyampaikan keunggulan diri secara percaya diri dan meraih penawaran kerja terbaik.",
        keyActions: [
          "Siapkan narasi STAR (Situation, Task, Action, Result) untuk setiap pencapaian utama",
          "Latih penjelasan jujur namun positif seputar transisi karir atau celah pengalaman",
          "Pelajari riset standar kompensasi dan nilai tambah unik yang kamu bawa untuk perusahaan",
        ],
        milestone: "Menerima dan menegosiasikan penawaran kerja resmi sesuai target karir",
      },
    ],
    recommendedCertifications: [
      `Pelatihan Praktis & Studi Kasus Bidang ${activeTargetRole}`,
      "Sertifikasi Profesional atau Lisensi Alat Kerja Industri",
      "Lokakarya Komunikasi Efektif & Kolaborasi Tim",
    ],
    strategicAdvice: [
      "Perekrut lebih tertarik pada bagaimana caramu memecahkan masalah nyata dibanding sekadar panjangnya daftar tugas.",
      "Jelaskan kontribusi pribadimu secara jujur dan transparan saat menceritakan proyek kolaborasi.",
      "Gunakan setiap wawancara kerja sebagai ruang bertukar wawasan dua arah, bukan sekadar ujian.",
    ],
    interviewPitchTips: [
      "Gunakan formula STAR: sebutkan tantangan yang dihadapi, aksimu, dan hasil positif yang dicapai.",
      "Jika ada kesenjangan pengalaman atau transisi karir, tonjolkan kecepatan belajar dan transferable skills yang relevan.",
      "Tunjukkan antusiasme dengan mempelajari produk atau tantangan bisnis perusahaan sebelum sesi interview.",
    ],
  };

  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan evaluasi '${selectedFocus.replaceAll("_", " ")}' untuk posisi ${activeTargetRole}, berikut beberapa poin penting:`,
    whatGood: [
      "Format susunan CV rapi, bersih, dan mudah dibaca oleh tim perekrut.",
      skillCheck.isPlausible
        ? `Keahlian yang dicantumkan (${skillCheck.validSkills.slice(0, 3).join(", ")}) sudah relevan dengan target posisi.`
        : "Informasi profil dan kontak utama sudah terisi dengan jelas.",
    ],
    whatNotGood: skillCheck.isPlausible
      ? [
          "Uraian pengalaman kerja masih bisa diperjelas dengan bukti hasil nyata (angka %, jumlah proyek, efisiensi waktu).",
          "Ringkasan profil belum menonjolkan bidang industri utama yang kamu kuasai.",
        ]
      : [
          skillCheck.competencyFeedback,
          "Uraian pengalaman kerja masih kurang bukti hasil nyata yang meyakinkan perekrut.",
        ],
    conclusion: skillCheck.isPlausible
      ? "Terapkan rekomendasi di atas untuk membuat CV kamu semakin menarik dan meningkatkan peluang dipanggil wawancara."
      : `Perbaiki daftar keahlian agar sesuai dengan standar posisi ${activeTargetRole} untuk membuka peluang lebih besar saat melamar pekerjaan.`,
  };

  return (
    <div className="space-y-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report,
          #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pilih fokus evaluasi</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pilih satu aspek untuk dianalisis dan dapatkan rekomendasi yang bisa langsung diterapkan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {focusPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedFocus === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleFocusChange(preset.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 sm:p-5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                    : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    {isSelected ? (
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                        Aktif
                      </Badge>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{preset.badge}</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{preset.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              Target peran dan instruksi
            </h3>
            <span className="text-xs text-muted-foreground">
              Opsional — sesuaikan sebelum menjalankan analisis
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Target posisi atau peran yang ingin diuji
              </label>
              <Input
                value={customRoleInput !== null ? customRoleInput : defaultTargetRole}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="misal: Senior Product Designer, Lead UX..."
                className="h-9 rounded-lg border-border/80 bg-background text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Catatan atau instruksi khusus ke AI
              </label>
              <Input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="misal: Fokus industri Fintech SaaS, tekankan kepemimpinan..."
                className="h-9 rounded-lg border-border/80 bg-background text-sm"
              />
            </div>
          </div>

          {/* Dynamic Quick Prompts — chip toggle per pilar, auto-reset saat ganti pilar */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Zap className="size-3.5 text-muted-foreground" /> Fokus analisis cepat
              </span>
              <div className="flex items-center gap-2">
                {selectedQuickPrompts.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedQuickPrompts(new Set())}
                    className="text-xs text-muted-foreground hover:text-destructive font-medium transition-colors underline cursor-pointer"
                  >
                    Hapus pilihan ({selectedQuickPrompts.size})
                  </button>
                )}
                <span className="rounded-full border border-border/70 bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {focusPresets.find((p) => p.id === selectedFocus)?.label}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentQuickPrompts.map((qp, i) => {
                const isActive = selectedQuickPrompts.has(qp.text);
                const PromptIcon = qp.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleQuickPrompt(qp.text)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary font-semibold ring-1 ring-primary/25"
                        : "border-border/80 bg-background text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <PromptIcon className="size-3.5 shrink-0" />
                    <span>{qp.text}</span>
                  </button>
                );
              })}
            </div>
            {selectedQuickPrompts.size > 0 && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                <span>{selectedQuickPrompts.size} fokus dipilih — AI akan memprioritaskan aspek ini dalam analisis</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Evaluasi akan dijalankan untuk pilar:{" "}
              <strong className="font-semibold text-foreground">
                {focusPresets.find((p) => p.id === selectedFocus)?.label}
              </strong>
            </p>
            <Button
              onClick={() => void runAdvisor()}
              disabled={loading}
              size="default"
              className="gap-2 font-semibold px-5 shadow-xs"
            >
              {loading ? (
                <>
                  <Bot className="size-4 animate-spin" /> Menganalisis profil...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Analisis dan hasilkan rekomendasi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Advice Results ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-fade-up">
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">ProofyLink — Laporan evaluasi karier dan profil AI</h1>
            <p className="text-sm text-muted-foreground">
              Kandidat: {cvProfile?.fullName || "Profil kamu"} | Peran dituju: {activeTargetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Draf AI</Badge>
              <span className="text-xs text-muted-foreground">Hasil analisis siap ditinjau sebelum disimpan.</span>
              {isStreaming && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Memproses... ({streamProgress}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyAdvice}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Copy className="size-3.5" /> Salin rekomendasi
              </Button>
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" /> Unduh PDF
              </Button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 1: REVIEW CV KESELURUHAN (CV REVIEW) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "cv_review" || result.focus === "ats") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-5 text-muted-foreground" />
                      <CardTitle className="text-lg text-foreground">Review CV keseluruhan dan kesiapan melamar kerja</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status kesiapan:</span>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {cvReviewData.readinessLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Executive Summary */}
                  <div className="rounded-lg border bg-card p-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Ringkasan evaluasi CV
                    </h4>
                    <p className="text-sm leading-7 text-foreground">
                      {cvReviewData.executiveSummary}
                    </p>
                  </div>

                  {/* Priority Action Items */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">
                      Rekomendasi perbaikan prioritas
                    </h4>
                    <ul className="divide-y divide-border rounded-lg border bg-card">
                      {cvReviewData.priorityActionItems.map((item, idx) => (
                        <li key={idx} className="px-4 py-3 text-sm leading-6 text-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Section Audits */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Audit per bagian CV</h4>
                    <ul className="divide-y divide-border rounded-lg border bg-card">
                      {cvReviewData.sectionAudits.map((sec, i) => (
                        <li key={i} className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-medium text-foreground">{sec.section}</strong>
                            <Badge variant={sec.status === "good" ? "secondary" : "outline"} className="text-xs font-medium">
                              {sec.status === "good" ? "Sudah baik" : "Perlu penguatan"}
                            </Badge>
                          </div>
                          <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-muted-foreground">
                            {sec.notes.map((n, ni) => (
                              <li key={ni}>{n}</li>
                            ))}
                          </ul>
                          <p className="text-sm leading-6 bg-muted/40 p-2.5 rounded-lg border text-foreground">
                            <strong>Saran perbaikan:</strong> {sec.recommendation}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Format & Readability Checks */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Pemeriksaan kerapian format dan keterbacaan rekruter</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cvReviewData.formatChecks.map((check, i) => (
                        <div key={i} className="rounded-lg border bg-card p-3 flex items-start gap-2.5">
                          {check.passed ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="text-sm">
                            <strong className="block text-foreground font-medium">{check.check}</strong>
                            <span className="text-muted-foreground mt-0.5 block leading-6">{check.tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 2: GAP ANALYSIS (KESIAPAN KARIR HARI INI) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "gap_analysis" || result.focus === "headline") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Target className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Evaluasi kesenjangan karier hari ini</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Target peran: <span className="font-medium text-foreground">{gapData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Kecocokan profil:</span>
                      <Badge variant="secondary" className="text-xs font-medium tabular-nums">
                        {gapData.matchScore}% · {gapData.matchLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Core Competencies Matrix */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Evaluasi kompetensi inti
                    </h3>
                    <ul className="divide-y divide-border rounded-lg border bg-card">
                      {gapData.coreCompetencies.map((comp, i) => (
                        <li key={i} className="p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <strong className="text-sm font-medium text-foreground">{comp.competency}</strong>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground tabular-nums">
                                Level saat ini: <strong className="text-foreground font-medium">{comp.candidateLevel}</strong> · Target: <strong className="text-foreground font-medium">{comp.requiredLevel}</strong>
                              </span>
                              <Badge
                                variant={comp.status === "gap" ? "outline" : "secondary"}
                                className="text-xs font-medium"
                              >
                                {comp.status === "match" ? "Sesuai" : comp.status === "exceeds" ? "Melebihi" : "Ada kesenjangan"}
                              </Badge>
                            </div>
                          </div>
                          {comp.recommendation && (
                            <p className="text-sm leading-6 text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                              <strong className="text-foreground font-medium">Rekomendasi peningkatan:</strong> {comp.recommendation}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2-Column: Critical Gaps vs Transferable Strengths */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Kesenjangan kritis yang perlu ditutup
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                        {gapData.criticalGaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Keunggulan dan kekuatan transferable
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                        {gapData.transferableStrengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strategic Upskilling Action Items */}
                  <div className="rounded-lg border bg-card p-4 space-y-2.5">
                    <h4 className="text-sm font-medium text-foreground">
                      Rekomendasi aksi peningkatan hari ini
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                      {gapData.strategicRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 3: CAREER CONSULTATION (PANDUAN & PITCHING REKRUTER) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "career_consultation" || result.focus === "career_roadmap" || result.focus === "star") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Compass className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Konsultasi karier dan panduan menghadapi HRD</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Target peran: <span className="font-medium text-foreground">{consultationData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium tabular-nums">
                        Timeline: {consultationData.targetTimeline}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {consultationData.targetLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* 3 Strategic Phases */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Tahapan strategis menuju target peran
                    </h3>
                    <ol className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                      {consultationData.phases.map((phase) => (
                        <li key={phase.phaseNumber} className="flex flex-col justify-between rounded-lg border bg-card p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                Tahap {phase.phaseNumber}
                              </span>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {phase.timeframe}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm text-foreground">{phase.phaseName}</h4>
                            <p className="text-sm leading-6 text-muted-foreground">
                              <strong className="text-foreground font-medium">Hasil:</strong> {phase.outcome}
                            </p>
                            <div className="space-y-1.5 pt-1">
                              <span className="text-sm font-medium text-foreground block">Aksi utama</span>
                              <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-muted-foreground">
                                {phase.keyActions.map((action, ai) => (
                                  <li key={ai}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs leading-6 text-muted-foreground">
                              <span className="font-medium text-foreground">Milestone:</span> {phase.milestone}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 2-Column: Interview Pitch Tips vs Strategic Recruiter Advice */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Interview Pitch Tips */}
                    <div className="rounded-lg border bg-card p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Tips pitching dan wawancara kerja
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-muted-foreground">
                        {(consultationData.interviewPitchTips || []).map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Strategic Advice */}
                    <div className="rounded-lg border bg-card p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Saran strategis dari sudut pandang perekrut
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-muted-foreground">
                        {consultationData.strategicAdvice.map((adv, i) => (
                          <li key={i}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Certifications & Topics */}
                  <div className="rounded-lg border bg-card p-4 space-y-2.5">
                    <h4 className="text-sm font-medium text-foreground">
                      Topik pelatihan dan sertifikasi yang relevan
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {consultationData.recommendedCertifications.map((cert, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-medium">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Executive Summary & Action Steps ─── */}
          <Card className="no-print border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" /> Rangkuman saran dan langkah selanjutnya
              </CardTitle>
              <Button
                size="sm"
                variant={appliedToCv ? "outline" : "default"}
                onClick={handleApplyToCv}
                className="shrink-0 gap-1.5 text-xs font-medium"
              >
                <Sparkles className="size-3.5" />
                {appliedToCv ? "Tersinkron ke CV" : "Terapkan saran ke CV"}
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Hal yang sudah baik
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                    {adviceData.whatGood.map((good, idx) => (
                      <li key={idx}>{good}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <h4 className="text-sm font-medium text-foreground">
                    Area yang perlu penguatan
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                    {adviceData.whatNotGood.map((bad, idx) => (
                      <li key={idx}>{bad}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Gunakan rekomendasi evaluasi di atas untuk memperbarui profil dan portofoliomu.
                </p>
                <Link href="/candidate/cv">
                  <Button className="gap-2 font-medium rounded-lg shadow-xs">
                    <FileText className="size-4" /> Buka workspace CV dan edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Disclosure Footer */}
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge variant="secondary">Draf AI</Badge>
              <span>Sumber: <strong className="font-medium text-foreground">{result.source}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Model: <strong className="font-medium text-foreground tabular-nums">{result.modelVersion}</strong></span>
            </div>
            <p className="leading-6">
              Cakupan data: headline, {skills.length} keahlian ({skills.slice(0, 3).join(", ") || "belum ada"}), target peran {activeTargetRole}.
            </p>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Keterbatasan
              </p>
              <ul className="list-disc pl-5 space-y-1.5 leading-6">
                {result.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
