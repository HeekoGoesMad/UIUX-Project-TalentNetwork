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

const portfolioLink = (u: string): string =>
  `<a href="${escapeHtml(safeUrl(u))}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:underline;text-underline-offset:2px;">${escapeHtml(u)}</a>`;

const commonPrintCss = `
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
  body { width: 100%; min-height: 100vh; background: #FFFFFF; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
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

// ─── Render ATS Body ────────────────────────────────────────────────────────
function renderAtsBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const softSkills = p.softSkills ?? [];
  const hardAndTools = [...hardSkills, ...p.tools];

  const expItemsHtml = p.experience
    .map((e) => {
      const empType = e.employmentType ? ` (${escapeHtml(e.employmentType)})` : "";
      const descHtml = e.description ? `<div class="item-desc">${escapeHtml(e.description)}</div>` : "";
      const achHtml = e.achievements?.length
        ? `<ul class="bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
        : "";
      return `
      <div class="item-block page-break-avoid">
        <div class="item-header">
          <span class="item-title">${escapeHtml(e.role)}${empType} — <strong>${escapeHtml(e.company)}</strong></span>
          <span class="item-date">${escapeHtml(e.dates)}</span>
        </div>
        ${descHtml}
        ${achHtml}
      </div>`;
    })
    .join("");

  const eduItemsHtml = p.education
    .map((e) => {
      const levelPrefix = e.level ? `${escapeHtml(e.level)} ` : "";
      const gpaHtml = e.gpa ? `<div class="item-desc">IPK: ${escapeHtml(e.gpa)}</div>` : "";
      return `
      <div class="item-block page-break-avoid">
        <div class="item-header">
          <span class="item-title">${levelPrefix}<strong>${escapeHtml(e.program)}</strong>, ${escapeHtml(e.school)}</span>
          <span class="item-date">${escapeHtml(e.dates || "")}</span>
        </div>
        ${gpaHtml}
      </div>`;
    })
    .join("");

  const softSkillsHtml = softSkills.length
    ? `<div style="flex:1">
        <div style="font-weight:bold;margin-bottom:3px">Soft Skills:</div>
        <ul class="bullets">${softSkills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>`
    : "";

  const hardSkillsHtml = hardAndTools.length
    ? `<div style="flex:1">
        <div style="font-weight:bold;margin-bottom:3px">Hard Skills &amp; Tools:</div>
        <ul class="bullets">${hardAndTools.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>`
    : "";

  const skillsSectionHtml =
    softSkillsHtml || hardSkillsHtml
      ? `<div class="section-title page-break-avoid">KETERAMPILAN</div>
         <div class="skills-grid page-break-avoid">${hardSkillsHtml}${softSkillsHtml}</div>`
      : "";

  const portfolioSectionHtml = p.portfolio.length
    ? `<div class="section-title page-break-avoid">PORTFOLIO &amp; TAUTAN</div>
       <ul class="bullets page-break-avoid">${p.portfolio.map((u) => `<li>${portfolioLink(u)}</li>`).join("")}</ul>`
    : "";

  const contactParts: string[] = [];
  if (p.email) contactParts.push(escapeHtml(p.email));
  if (p.phone) contactParts.push(escapeHtml(p.phone));
  if (p.location) contactParts.push(escapeHtml(p.location));

  return `
  <div class="ats-doc">
    <div class="header">
      <h1>${escapeHtml(p.fullName || "Nama Lengkap")}</h1>
      ${p.headline || p.targetRole ? `<div class="headline">${escapeHtml(p.targetRole || p.headline || "")}</div>` : ""}
      <div class="contact">${contactParts.join(" &bull; ")}</div>
    </div>

    ${p.about ? `<div class="section-title page-break-avoid">RINGKASAN PROFESIONAL</div><div class="summary page-break-avoid">${escapeHtml(p.about)}</div>` : ""}

    ${p.experience.length ? `<div class="section-title page-break-avoid">PENGALAMAN KERJA</div>${expItemsHtml}` : ""}

    ${p.education.length ? `<div class="section-title page-break-avoid">PENDIDIKAN</div>${eduItemsHtml}` : ""}

    ${skillsSectionHtml}

    ${portfolioSectionHtml}
  </div>
`;
}

