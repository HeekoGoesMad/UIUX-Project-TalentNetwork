"use client";

import { useState } from "react";
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CvProfile } from "@/types";
import { cn } from "@/lib/utils";

// ─── Template definitions ─────────────────────────────────────────────────────

export type CvTemplateId = "ats" | "modern" | "sidebar" | "minimal";

interface CvTemplate {
  id: CvTemplateId;
  name: string;
  tag: string;
  desc: string;
  recommended?: boolean;
  preview: React.ReactNode;
}

const templates: CvTemplate[] = [
  {
    id: "ats",
    name: "ATS Clean",
    tag: "Direkomendasikan",
    desc: "Format standar ATS-friendly: hitam-putih, tanpa kolom, mudah diparsing sistem rekrutmen.",
    recommended: true,
    preview: (
      <div className="w-full rounded-lg border bg-white p-4 text-[8px] leading-tight shadow-sm font-mono">
        <div className="border-b pb-1.5 mb-1.5">
          <div className="h-2 w-28 bg-slate-900 rounded mb-0.5" />
          <div className="h-1.5 w-20 bg-slate-400 rounded" />
        </div>
        <div className="space-y-1">
          {["PENGALAMAN KERJA", "PENDIDIKAN", "SKILLS"].map((s) => (
            <div key={s}>
              <div className="h-1.5 w-16 bg-slate-900 rounded mb-0.5" />
              <div className="h-1 w-full bg-slate-200 rounded mb-0.5" />
              <div className="h-1 w-4/5 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "modern",
    name: "Modern Purple",
    tag: "Populer",
    desc: "Header dengan aksen ungu ProofyLink, layout dua kolom elegan untuk fresh graduate & professional.",
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-sm text-[8px] leading-tight">
        <div className="bg-[#7C3AED] px-4 py-3">
          <div className="h-2.5 w-24 bg-white/80 rounded mb-0.5" />
          <div className="h-1.5 w-16 bg-purple-300 rounded" />
        </div>
        <div className="bg-white p-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="h-1 w-full bg-purple-100 rounded" />
            <div className="h-1 w-4/5 bg-purple-100 rounded" />
            <div className="h-1 w-3/5 bg-purple-100 rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-1 w-full bg-slate-200 rounded" />
            <div className="h-1 w-3/4 bg-slate-200 rounded" />
            <div className="flex flex-wrap gap-0.5 mt-1">
              {[1,2,3].map(i => <div key={i} className="h-1.5 w-5 bg-purple-200 rounded-full" />)}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sidebar",
    name: "Sidebar Creative",
    tag: "Kreatif",
    desc: "Sidebar gelap dengan konten utama terang. Cocok untuk desainer, marketers, dan creative roles.",
    preview: (
      <div className="w-full rounded-lg border overflow-hidden shadow-sm text-[8px] leading-tight flex">
        <div className="w-1/3 bg-slate-800 p-2 space-y-1.5">
          <div className="size-6 rounded-full bg-white/30 mx-auto mb-1" />
          <div className="h-1 w-full bg-white/40 rounded" />
          <div className="h-1 w-3/4 bg-white/20 rounded" />
          <div className="h-1 w-full bg-white/20 rounded" />
          <div className="h-1 w-4/5 bg-white/20 rounded" />
        </div>
        <div className="flex-1 bg-white p-2 space-y-1">
          <div className="h-1.5 w-16 bg-slate-800 rounded mb-0.5" />
          <div className="h-1 w-full bg-slate-200 rounded" />
          <div className="h-1 w-4/5 bg-slate-200 rounded" />
          <div className="h-1.5 w-16 bg-slate-800 rounded mt-1 mb-0.5" />
          <div className="h-1 w-full bg-slate-200 rounded" />
          <div className="h-1 w-3/4 bg-slate-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal Elegant",
    tag: "Premium",
    desc: "Tipografi tegas dengan batas tipis dan whitespace maksimal. Kesan high-level professional.",
    preview: (
      <div className="w-full rounded-lg border bg-white p-4 text-[8px] leading-tight shadow-sm">
        <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-2">
          <div>
            <div className="h-2.5 w-24 bg-slate-900 rounded mb-0.5" />
            <div className="h-1.5 w-20 bg-slate-400 rounded" />
          </div>
          <div className="text-right space-y-0.5">
            <div className="h-1 w-14 bg-slate-300 rounded" />
            <div className="h-1 w-12 bg-slate-300 rounded" />
          </div>
        </div>
        <div className="space-y-1.5">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-2">
              <div className="w-12 shrink-0 h-1 bg-slate-400 rounded mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <div className="h-1 w-full bg-slate-200 rounded" />
                <div className="h-1 w-4/5 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// ─── HTML generators per template ────────────────────────────────────────────

function buildHtmlAts(p: CvProfile): string {
  const skills = [...p.skills, ...p.tools].join(" · ");
  const exp = p.experience.map(e => `
    <div style="margin-bottom:10px">
      <div style="font-weight:bold">${e.role} — ${e.company}</div>
      <div style="font-size:11px;color:#555">${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:4px;font-size:11px">${e.achievements.join(", ")}</div>` : ""}
    </div>`).join("");
  const edu = p.education.map(e => `
    <div style="margin-bottom:8px">
      <div style="font-weight:bold">${e.school}</div>
      <div style="font-size:11px;color:#555">${e.program} · ${e.dates}</div>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>CV – ${p.fullName}</title>
<style>
  @page { margin: 18mm 20mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; line-height: 1.5; }
  h1 { font-size: 22px; font-weight: bold; margin-bottom: 2px; }
  .sub { font-size: 12px; color: #444; margin-bottom: 4px; }
  .contact { font-size: 11px; color: #666; margin-bottom: 12px; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1.5px solid #111; padding-bottom: 2px; margin: 14px 0 8px; }
  .about { font-size: 11.5px; color: #333; margin-bottom: 4px; }
</style>
</head><body>
  <h1>${p.fullName}</h1>
  <div class="sub">${p.headline ?? ""}</div>
  <div class="contact">${p.email} ${p.phone ? "· " + p.phone : ""} ${p.location ? "· " + p.location : ""}</div>
  ${p.about ? `<div class="section-title">TENTANG SAYA</div><div class="about">${p.about}</div>` : ""}
  ${p.experience.length ? `<div class="section-title">PENGALAMAN KERJA</div>${exp}` : ""}
  ${p.education.length ? `<div class="section-title">PENDIDIKAN</div>${edu}` : ""}
  ${skills ? `<div class="section-title">SKILLS & TOOLS</div><div style="font-size:11.5px">${skills}</div>` : ""}
  ${p.portfolio.length ? `<div class="section-title">PORTFOLIO</div><div style="font-size:11px;color:#555">${p.portfolio.join(" · ")}</div>` : ""}
</body></html>`;
}

function buildHtmlModern(p: CvProfile): string {
  const exp = p.experience.map(e => `
    <div style="margin-bottom:10px">
      <div style="font-weight:700;color:#111">${e.role}</div>
      <div style="font-size:11px;color:#7C3AED;font-weight:600">${e.company} · ${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:3px;font-size:11px;color:#444">${e.achievements.join(", ")}</div>` : ""}
    </div>`).join("");
  const edu = p.education.map(e => `
    <div style="margin-bottom:8px">
      <div style="font-weight:700">${e.school}</div>
      <div style="font-size:11px;color:#555">${e.program} · ${e.dates}</div>
    </div>`).join("");
  const skillBadges = p.skills.map(s => `<span style="background:#F3E8FF;color:#7C3AED;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;display:inline-block">${s}</span>`).join("");
  const toolBadges = p.tools.map(t => `<span style="background:#EDE9FE;color:#6D28D9;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;display:inline-block">${t}</span>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>CV – ${p.fullName}</title>
<style>
  @page { margin: 0; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111; line-height: 1.5; }
  .header { background: linear-gradient(135deg,#7C3AED,#EC4899); color: white; padding: 28px 32px 24px; }
  .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
  .header .headline { font-size: 13px; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .header .contact { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 6px; }
  .body { display: grid; grid-template-columns: 1.4fr 0.8fr; gap: 0; }
  .main { padding: 24px 24px 24px 32px; }
  .aside { background: #F9FAFB; padding: 24px 20px; border-left: 1px solid #E5E7EB; }
  .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #7C3AED; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #F3E8FF; }
  .about { font-size: 11.5px; color: #444; margin-bottom: 16px; line-height: 1.6; }
  .section { margin-bottom: 18px; }
</style>
</head><body>
  <div class="header">
    <h1>${p.fullName}</h1>
    <div class="headline">${p.headline ?? ""}</div>
    <div class="contact">${p.email}${p.phone ? " · " + p.phone : ""}${p.location ? " · " + p.location : ""}</div>
  </div>
  <div class="body">
    <div class="main">
      ${p.about ? `<div class="about">${p.about}</div>` : ""}
      ${p.experience.length ? `<div class="section"><div class="section-title">Pengalaman Kerja</div>${exp}</div>` : ""}
      ${p.education.length ? `<div class="section"><div class="section-title">Pendidikan</div>${edu}</div>` : ""}
    </div>
    <div class="aside">
      ${p.skills.length ? `<div class="section"><div class="section-title">Skills</div><div>${skillBadges}</div></div>` : ""}
      ${p.tools.length ? `<div class="section"><div class="section-title">Tools</div><div>${toolBadges}</div></div>` : ""}
      ${p.portfolio.length ? `<div class="section"><div class="section-title">Portfolio</div>${p.portfolio.map(u => `<div style="font-size:10px;color:#7C3AED;word-break:break-all;margin-bottom:4px">${u}</div>`).join("")}</div>` : ""}
    </div>
  </div>
</body></html>`;
}

function buildHtmlSidebar(p: CvProfile): string {
  const exp = p.experience.map(e => `
    <div style="margin-bottom:10px">
      <div style="font-weight:700">${e.role}</div>
      <div style="font-size:11px;color:#94A3B8">${e.company} · ${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:3px;font-size:11px;color:#94A3B8">${e.achievements.join(", ")}</div>` : ""}
    </div>`).join("");
  const edu = p.education.map(e => `
    <div style="margin-bottom:6px;font-size:11px">
      <div style="font-weight:600;color:#E2E8F0">${e.school}</div>
      <div style="color:#94A3B8">${e.program} · ${e.dates}</div>
    </div>`).join("");
  const skillItems = [...p.skills, ...p.tools].map(s => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:8px;height:8px;background:#7C3AED;border-radius:50%;flex-shrink:0"></div>
      <span style="font-size:11px;color:#E2E8F0">${s}</span>
    </div>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>CV – ${p.fullName}</title>
<style>
  @page { margin: 0; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1E293B; line-height: 1.5; display: flex; height: 100vh; }
  .sidebar { width: 230px; background: #1E293B; color: white; padding: 28px 20px; flex-shrink: 0; }
  .avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#EC4899); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; margin: 0 auto 14px; }
  .name { font-size: 16px; font-weight: 800; color: white; text-align: center; }
  .headline-side { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 3px; margin-bottom: 16px; }
  .sidebar-section { margin-bottom: 16px; }
  .sidebar-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #7C3AED; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 4px; }
  .contact-item { font-size: 10px; color: #94A3B8; margin-bottom: 3px; word-break: break-all; }
  .main { flex: 1; padding: 28px 28px; background: white; }
  .main-section { margin-bottom: 18px; }
  .main-title { font-size: 13px; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; border-bottom: 2px solid #7C3AED; margin-bottom: 10px; }
  .about { font-size: 11.5px; color: #475569; line-height: 1.6; }
</style>
</head><body>
  <div class="sidebar">
    <div class="avatar">${(p.fullName ?? "?").split(" ").map(n => n[0]).slice(0,2).join("")}</div>
    <div class="name">${p.fullName}</div>
    <div class="headline-side">${p.headline ?? ""}</div>
    <div class="sidebar-section">
      <div class="sidebar-title">Kontak</div>
      <div class="contact-item">📧 ${p.email}</div>
      ${p.phone ? `<div class="contact-item">📱 ${p.phone}</div>` : ""}
      ${p.location ? `<div class="contact-item">📍 ${p.location}</div>` : ""}
    </div>
    ${[...p.skills, ...p.tools].length ? `<div class="sidebar-section"><div class="sidebar-title">Skills & Tools</div>${skillItems}</div>` : ""}
    ${p.education.length ? `<div class="sidebar-section"><div class="sidebar-title">Pendidikan</div>${edu}</div>` : ""}
    ${p.portfolio.length ? `<div class="sidebar-section"><div class="sidebar-title">Portfolio</div>${p.portfolio.map(u => `<div style="font-size:9px;color:#7C3AED;word-break:break-all;margin-bottom:3px">${u}</div>`).join("")}</div>` : ""}
  </div>
  <div class="main">
    ${p.about ? `<div class="main-section"><div class="about">${p.about}</div></div>` : ""}
    ${p.experience.length ? `<div class="main-section"><div class="main-title">Pengalaman Kerja</div>${exp}</div>` : ""}
  </div>
</body></html>`;
}

function buildHtmlMinimal(p: CvProfile): string {
  const exp = p.experience.map(e => `
    <tr>
      <td style="width:80px;vertical-align:top;padding-right:16px;font-size:10px;color:#888;padding-bottom:10px">${e.dates}</td>
      <td style="vertical-align:top;padding-bottom:10px">
        <div style="font-weight:700;font-size:12px">${e.role}</div>
        <div style="font-size:11px;color:#666">${e.company}</div>
        ${e.achievements?.length ? `<div style="font-size:11px;color:#555;margin-top:2px">${e.achievements.join(", ")}</div>` : ""}
      </td>
    </tr>`).join("");
  const edu = p.education.map(e => `
    <tr>
      <td style="width:80px;vertical-align:top;padding-right:16px;font-size:10px;color:#888;padding-bottom:8px">${e.dates}</td>
      <td style="vertical-align:top;padding-bottom:8px">
        <div style="font-weight:700;font-size:12px">${e.school}</div>
        <div style="font-size:11px;color:#666">${e.program}</div>
      </td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>CV – ${p.fullName}</title>
<style>
  @page { margin: 20mm 24mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #111; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .headline { font-size: 12px; color: #555; font-style: italic; margin-top: 2px; }
  .contact { text-align: right; font-size: 10px; color: #777; line-height: 1.8; }
  .section { margin-bottom: 14px; }
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 8px; }
  .about { font-size: 11.5px; color: #444; line-height: 1.7; margin-bottom: 14px; border-left: 3px solid #111; padding-left: 10px; }
  .skills-row { font-size: 11px; color: #333; }
</style>
</head><body>
  <div class="header">
    <div>
      <h1>${p.fullName}</h1>
      <div class="headline">${p.headline ?? ""}</div>
    </div>
    <div class="contact">
      ${p.email}<br/>
      ${p.phone ?? ""}<br/>
      ${p.location ?? ""}
    </div>
  </div>
  ${p.about ? `<div class="about">${p.about}</div>` : ""}
  ${p.experience.length ? `<div class="section"><div class="section-label">Pengalaman</div><table style="width:100%;border-collapse:collapse">${exp}</table></div>` : ""}
  ${p.education.length ? `<div class="section"><div class="section-label">Pendidikan</div><table style="width:100%;border-collapse:collapse">${edu}</table></div>` : ""}
  ${[...p.skills, ...p.tools].length ? `<div class="section"><div class="section-label">Skills & Tools</div><div class="skills-row">${[...p.skills, ...p.tools].join(" · ")}</div></div>` : ""}
  ${p.portfolio.length ? `<div class="section"><div class="section-label">Portfolio</div><div class="skills-row">${p.portfolio.join(" · ")}</div></div>` : ""}
</body></html>`;
}

const builders: Record<CvTemplateId, (p: CvProfile) => string> = {
  ats: buildHtmlAts,
  modern: buildHtmlModern,
  sidebar: buildHtmlSidebar,
  minimal: buildHtmlMinimal,
};

// ─── Download logic ───────────────────────────────────────────────────────────

function downloadCv(profile: CvProfile, templateId: CvTemplateId) {
  const html = builders[templateId](profile);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Open in new tab so user can use browser Print → Save as PDF
  const win = window.open(url, "_blank");
  if (!win) return;
  win.onload = () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(url);
    }, 400);
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CvDownload({ profile }: { profile: CvProfile }) {
  const [selected, setSelected] = useState<CvTemplateId>("ats");
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    downloadCv(profile, selected);
    setTimeout(() => setDownloading(false), 1500);
  };

  const selectedTpl = templates.find((t) => t.id === selected)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="size-5 text-slate-700" />
        <div>
          <p className="font-semibold text-[#111827]">Pilih Template CV</p>
          <p className="text-xs text-muted-foreground">Template ATS wajib untuk mendaftar via sistem rekrutmen otomatis.</p>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => setSelected(tpl.id)}
            className={cn(
              "group flex flex-col rounded-2xl border p-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
              selected === tpl.id
                ? "border-slate-900 bg-slate-50 shadow-md ring-1 ring-slate-900 -translate-y-0.5"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm hover:-translate-y-0.5"
            )}
          >
            {/* Preview thumbnail */}
            <div className="mb-3 overflow-hidden rounded-lg border bg-slate-50">
              {tpl.preview}
            </div>

            {/* Info */}
            <div className="flex items-start justify-between gap-1 mb-1">
              <p className={cn("text-sm font-bold", selected === tpl.id ? "text-slate-900" : "text-[#111827]")}>
                {tpl.name}
              </p>
              {selected === tpl.id && <CheckCircle2 className="size-4 shrink-0 text-slate-900 mt-0.5" />}
            </div>
            <span className={cn(
              "mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold w-fit",
              tpl.recommended
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            )}>
              {tpl.tag}
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{tpl.desc}</p>
          </button>
        ))}
      </div>

      {/* Action area */}
      <Card className="border border-slate-200 bg-white">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              selected === "ats" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
            )}>
              <FileText className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#111827]">
                Template: <span className="text-slate-900 font-bold">{selectedTpl.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-sm">
                {selectedTpl.desc}
              </p>
              {selected === "ats" && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Format ini kompatibel dengan semua ATS (Workday, Taleo, Greenhouse, dll.)
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold rounded-xl px-5"
            >
              {downloading ? (
                <><Sparkles className="size-4 animate-pulse mr-1.5" /> Membuka Preview...</>
              ) : (
                <><Download className="size-4 mr-1.5" /> Download PDF</>
              )}
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Terbuka di tab baru → Print → Save as PDF
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ATS tip */}
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
        <ShieldCheck className="size-4 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Tips ATS:</strong> Gunakan template <strong>ATS Clean</strong> saat apply ke perusahaan besar. Hindari tabel, kolom, dan gambar agar parser sistem rekrutmen dapat membaca semua informasimu dengan benar.
        </p>
      </div>
    </div>
  );
}
