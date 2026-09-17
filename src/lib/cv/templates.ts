import type { CvProfile } from "@/types";

export type CvTemplateId = "ats" | "modern" | "sidebar" | "minimal";

const escapeHtml = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

export const safeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (/^\/[^/]/.test(trimmed)) return trimmed;
  return "#";
};

const safeAvatarUrl = (url: string): string | null => {
  if (/^data:image\//i.test(url.trim())) return url.trim();
  const sanitized = safeUrl(url);
  return /^https:/i.test(sanitized) ? sanitized : null;
};

const portfolioLink = (u: string, label?: string): string => {
  const display = label ? escapeHtml(label) : escapeHtml(u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""));
  return `<a href="${escapeHtml(safeUrl(u))}" target="_blank" rel="noopener noreferrer" class="cv-link">${display}</a>`;
};

export const getCvDisplayRole = (p: CvProfile): string => {
  if (p.headline?.trim()) return p.headline.trim();
  const currentRole = p.experience?.find((e) => e.role?.trim())?.role?.trim();
  if (currentRole) return currentRole;
  if (p.targetRole?.trim()) return p.targetRole.trim();
  return "";
};

// ─── Inline SVG Micro-Icons (Zero Emojis, 100% Vector Print Quality) ───────────
const SVG_ICONS = {
  mail: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  pin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  globe: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  award: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  external: `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cv-icon-ext"><path d="M15 3h6v6"/><path d="10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
};

const commonPrintCss = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body { width: 100%; min-height: 100vh; background: #FFFFFF; text-rendering: optimizeLegibility; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
  .cv-icon { vertical-align: -1px; display: inline-block; margin-right: 4px; flex-shrink: 0; opacity: 0.75; }
  .cv-icon-ext { vertical-align: -0.5px; display: inline-block; margin-left: 3px; opacity: 0.6; }
  .cv-link { color: inherit; text-decoration: none; border-bottom: 1px dotted currentColor; transition: opacity 0.15s; }
  .cv-link:hover { opacity: 0.8; }
`;

const html = (p: CvProfile, css: string, body: string): string =>
  `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CV – ${escapeHtml(p.fullName || "Kandidat")}</title>
  <style>
    ${commonPrintCss}
    ${css}
  </style>
</head>
<body>
  ${body}
</body>
</html>`;

// ─── 1. RENDER EXECUTIVE ATS CLASSIC (Harvard / Ivy League Standard) ──────────
function renderAtsBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const softSkills = p.softSkills ?? [];
  const tools = p.tools ?? [];

  const contactItems: string[] = [];
  if (p.phone) contactItems.push(`<span>${escapeHtml(p.phone)}</span>`);
  if (p.email) contactItems.push(`<span>${escapeHtml(p.email)}</span>`);
  if (p.location) contactItems.push(`<span>${escapeHtml(p.location)}</span>`);
  if (p.portfolio.length) {
    contactItems.push(`<span>${portfolioLink(p.portfolio[0])}</span>`);
  }

  const expItemsHtml = p.experience
    .map((e) => {
      const empType = e.employmentType ? ` (${escapeHtml(e.employmentType)})` : "";
      const descHtml = e.description ? `<div class="ats-item-desc">${escapeHtml(e.description)}</div>` : "";
      const achHtml = e.achievements?.length
        ? `<ul class="ats-bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
        : "";
      return `
      <div class="ats-item page-break-avoid">
        <div class="ats-item-row">
          <div class="ats-item-left">
            <span class="ats-role">${escapeHtml(e.role)}</span>
            <span class="ats-company-sep">|</span>
            <span class="ats-company">${escapeHtml(e.company)}${empType}</span>
          </div>
          <div class="ats-dates">${escapeHtml(e.dates)}</div>
        </div>
        ${descHtml}
        ${achHtml}
      </div>`;
    })
    .join("");

  const eduItemsHtml = p.education
    .map((e) => {
      const levelPrefix = e.level ? `${escapeHtml(e.level)} ` : "";
      const gpaHtml = e.gpa ? `<span class="ats-gpa">IPK: ${escapeHtml(e.gpa)}</span>` : "";
      return `
      <div class="ats-item page-break-avoid">
        <div class="ats-item-row">
          <div class="ats-item-left">
            <span class="ats-role">${levelPrefix}${escapeHtml(e.program)}</span>
            <span class="ats-company-sep">|</span>
            <span class="ats-company">${escapeHtml(e.school)}</span>
          </div>
          <div class="ats-dates">${escapeHtml(e.dates || "")}</div>
        </div>
        ${gpaHtml ? `<div class="ats-item-desc">${gpaHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  const certItemsHtml = p.certifications?.length
    ? `<div class="ats-section page-break-avoid">
        <div class="ats-section-title">SERTIFIKASI &amp; LISENSI</div>
        <ul class="ats-bullets">
          ${p.certifications.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  const skillGroups: string[] = [];
  if (hardSkills.length) {
    skillGroups.push(`<div><strong>Keahlian Teknis:</strong> ${hardSkills.map(escapeHtml).join(", ")}</div>`);
  }
  if (tools.length) {
    skillGroups.push(`<div><strong>Tools &amp; Perangkat Lunak:</strong> ${tools.map(escapeHtml).join(", ")}</div>`);
  }
  if (softSkills.length) {
    skillGroups.push(`<div><strong>Kompetensi Profesional:</strong> ${softSkills.map(escapeHtml).join(", ")}</div>`);
  }

  const skillsSectionHtml = skillGroups.length
    ? `<div class="ats-section page-break-avoid">
        <div class="ats-section-title">KEAHLIAN &amp; KOMPETENSI</div>
        <div class="ats-skills-body">${skillGroups.join("")}</div>
      </div>`
    : "";

  const portfolioExtra = p.portfolio.length > 1
    ? `<div class="ats-section page-break-avoid">
        <div class="ats-section-title">PORTFOLIO &amp; TAUTAN</div>
        <ul class="ats-bullets">
          ${p.portfolio.map((u) => `<li>${portfolioLink(u)}</li>`).join("")}
        </ul>
      </div>`
    : "";

  return `
  <div class="ats-doc">
    <header class="ats-header">
      <h1 class="ats-name">${escapeHtml(p.fullName || "Nama Lengkap")}</h1>
      ${getCvDisplayRole(p) ? `<div class="ats-headline">${escapeHtml(getCvDisplayRole(p))}</div>` : ""}
      <div class="ats-contact">${contactItems.join(" &bull; ")}</div>
    </header>

    ${p.about ? `
    <div class="ats-section page-break-avoid">
      <div class="ats-section-title">RINGKASAN EKSEKUTIF</div>
      <p class="ats-summary">${escapeHtml(p.about)}</p>
    </div>` : ""}

    ${p.experience.length ? `
    <div class="ats-section">
      <div class="ats-section-title">PENGALAMAN KERJA</div>
      ${expItemsHtml}
    </div>` : ""}

    ${p.education.length ? `
    <div class="ats-section">
      <div class="ats-section-title">PENDIDIKAN</div>
      ${eduItemsHtml}
    </div>` : ""}

    ${certItemsHtml}
    ${skillsSectionHtml}
    ${portfolioExtra}
  </div>
`;
}

// ─── 2. RENDER CONTEMPORARY STUDIO (Product, Tech & Design) ───────────────────
function renderModernBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const softSkills = p.softSkills ?? [];
  const tools = p.tools ?? [];
  const hardAndTools = [...hardSkills, ...tools];

  const initials = escapeHtml(
    (p.fullName ?? "?")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CV"
  );

  const avatarSrc = p.avatarUrl ? safeAvatarUrl(p.avatarUrl) : null;
  const avatarHtml = avatarSrc
    ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(p.fullName)}" class="mod-avatar-img" />`
    : `<div class="mod-avatar-initials">${initials}</div>`;

  const contactItems: string[] = [];
  if (p.email) contactItems.push(`<div class="mod-contact-row">${SVG_ICONS.mail}<span>${escapeHtml(p.email)}</span></div>`);
  if (p.phone) contactItems.push(`<div class="mod-contact-row">${SVG_ICONS.phone}<span>${escapeHtml(p.phone)}</span></div>`);
  if (p.location) contactItems.push(`<div class="mod-contact-row">${SVG_ICONS.pin}<span>${escapeHtml(p.location)}</span></div>`);
  if (p.portfolio.length) {
    contactItems.push(`<div class="mod-contact-row">${SVG_ICONS.globe}<span>${portfolioLink(p.portfolio[0])}</span></div>`);
  }

  const expItemsHtml = p.experience.length
    ? `<div class="mod-section">
        <div class="mod-sec-title">Pengalaman Kerja</div>
        <div class="mod-timeline">
          ${p.experience
            .map(
              (e) => `
            <div class="mod-timeline-item page-break-avoid">
              <div class="mod-timeline-node"></div>
              <div class="mod-exp-header">
                <div class="mod-exp-role">${escapeHtml(e.role)}</div>
                <div class="mod-exp-dates">${escapeHtml(e.dates)}</div>
              </div>
              <div class="mod-exp-company">${escapeHtml(e.company)}${e.employmentType ? ` &bull; <span class="mod-exp-type">${escapeHtml(e.employmentType)}</span>` : ""}</div>
              ${e.description ? `<div class="mod-exp-desc">${escapeHtml(e.description)}</div>` : ""}
              ${
                e.achievements?.length
                  ? `<ul class="mod-bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
                  : ""
              }
            </div>`
            )
            .join("")}
        </div>
      </div>`
    : "";

  const eduItemsHtml = p.education.length
    ? `<div class="mod-aside-section page-break-avoid">
        <div class="mod-aside-title">Pendidikan</div>
        ${p.education
          .map(
            (e) => `
          <div class="mod-edu-item page-break-avoid">
            <div class="mod-edu-degree">${e.level ? `${escapeHtml(e.level)} ` : ""}${escapeHtml(e.program)}</div>
            <div class="mod-edu-school">${escapeHtml(e.school)}</div>
            <div class="mod-edu-meta">${escapeHtml(e.dates || "")}${e.gpa ? ` &bull; IPK ${escapeHtml(e.gpa)}` : ""}</div>
          </div>`
          )
          .join("")}
      </div>`
    : "";

  const certItemsHtml = p.certifications?.length
    ? `<div class="mod-aside-section page-break-avoid">
        <div class="mod-aside-title">Sertifikasi</div>
        <div class="mod-cert-list">
          ${p.certifications.map((c) => `<div class="mod-cert-item">${SVG_ICONS.award}<span>${escapeHtml(c)}</span></div>`).join("")}
        </div>
      </div>`
    : "";

  const skillsHtml = hardAndTools.length
    ? `<div class="mod-aside-section page-break-avoid">
        <div class="mod-aside-title">Keahlian &amp; Tools</div>
        <div class="mod-tags">
          ${hardAndTools.map((s) => `<span class="mod-tag">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const softSkillsHtml = softSkills.length
    ? `<div class="mod-aside-section page-break-avoid">
        <div class="mod-aside-title">Kompetensi Inti</div>
        <div class="mod-tags">
          ${softSkills.map((s) => `<span class="mod-tag mod-tag-soft">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const extraPortfolioHtml = p.portfolio.length > 1
    ? `<div class="mod-aside-section page-break-avoid">
        <div class="mod-aside-title">Portofolio</div>
        <div class="mod-portfolio-list">
          ${p.portfolio.map((u) => `<div class="mod-portfolio-item">${portfolioLink(u)}${SVG_ICONS.external}</div>`).join("")}
        </div>
      </div>`
    : "";

  return `
  <div class="mod-doc">
    <header class="mod-header page-break-avoid">
      <div class="mod-header-left">
        <h1 class="mod-name">${escapeHtml(p.fullName || "Nama Lengkap")}</h1>
        <div class="mod-headline-badge">${escapeHtml(getCvDisplayRole(p) || "Profesional")}</div>
      </div>
      <div class="mod-header-avatar">${avatarHtml}</div>
    </header>

    <div class="mod-body">
      <aside class="mod-sidebar">
        <div class="mod-aside-section page-break-avoid">
          <div class="mod-aside-title">Kontak</div>
          <div class="mod-contact-list">${contactItems.join("")}</div>
        </div>
        ${eduItemsHtml}
        ${certItemsHtml}
        ${skillsHtml}
        ${softSkillsHtml}
        ${extraPortfolioHtml}
      </aside>

      <main class="mod-main">
        ${p.about ? `
        <div class="mod-section page-break-avoid">
          <div class="mod-sec-title">Tentang Saya</div>
          <p class="mod-about">${escapeHtml(p.about)}</p>
        </div>` : ""}

        ${expItemsHtml}
      </main>
    </div>
  </div>
`;
}

// ─── 3. RENDER TECHNICAL ARCHITECTURE (Engineering, Systems & Data) ───────────
function renderSidebarBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const tools = p.tools ?? [];
  const softSkills = p.softSkills ?? [];

  const contactItems: string[] = [];
  if (p.email) contactItems.push(`<div class="tech-contact-row">${SVG_ICONS.mail}<span>${escapeHtml(p.email)}</span></div>`);
  if (p.phone) contactItems.push(`<div class="tech-contact-row">${SVG_ICONS.phone}<span>${escapeHtml(p.phone)}</span></div>`);
  if (p.location) contactItems.push(`<div class="tech-contact-row">${SVG_ICONS.pin}<span>${escapeHtml(p.location)}</span></div>`);
  if (p.portfolio.length) {
    contactItems.push(`<div class="tech-contact-row">${SVG_ICONS.globe}<span>${portfolioLink(p.portfolio[0])}</span></div>`);
  }

  const hardSkillsHtml = hardSkills.length
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">CORE COMPETENCIES</div>
        <div class="tech-pill-grid">
          ${hardSkills.map((s) => `<span class="tech-pill">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const toolsHtml = tools.length
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">TOOLS &amp; PLATFORMS</div>
        <div class="tech-pill-grid">
          ${tools.map((s) => `<span class="tech-pill tech-pill-tool">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const softSkillsHtml = softSkills.length
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">LEADERSHIP &amp; PRACTICES</div>
        <div class="tech-pill-grid">
          ${softSkills.map((s) => `<span class="tech-pill tech-pill-soft">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const eduHtml = p.education.length
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">PENDIDIKAN</div>
        ${p.education
          .map(
            (e) => `
          <div class="tech-edu-block">
            <div class="tech-edu-degree">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.program)}</div>
            <div class="tech-edu-school">${escapeHtml(e.school)}</div>
            <div class="tech-edu-date">${escapeHtml(e.dates || "")}${e.gpa ? ` &bull; IPK: ${escapeHtml(e.gpa)}` : ""}</div>
          </div>`
          )
          .join("")}
      </div>`
    : "";

  const certHtml = p.certifications?.length
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">SERTIFIKASI</div>
        ${p.certifications.map((c) => `<div class="tech-cert-row">${SVG_ICONS.award}<span>${escapeHtml(c)}</span></div>`).join("")}
      </div>`
    : "";

  const linksHtml = p.portfolio.length > 1
    ? `<div class="tech-side-group page-break-avoid">
        <div class="tech-side-label">REPOSITORI &amp; TAUTAN</div>
        ${p.portfolio.map((u) => `<div class="tech-cert-row">${SVG_ICONS.globe}<span>${portfolioLink(u)}</span></div>`).join("")}
      </div>`
    : "";

  const expHtml = p.experience.length
    ? `<div class="tech-section">
        <div class="tech-sec-title">PENGALAMAN REKAYASA &amp; PROFESIONAL</div>
        ${p.experience
          .map(
            (e) => `
          <div class="tech-exp-item page-break-avoid">
            <div class="tech-exp-row">
              <div>
                <span class="tech-exp-role">${escapeHtml(e.role)}</span>
                <span class="tech-exp-sep">&mdash;</span>
                <span class="tech-exp-company">${escapeHtml(e.company)}</span>
                ${e.employmentType ? `<span class="tech-type-tag">${escapeHtml(e.employmentType)}</span>` : ""}
              </div>
              <div class="tech-exp-dates">${escapeHtml(e.dates)}</div>
            </div>
            ${e.description ? `<div class="tech-exp-desc">${escapeHtml(e.description)}</div>` : ""}
            ${
              e.achievements?.length
                ? `<ul class="tech-bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
                : ""
            }
          </div>`
          )
          .join("")}
      </div>`
    : "";

  return `
  <div class="tech-doc">
    <div class="tech-layout">
      <aside class="tech-sidebar">
        <div class="tech-brand-header page-break-avoid">
          <div class="tech-name">${escapeHtml(p.fullName || "Nama Lengkap")}</div>
          <div class="tech-role">${escapeHtml(getCvDisplayRole(p) || "Software Engineer")}</div>
        </div>

        <div class="tech-side-group page-break-avoid">
          <div class="tech-side-label">KONTAK</div>
          <div class="tech-contact-list">${contactItems.join("")}</div>
        </div>

        ${hardSkillsHtml}
        ${toolsHtml}
        ${softSkillsHtml}
        ${eduHtml}
        ${certHtml}
        ${linksHtml}
      </aside>

      <main class="tech-main">
        ${p.about ? `
        <div class="tech-section page-break-avoid">
          <div class="tech-sec-title">RINGKASAN TEKNIKAL</div>
          <div class="tech-about">${escapeHtml(p.about)}</div>
        </div>` : ""}

        ${expHtml}
      </main>
    </div>
  </div>
`;
}

// ─── 4. RENDER EDITORIAL SWISS (Consulting & Executive Advisory) ───────────────
function renderMinimalBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const tools = p.tools ?? [];
  const softSkills = p.softSkills ?? [];
  const allSkills = [...hardSkills, ...tools];

  const contactList: string[] = [];
  if (p.email) contactList.push(`<div>${escapeHtml(p.email)}</div>`);
  if (p.phone) contactList.push(`<div>${escapeHtml(p.phone)}</div>`);
  if (p.location) contactList.push(`<div>${escapeHtml(p.location)}</div>`);
  if (p.portfolio.length) {
    contactList.push(`<div>${portfolioLink(p.portfolio[0])}</div>`);
  }

  const expRows = p.experience
    .map(
      (e) => `
    <div class="swiss-row page-break-avoid">
      <div class="swiss-gutter">${escapeHtml(e.dates)}</div>
      <div class="swiss-content">
        <div class="swiss-item-title">${escapeHtml(e.role)}</div>
        <div class="swiss-item-sub">${escapeHtml(e.company)}${e.employmentType ? ` &bull; ${escapeHtml(e.employmentType)}` : ""}</div>
        ${e.description ? `<div class="swiss-item-desc">${escapeHtml(e.description)}</div>` : ""}
        ${
          e.achievements?.length
            ? `<ul class="swiss-bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
            : ""
        }
      </div>
    </div>`
    )
    .join("");

  const eduRows = p.education
    .map(
      (e) => `
    <div class="swiss-row page-break-avoid">
      <div class="swiss-gutter">${escapeHtml(e.dates || "")}</div>
      <div class="swiss-content">
        <div class="swiss-item-title">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.school)}</div>
        <div class="swiss-item-sub">${escapeHtml(e.program)}${e.gpa ? ` &bull; Indeks Prestasi: ${escapeHtml(e.gpa)}` : ""}</div>
      </div>
    </div>`
    )
    .join("");

  const certRows = p.certifications?.length
    ? `<div class="swiss-section page-break-avoid">
        <div class="swiss-label">SERTIFIKASI &amp; AKREDITASI</div>
        <div class="swiss-row">
          <div class="swiss-gutter">Lisensi</div>
          <div class="swiss-content">
            <ul class="swiss-bullets">
              ${p.certifications.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>`
    : "";

  const skillsRows = allSkills.length || softSkills.length
    ? `<div class="swiss-section page-break-avoid">
        <div class="swiss-label">KOMPETENSI &amp; KEAHLIAN</div>
        ${allSkills.length ? `
        <div class="swiss-row">
          <div class="swiss-gutter">Keahlian</div>
          <div class="swiss-content swiss-skill-line">${allSkills.map(escapeHtml).join(" &bull; ")}</div>
        </div>` : ""}
        ${softSkills.length ? `
        <div class="swiss-row">
          <div class="swiss-gutter">Praktik</div>
          <div class="swiss-content swiss-skill-line">${softSkills.map(escapeHtml).join(" &bull; ")}</div>
        </div>` : ""}
      </div>`
    : "";

  const extraPortfolio = p.portfolio.length > 1
    ? `<div class="swiss-section page-break-avoid">
        <div class="swiss-label">PUBLIKASI &amp; PORTOFOLIO</div>
        <div class="swiss-row">
          <div class="swiss-gutter">Tautan</div>
          <div class="swiss-content">
            <ul class="swiss-bullets">
              ${p.portfolio.map((u) => `<li>${portfolioLink(u)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>`
    : "";

  return `
  <div class="swiss-doc">
    <header class="swiss-header page-break-avoid">
      <div class="swiss-header-left">
        <h1 class="swiss-name">${escapeHtml(p.fullName || "Nama Lengkap")}</h1>
        ${getCvDisplayRole(p) ? `<div class="swiss-headline">${escapeHtml(getCvDisplayRole(p))}</div>` : ""}
      </div>
      <div class="swiss-header-right">${contactList.join("")}</div>
    </header>

    <div class="swiss-rule"></div>

    ${p.about ? `
    <div class="swiss-section page-break-avoid">
      <div class="swiss-label">PROFIL RINGKAS</div>
      <div class="swiss-row">
        <div class="swiss-gutter">Ikhtisar</div>
        <div class="swiss-content swiss-about">${escapeHtml(p.about)}</div>
      </div>
    </div>` : ""}

    ${p.experience.length ? `
    <div class="swiss-section">
      <div class="swiss-label">PENGALAMAN PROFESIONAL</div>
      ${expRows}
    </div>` : ""}

    ${p.education.length ? `
    <div class="swiss-section">
      <div class="swiss-label">RIWAYAT PENDIDIKAN</div>
      ${eduRows}
    </div>` : ""}

    ${certRows}
    ${skillsRows}
    ${extraPortfolio}
  </div>
`;
}

// ─── Theme Registry with Pure CSS Definitions ────────────────────────────────
const themes: Record<CvTemplateId, { css: string; body: (p: CvProfile) => string }> = {
  // 1. Executive ATS Classic
  ats: {
    css: `
      .ats-doc {
        padding: 16mm 18mm;
        font-family: 'Merriweather', Georgia, 'Times New Roman', serif;
        font-size: 10pt;
        color: #111827;
        line-height: 1.5;
      }
      .ats-header {
        text-align: center;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1.5px solid #111827;
      }
      .ats-name {
        font-size: 19pt;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: #0F172A;
        text-transform: uppercase;
        margin-bottom: 3px;
      }
      .ats-headline {
        font-size: 10pt;
        font-weight: 400;
        font-style: italic;
        color: #475569;
        margin-bottom: 6px;
      }
      .ats-contact {
        font-size: 8.5pt;
        color: #374151;
        letter-spacing: 0.2px;
      }
      .ats-section {
        margin-top: 13px;
        margin-bottom: 9px;
      }
      .ats-section-title {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: #0F172A;
        border-bottom: 1px solid #111827;
        padding-bottom: 2px;
        margin-bottom: 7px;
      }
      .ats-summary {
        font-size: 9pt;
        line-height: 1.55;
        color: #1F2937;
      }
      .ats-item {
        margin-bottom: 9px;
      }
      .ats-item-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 9.5pt;
      }
      .ats-item-left {
        flex: 1;
        min-width: 0;
      }
      .ats-role {
        font-weight: 700;
        color: #0F172A;
      }
      .ats-company-sep {
        margin: 0 4px;
        color: #9CA3AF;
      }
      .ats-company {
        font-weight: 400;
        color: #374151;
      }
      .ats-dates {
        font-size: 8.5pt;
        color: #4B5563;
        font-weight: 500;
        white-space: nowrap;
        margin-left: 12px;
      }
      .ats-item-desc {
        font-size: 8.5pt;
        color: #374151;
        margin-top: 2px;
        line-height: 1.45;
      }
      .ats-gpa {
        font-style: italic;
      }
      .ats-bullets {
        margin: 3px 0 2px 18px;
        padding: 0;
        list-style-type: disc;
      }
      .ats-bullets li {
        font-size: 8.5pt;
        color: #374151;
        line-height: 1.45;
        margin-bottom: 2px;
      }
      .ats-skills-body {
        font-size: 8.5pt;
        line-height: 1.6;
        color: #1F2937;
      }
    `,
    body: renderAtsBody,
  },

  // 2. Contemporary Studio
  modern: {
    css: `
      .mod-doc {
        padding: 16mm 18mm;
        font-family: 'Plus Jakarta Sans', Inter, -apple-system, sans-serif;
        font-size: 9pt;
        color: #1E293B;
        line-height: 1.5;
        background: #FFFFFF;
      }
      .mod-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1.5px solid #E2E8F0;
        padding-bottom: 14px;
        margin-bottom: 18px;
      }
      .mod-header-left {
        flex: 1;
        min-width: 0;
      }
      .mod-name {
        font-size: 19pt;
        font-weight: 800;
        letter-spacing: -0.5px;
        color: #0F172A;
        line-height: 1.15;
        margin-bottom: 4px;
      }
      .mod-headline-badge {
        display: inline-block;
        font-size: 8.5pt;
        font-weight: 600;
        color: #6D28D9;
        background: #F5F3FF;
        border: 1px solid #DDD6FE;
        border-radius: 9999px;
        padding: 2px 10px;
        margin-top: 2px;
      }
      .mod-header-avatar {
        margin-left: 18px;
        flex-shrink: 0;
      }
      .mod-avatar-img {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        object-fit: cover;
        border: 2px solid #EDE9FE;
        box-shadow: 0 2px 8px rgba(109,40,217,0.08);
      }
      .mod-avatar-initials {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        background: linear-gradient(135deg, #7C3AED, #4F46E5);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18pt;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(109,40,217,0.12);
      }
      .mod-body {
        display: flex;
        gap: 22px;
      }
      .mod-sidebar {
        width: 170px;
        flex-shrink: 0;
      }
      .mod-main {
        flex: 1;
        min-width: 0;
      }
      .mod-aside-section {
        margin-bottom: 14px;
      }
      .mod-aside-title {
        font-size: 7.5pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: #6D28D9;
        margin-bottom: 5px;
        border-bottom: 1px solid #EDE9FE;
        padding-bottom: 2px;
      }
      .mod-contact-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .mod-contact-row {
        font-size: 8pt;
        color: #475569;
        display: flex;
        align-items: center;
        word-break: break-all;
      }
      .mod-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }
      .mod-tag {
        font-size: 7.5pt;
        font-weight: 500;
        color: #334155;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 4px;
        padding: 1.5px 5px;
      }
      .mod-tag-soft {
        color: #047857;
        background: #ECFDF5;
        border-color: #A7F3D0;
      }
      .mod-edu-item {
        margin-bottom: 7px;
      }
      .mod-edu-degree {
        font-size: 8pt;
        font-weight: 700;
        color: #0F172A;
      }
      .mod-edu-school {
        font-size: 7.5pt;
        color: #475569;
      }
      .mod-edu-meta {
        font-size: 7pt;
        color: #94A3B8;
      }
      .mod-cert-list, .mod-portfolio-list {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .mod-cert-item, .mod-portfolio-item {
        font-size: 7.5pt;
        color: #334155;
        display: flex;
        align-items: center;
        word-break: break-all;
      }
      .mod-section {
        margin-bottom: 16px;
      }
      .mod-sec-title {
        font-size: 9.5pt;
        font-weight: 800;
        letter-spacing: 0.5px;
        color: #0F172A;
        border-bottom: 1.5px solid #F1F5F9;
        padding-bottom: 3px;
        margin-bottom: 8px;
      }
      .mod-about {
        font-size: 8.5pt;
        line-height: 1.55;
        color: #334155;
      }
      .mod-timeline {
        position: relative;
        padding-left: 14px;
        border-left: 1.5px solid #E2E8F0;
        margin-left: 4px;
      }
      .mod-timeline-item {
        position: relative;
        margin-bottom: 12px;
      }
      .mod-timeline-node {
        position: absolute;
        left: -19px;
        top: 4px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #7C3AED;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 0 1px #DDD6FE;
      }
      .mod-exp-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .mod-exp-role {
        font-size: 9pt;
        font-weight: 700;
        color: #0F172A;
      }
      .mod-exp-dates {
        font-size: 7.5pt;
        font-weight: 500;
        color: #64748B;
        white-space: nowrap;
      }
      .mod-exp-company {
        font-size: 8pt;
        font-weight: 500;
        color: #475569;
        margin-top: 1px;
        margin-bottom: 2px;
      }
      .mod-exp-type {
        color: #64748B;
        font-weight: 400;
      }
      .mod-exp-desc {
        font-size: 8pt;
        line-height: 1.45;
        color: #475569;
        margin-bottom: 2px;
      }
      .mod-bullets {
        margin: 2px 0 0 14px;
        padding: 0;
        list-style-type: disc;
      }
      .mod-bullets li {
        font-size: 8pt;
        line-height: 1.45;
        color: #475569;
        margin-bottom: 2px;
      }
    `,
    body: renderModernBody,
  },

  // 3. Technical Architecture
  sidebar: {
    css: `
      .tech-doc {
        min-height: 100vh;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        font-size: 9pt;
        color: #1E293B;
        line-height: 1.5;
        background: #FFFFFF;
      }
      .tech-layout {
        display: flex;
        min-height: 100vh;
      }
      .tech-sidebar {
        width: 190px;
        background: #F8FAFC;
        border-right: 1.5px solid #E2E8F0;
        padding: 16mm 14px 16mm 16mm;
        flex-shrink: 0;
      }
      .tech-main {
        flex: 1;
        padding: 16mm 16mm 16mm 18px;
        min-width: 0;
      }
      .tech-brand-header {
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1.5px solid #E2E8F0;
      }
      .tech-name {
        font-size: 13.5pt;
        font-weight: 800;
        letter-spacing: -0.3px;
        color: #0F172A;
        line-height: 1.2;
      }
      .tech-role {
        font-size: 8pt;
        font-family: 'JetBrains Mono', monospace;
        color: #7C3AED;
        font-weight: 600;
        margin-top: 3px;
      }
      .tech-side-group {
        margin-bottom: 13px;
      }
      .tech-side-label {
        font-size: 7pt;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        letter-spacing: 0.8px;
        color: #475569;
        margin-bottom: 4px;
        text-transform: uppercase;
      }
      .tech-contact-list {
        display: flex;
        flex-direction: column;
        gap: 3.5px;
      }
      .tech-contact-row {
        font-size: 7.5pt;
        color: #475569;
        display: flex;
        align-items: center;
        word-break: break-all;
      }
      .tech-pill-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
      }
      .tech-pill {
        font-size: 7pt;
        font-family: 'JetBrains Mono', monospace;
        color: #0F172A;
        background: #FFFFFF;
        border: 1px solid #CBD5E1;
        border-radius: 3px;
        padding: 1px 4px;
        font-weight: 500;
      }
      .tech-pill-tool {
        background: #F1F5F9;
        color: #334155;
      }
      .tech-pill-soft {
        background: #F5F3FF;
        color: #6D28D9;
        border-color: #DDD6FE;
      }
      .tech-edu-block {
        margin-bottom: 6px;
      }
      .tech-edu-degree {
        font-size: 7.5pt;
        font-weight: 700;
        color: #0F172A;
      }
      .tech-edu-school {
        font-size: 7pt;
        color: #475569;
      }
      .tech-edu-date {
        font-size: 6.5pt;
        font-family: 'JetBrains Mono', monospace;
        color: #64748B;
      }
      .tech-cert-row {
        font-size: 7pt;
        color: #334155;
        display: flex;
        align-items: center;
        margin-bottom: 2px;
        word-break: break-all;
      }
      .tech-section {
        margin-bottom: 16px;
      }
      .tech-sec-title {
        font-size: 8.5pt;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 700;
        letter-spacing: 0.8px;
        color: #0F172A;
        border-bottom: 1.5px solid #0F172A;
        padding-bottom: 3px;
        margin-bottom: 8px;
        text-transform: uppercase;
      }
      .tech-about {
        font-size: 8pt;
        line-height: 1.55;
        color: #334155;
      }
      .tech-exp-item {
        margin-bottom: 11px;
      }
      .tech-exp-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
      }
      .tech-exp-role {
        font-size: 8.5pt;
        font-weight: 700;
        color: #0F172A;
      }
      .tech-exp-sep {
        margin: 0 4px;
        color: #94A3B8;
      }
      .tech-exp-company {
        font-size: 8pt;
        font-weight: 600;
        color: #475569;
      }
      .tech-type-tag {
        font-size: 6.5pt;
        font-family: 'JetBrains Mono', monospace;
        background: #F1F5F9;
        border: 1px solid #E2E8F0;
        border-radius: 2px;
        padding: 0.5px 3px;
        margin-left: 3px;
        color: #64748B;
      }
      .tech-exp-dates {
        font-size: 7pt;
        font-family: 'JetBrains Mono', monospace;
        color: #64748B;
        white-space: nowrap;
      }
      .tech-exp-desc {
        font-size: 8pt;
        color: #475569;
        line-height: 1.45;
        margin-top: 2px;
      }
      .tech-bullets {
        margin: 2px 0 0 14px;
        padding: 0;
        list-style-type: disc;
      }
      .tech-bullets li {
        font-size: 7.5pt;
        color: #334155;
        line-height: 1.45;
        margin-bottom: 2px;
      }
    `,
    body: renderSidebarBody,
  },

  // 4. Editorial Swiss
  minimal: {
    css: `
      .swiss-doc {
        padding: 16mm 18mm;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        font-size: 9pt;
        color: #111827;
        line-height: 1.5;
        background: #FFFFFF;
      }
      .swiss-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        padding-bottom: 10px;
      }
      .swiss-header-left {
        flex: 1;
      }
      .swiss-name {
        font-size: 20pt;
        font-weight: 800;
        letter-spacing: -0.8px;
        color: #000000;
        line-height: 1.1;
      }
      .swiss-headline {
        font-size: 9.5pt;
        font-weight: 500;
        color: #4B5563;
        margin-top: 3px;
        letter-spacing: 0.2px;
      }
      .swiss-header-right {
        text-align: right;
        font-size: 8pt;
        color: #4B5563;
        line-height: 1.45;
        margin-left: 20px;
        flex-shrink: 0;
      }
      .swiss-rule {
        width: 100%;
        height: 2px;
        background: #000000;
        margin-bottom: 14px;
      }
      .swiss-section {
        margin-bottom: 13px;
      }
      .swiss-label {
        font-size: 7.5pt;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #6B7280;
        text-transform: uppercase;
        margin-bottom: 6px;
      }
      .swiss-row {
        display: flex;
        margin-bottom: 7px;
      }
      .swiss-gutter {
        width: 88px;
        flex-shrink: 0;
        font-size: 7.5pt;
        font-weight: 600;
        color: #6B7280;
        letter-spacing: 0.2px;
        padding-top: 1px;
      }
      .swiss-content {
        flex: 1;
        min-width: 0;
      }
      .swiss-about {
        font-size: 8.5pt;
        line-height: 1.55;
        color: #1F2937;
      }
      .swiss-item-title {
        font-size: 9pt;
        font-weight: 700;
        color: #000000;
      }
      .swiss-item-sub {
        font-size: 8pt;
        font-weight: 500;
        color: #4B5563;
        margin-bottom: 2px;
      }
      .swiss-item-desc {
        font-size: 8pt;
        color: #374151;
        line-height: 1.45;
        margin-top: 2px;
      }
      .swiss-bullets {
        margin: 2px 0 0 14px;
        padding: 0;
        list-style-type: square;
      }
      .swiss-bullets li {
        font-size: 8pt;
        color: #374151;
        line-height: 1.45;
        margin-bottom: 2px;
      }
      .swiss-skill-line {
        font-size: 8pt;
        color: #1F2937;
        line-height: 1.5;
      }
    `,
    body: renderMinimalBody,
  },
};

export function buildCvHtml(profile: CvProfile, templateId: CvTemplateId): string {
  const theme = themes[templateId] ?? themes.ats;
  return html(profile, theme.css, theme.body(profile));
}