// ─── Render Creative / Modern Body ──────────────────────────────────────────
function renderModernBody(p: CvProfile): string {
  const hardSkills = p.hardCompetencies?.length ? p.hardCompetencies : p.skills;
  const softSkills = p.softSkills ?? [];
  const hardAndTools = [...hardSkills, ...p.tools];
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
    ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(p.fullName)}" style="width:108px;height:108px;border-radius:50%;object-fit:cover;display:inline-block;box-shadow:0 3px 12px rgba(0,0,0,0.12);border:3px solid #FFFFFF;" />`
    : `<div style="width:108px;height:108px;border-radius:50%;background:linear-gradient(135deg,#1E293B,#334155);color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;letter-spacing:1px;box-shadow:0 3px 12px rgba(0,0,0,0.12);border:3px solid #FFFFFF;">${initials}</div>`;

  const contactHtml = `
    <div style="margin-bottom:22px;font-size:10.5px;color:#475569;line-height:1.65">
      ${p.phone ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:12px">📞</span><span>${escapeHtml(p.phone)}</span></div>` : ""}
      ${p.email ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;word-break:break-all"><span style="font-size:12px">✉️</span><span>${escapeHtml(p.email)}</span></div>` : ""}
      ${p.portfolio.length ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;word-break:break-all"><span style="font-size:12px">🌐</span><span>${portfolioLink(p.portfolio[0])}</span></div>` : ""}
      ${p.location ? `<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px">📍</span><span>${escapeHtml(p.location)}</span></div>` : ""}
    </div>`;

  const eduItemsHtml = p.education.length
    ? `<div style="margin-bottom:22px" class="page-break-avoid">
        <div class="sec-title-left">PENDIDIKAN</div>
        ${p.education
          .map(
            (e) => `
          <div style="margin-bottom:10px" class="page-break-avoid">
            <div style="font-weight:700;font-size:11px;color:#0F172A">${e.level ? `${escapeHtml(e.level)} ` : ""}${escapeHtml(e.program)}</div>
            <div style="font-size:10.5px;color:#475569">${escapeHtml(e.school)}</div>
            <div style="font-size:9.5px;color:#94A3B8">${escapeHtml(e.dates || "")}${e.gpa ? ` &bull; IPK ${escapeHtml(e.gpa)}` : ""}</div>
          </div>`
          )
          .join("")}
      </div>`
    : "";

  const expertiseHtml = hardAndTools.length
    ? `<div style="margin-bottom:22px" class="page-break-avoid">
        <div class="sec-title-left">KEAHLIAN &amp; TOOLS</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${hardAndTools.map((s) => `<span style="display:inline-block;font-size:9.5px;color:#1E293B;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:6px;padding:2px 6px;font-weight:500;">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const softSkillsHtml = softSkills.length
    ? `<div style="margin-bottom:20px" class="page-break-avoid">
        <div class="sec-title-left">KOMPETENSI</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${softSkills.map((s) => `<span style="display:inline-block;font-size:9.5px;color:#065F46;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:6px;padding:2px 6px;font-weight:500;">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>`
    : "";

  const experienceTimelineHtml = p.experience.length
    ? `<div style="margin-bottom:22px">
        <div class="sec-title-right">PENGALAMAN KERJA</div>
        <div class="timeline-container">
          ${p.experience
            .map(
              (e) => `
            <div class="timeline-item page-break-avoid" style="position:relative;margin-bottom:16px;">
              <div class="timeline-node"></div>
              <div style="font-size:10px;font-weight:600;color:#64748B;margin-bottom:1px">
                ${escapeHtml(e.dates)}
              </div>
              <div style="font-size:12px;font-weight:700;color:#0F172A;">
                ${escapeHtml(e.role)}
              </div>
              <div style="font-size:10.5px;color:#475569;font-weight:500;margin-bottom:4px">
                ${escapeHtml(e.company)}${e.employmentType ? ` &bull; ${escapeHtml(e.employmentType)}` : ""}
              </div>
              ${e.description ? `<div style="font-size:10.5px;line-height:1.55;color:#475569;margin-bottom:4px">${escapeHtml(e.description)}</div>` : ""}
              ${
                e.achievements?.length
                  ? `<ul class="clean-bullets">${e.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>`
                  : ""
              }
            </div>`
            )
            .join("")}
        </div>
      </div>`
    : "";

  const portfolioHtml =
    p.portfolio.length > 0
      ? `<div class="page-break-avoid">
          <div class="sec-title-right">PORTFOLIO &amp; PROYEK</div>
          <div style="font-size:10.5px;color:#475569">
            ${p.portfolio.map((u) => `<div style="margin-bottom:3.5px">🔗 ${portfolioLink(u)}</div>`).join("")}
          </div>
        </div>`
      : "";

  return `
  <div class="top-banner"></div>
  <div class="container">
    <div class="col-left">
      <div class="avatar-wrap">${avatarHtml}</div>
      ${contactHtml}
      ${eduItemsHtml}
      ${expertiseHtml}
      ${softSkillsHtml}
    </div>

    <div class="col-right">
      <div style="margin-bottom:20px" class="page-break-avoid">
        <h1 class="name-title">${escapeHtml(p.fullName || "Nama Kandidat")}</h1>
        <div class="role-sub">${escapeHtml(p.targetRole || p.headline || "Profesional")}</div>
        <div class="divider-line"></div>
      </div>

      ${p.about ? `<div style="margin-bottom:22px" class="page-break-avoid"><div class="sec-title-right">TENTANG SAYA</div><p style="font-size:10.5px;line-height:1.65;color:#334155;text-align:justify">${escapeHtml(p.about)}</p></div>` : ""}

      ${experienceTimelineHtml}

      ${portfolioHtml}
    </div>
  </div>
`;
}

// ─── Theme Registry ─────────────────────────────────────────────────────────
const themes: Record<CvTemplateId, { css: string; body: (p: CvProfile) => string }> = {
  // 1. ATS Friendly (Sesuai Standar Mesin Screening ATS)
  ats: {
    css: `
      .ats-doc { padding: 18mm 20mm; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 11.5px; color: #111111; line-height: 1.45; }
      .header { text-align: center; margin-bottom: 12px; }
      h1 { font-size: 22px; font-weight: bold; margin-bottom: 2px; letter-spacing: 0.5px; text-transform: uppercase; }
      .headline { font-size: 12px; font-weight: 600; color: #222222; margin-bottom: 4px; }
      .contact { font-size: 10.5px; color: #333333; }
      .summary { font-size: 11px; color: #111111; text-align: justify; margin-bottom: 10px; line-height: 1.45; }
      .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #000000; padding-bottom: 2px; margin: 12px 0 6px; }
      .item-block { margin-bottom: 8px; }
      .item-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 11.5px; color: #000000; }
      .item-title { font-size: 11.5px; }
      .item-date { font-size: 11px; color: #333333; white-space: nowrap; text-align: right; }
      .item-desc { font-size: 11px; color: #222222; margin-top: 2px; line-height: 1.4; }
      .skills-grid { display: flex; gap: 32px; font-size: 11px; }
      ul.bullets { margin: 2px 0 4px 18px; padding: 0; list-style-type: disc; }
      ul.bullets li { margin-bottom: 2px; font-size: 11px; color: #222222; line-height: 1.4; }
    `,
    body: renderAtsBody,
  },

  // 2. Creative / Design Style (Top Pastel Banner + 2 Kolom + Timeline)
  modern: {
    css: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 11px; color: #1E293B; line-height: 1.5; background: #FFFFFF; }
      .top-banner { height: 28px; background: linear-gradient(90deg, #EBD6CB, #F5E8E0); width: 100%; margin-bottom: 20px; }
      .container { display: flex; padding: 0 28px 28px; gap: 28px; }
      .col-left { width: 185px; flex-shrink: 0; }
      .col-right { flex: 1; min-width: 0; }
      .avatar-wrap { text-align: center; margin-bottom: 18px; }
      .sec-title-left { font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #1E293B; margin-bottom: 8px; border-bottom: 1px solid #E2E8F0; padding-bottom: 3px; }
      .sec-title-right { font-size: 11.5px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #1E293B; margin-bottom: 8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 3px; }
      .name-title { font-size: 24px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #0F172A; line-height: 1.15; margin-bottom: 2px; }
      .role-sub { font-size: 12px; font-weight: 500; letter-spacing: 1px; color: #64748B; text-transform: capitalize; margin-bottom: 8px; }
      .divider-line { width: 100%; height: 1.5px; background: #CBD5E1; margin-bottom: 14px; }
      .timeline-container { position: relative; padding-left: 16px; border-left: 1.5px solid #CBD5E1; margin-left: 4px; }
      .timeline-node { position: absolute; left: -21px; top: 3px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid #64748B; background: #FFFFFF; }
      ul.clean-bullets { margin: 2px 0 0 14px; padding: 0; list-style-type: disc; }
      ul.clean-bullets li { font-size: 10.5px; color: #475569; margin-bottom: 2px; line-height: 1.45; }
    `,
    body: renderModernBody,
  },

  // 3. Sidebar Dark (Alternative)
  sidebar: {
    css: `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1E293B; line-height: 1.5; display: flex; min-height: 100vh; }
      .sidebar { width: 220px; background: #0F172A; color: white; padding: 24px 18px; flex-shrink: 0; }
      .avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#EC4899); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; color: white; margin: 0 auto 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); border: 2px solid rgba(255,255,255,0.2); }
      .name { font-size: 15px; font-weight: 800; color: white; text-align: center; line-height: 1.2; }
      .headline-side { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 3px; margin-bottom: 16px; }
      .sidebar-section { margin-bottom: 16px; }
      .sidebar-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #A78BFA; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 3px; }
      .contact-item { font-size: 10px; color: #CBD5E1; margin-bottom: 4px; word-break: break-all; }
      .main { flex: 1; padding: 24px 26px; background: white; }
      .main-section { margin-bottom: 18px; }
      .main-title { font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 3px; border-bottom: 1.5px solid #7C3AED; margin-bottom: 8px; }
      .about { font-size: 11px; color: #334155; line-height: 1.6; text-align: justify; }
    `,
    body: (p) => {
      const skillItems = [...p.skills, ...p.tools]
        .map((s) => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:5px;height:5px;background:#A78BFA;border-radius:50%;flex-shrink:0"></div><span style="font-size:10px;color:#E2E8F0">${escapeHtml(s)}</span></div>`)
        .join("");
      const initials = escapeHtml((p.fullName ?? "?").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "CV");
      const avatarSrc = p.avatarUrl ? safeAvatarUrl(p.avatarUrl) : null;
      const avatarMarkup = avatarSrc
        ? `<img src="${escapeHtml(avatarSrc)}" alt="Avatar" style="width:60px;height:60px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;box-shadow:0 4px 12px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.2);" />`
        : `<div class="avatar">${initials}</div>`;

      return `
  <div class="sidebar">
    ${avatarMarkup}
    <div class="name">${escapeHtml(p.fullName || "Nama Lengkap")}</div>
    <div class="headline-side">${escapeHtml(p.targetRole || p.headline || "")}</div>
    <div class="sidebar-section">
      <div class="sidebar-title">Kontak</div>
      ${p.email ? `<div class="contact-item">📧 ${escapeHtml(p.email)}</div>` : ""}
      ${p.phone ? `<div class="contact-item">📱 ${escapeHtml(p.phone)}</div>` : ""}
      ${p.location ? `<div class="contact-item">📍 ${escapeHtml(p.location)}</div>` : ""}
    </div>
    ${[...p.skills, ...p.tools].length ? `<div class="sidebar-section"><div class="sidebar-title">Keahlian &amp; Tools</div>${skillItems}</div>` : ""}
    ${p.education.length ? `<div class="sidebar-section"><div class="sidebar-title">Pendidikan</div>${p.education.map((e) => `<div style="margin-bottom:6px;font-size:10px"><div style="font-weight:600;color:#FFFFFF">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.school)}</div><div style="color:#94A3B8">${escapeHtml(e.program)}${e.dates ? ` &bull; ${escapeHtml(e.dates)}` : ""}</div></div>`).join("")}</div>` : ""}
  </div>
  <div class="main">
    ${p.about ? `<div class="main-section page-break-avoid"><div class="main-title">Profil Ringkas</div><div class="about">${escapeHtml(p.about)}</div></div>` : ""}
    ${p.experience.length ? `<div class="main-section"><div class="main-title">Pengalaman Kerja</div>${p.experience.map((e) => `<div class="page-break-avoid" style="margin-bottom:12px"><div style="font-weight:700;font-size:11.5px;color:#0F172A">${escapeHtml(e.role)} &mdash; ${escapeHtml(e.company)}</div><div style="font-size:10px;color:#64748B;margin-bottom:2px">${escapeHtml(e.dates)}</div>${e.description ? `<div style="font-size:10.5px;color:#475569;line-height:1.5">${escapeHtml(e.description)}</div>` : ""}</div>`).join("")}</div>` : ""}
    ${p.portfolio.length ? `<div class="main-section page-break-avoid"><div class="main-title">Portofolio &amp; Tautan</div>${p.portfolio.map((u) => `<div style="font-size:10.5px;color:#475569;margin-bottom:3px">🔗 ${portfolioLink(u)}</div>`).join("")}</div>` : ""}
  </div>
`;
    },
  },

  // 4. Minimal Elegant (Alternative)
  minimal: {
    css: `
      .minimal-doc { padding: 18mm 20mm; font-family: Georgia, 'Times New Roman', serif; font-size: 11.5px; color: #111; line-height: 1.55; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
      h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
      .headline { font-size: 11.5px; color: #555; font-style: italic; margin-top: 2px; }
      .contact { text-align: right; font-size: 10px; color: #555; line-height: 1.5; }
      .section { margin-bottom: 14px; }
      .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #555; margin-bottom: 6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 2px; }
      .about { font-size: 11px; color: #333; line-height: 1.6; margin-bottom: 12px; border-left: 2.5px solid #111; padding-left: 10px; text-align: justify; }
    `,
    body: (p) => {
      const exp = p.experience
        .map(
          (e) =>
            `<tr class="page-break-avoid"><td style="width:90px;vertical-align:top;padding-right:12px;font-size:10px;color:#666;padding-bottom:8px">${escapeHtml(e.dates)}</td><td style="vertical-align:top;padding-bottom:8px"><div style="font-weight:700;font-size:11.5px">${escapeHtml(e.role)}</div><div style="font-size:10.5px;color:#555">${escapeHtml(e.company)}</div>${e.description ? `<div style="font-size:10.5px;color:#444;margin-top:2px">${escapeHtml(e.description)}</div>` : ""}</td></tr>`
        )
        .join("");
      const edu = p.education
        .map(
          (e) =>
            `<tr class="page-break-avoid"><td style="width:90px;vertical-align:top;padding-right:12px;font-size:10px;color:#666;padding-bottom:6px">${escapeHtml(e.dates || "")}</td><td style="vertical-align:top;padding-bottom:6px"><div style="font-weight:700;font-size:11.5px">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.school)}</div><div style="font-size:10.5px;color:#555">${escapeHtml(e.program)}${e.gpa ? ` &bull; IPK: ${escapeHtml(e.gpa)}` : ""}</div></td></tr>`
        )
        .join("");
      return `
  <div class="minimal-doc">
    <div class="header">
      <div>
        <h1>${escapeHtml(p.fullName || "Nama Lengkap")}</h1>
        <div class="headline">${escapeHtml(p.targetRole || p.headline || "")}</div>
      </div>
      <div class="contact">
        ${p.email ? `<div>${escapeHtml(p.email)}</div>` : ""}
        ${p.phone ? `<div>${escapeHtml(p.phone)}</div>` : ""}
        ${p.location ? `<div>${escapeHtml(p.location)}</div>` : ""}
      </div>
    </div>
    ${p.about ? `<div class="about page-break-avoid">${escapeHtml(p.about)}</div>` : ""}
    ${p.experience.length ? `<div class="section"><div class="section-label">Pengalaman Kerja</div><table style="width:100%;border-collapse:collapse">${exp}</table></div>` : ""}
    ${p.education.length ? `<div class="section"><div class="section-label">Pendidikan</div><table style="width:100%;border-collapse:collapse">${edu}</table></div>` : ""}
    ${[...p.skills, ...p.tools].length ? `<div class="section page-break-avoid"><div class="section-label">Keahlian &amp; Tools</div><div style="font-size:11px;color:#333">${[...p.skills, ...p.tools].map(escapeHtml).join(" &bull; ")}</div></div>` : ""}
    ${p.portfolio.length ? `<div class="section page-break-avoid"><div class="section-label">Portofolio &amp; Tautan</div><div style="font-size:10.5px;color:#444">${p.portfolio.map((u) => `<div style="margin-bottom:3px">🔗 ${portfolioLink(u)}</div>`).join("")}</div></div>` : ""}
  </div>
`;
    },
  },
};

export function buildCvHtml(profile: CvProfile, templateId: CvTemplateId): string {
  const theme = themes[templateId] ?? themes.ats;
  return html(profile, theme.css, theme.body(profile));
}
