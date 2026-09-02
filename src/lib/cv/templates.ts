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

const portfolioLink = (u: string): string =>
  `<a href="${escapeHtml(safeUrl(u))}" style="color:inherit;text-decoration:none">${escapeHtml(u)}</a>`;

const html = (p: CvProfile, css: string, body: string): string =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>CV – ${escapeHtml(p.fullName)}</title><style>${css}</style></head><body>${body}</body></html>`;

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
      <div style="margin-bottom:8px">
        <div class="item-header">
          <span>${escapeHtml(e.role)}${empType}, ${escapeHtml(e.company)}</span>
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
      const gpaHtml = e.gpa ? `<ul class="bullets"><li>IPK: ${escapeHtml(e.gpa)}</li></ul>` : "";
      return `
      <div style="margin-bottom:6px">
        <div class="item-header">
          <span>${levelPrefix}${escapeHtml(e.program)}, ${escapeHtml(e.school)}</span>
          <span class="item-date">${escapeHtml(e.dates || "")}</span>
        </div>
        ${gpaHtml}
      </div>`;
    })
    .join("");

  const softSkillsHtml = softSkills.length
    ? `<div style="flex:1">
        <div style="font-weight:bold;margin-bottom:2px">Soft skill:</div>
        <ul class="bullets">${softSkills.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>`
    : "";

  const hardSkillsHtml = hardAndTools.length
    ? `<div style="flex:1">
        <div style="font-weight:bold;margin-bottom:2px">Hard skill &amp; Tools:</div>
        <ul class="bullets">${hardAndTools.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </div>`
    : "";

  const skillsSectionHtml =
    softSkillsHtml || hardSkillsHtml
      ? `<div class="section-title">KETERAMPILAN</div><div style="display:flex;gap:40px;font-size:11px">${softSkillsHtml}${hardSkillsHtml}</div>`
      : "";

  const portfolioSectionHtml = p.portfolio.length
    ? `<div class="section-title">PORTFOLIO &amp; TAUTAN</div><ul class="bullets">${p.portfolio.map((u) => `<li>${portfolioLink(u)}</li>`).join("")}</ul>`
    : "";

  return `
  <div class="header">
    <h1>${escapeHtml(p.fullName)}</h1>
    <div class="contact">${escapeHtml(p.email)}${p.phone ? " | " + escapeHtml(p.phone) : ""}${p.location ? " | " + escapeHtml(p.location) : ""}</div>
  </div>

  ${p.about ? `<div class="summary">${escapeHtml(p.about)}</div>` : ""}

  ${p.experience.length ? `<div class="section-title">PENGALAMAN KERJA</div>${expItemsHtml}` : ""}

  ${p.education.length ? `<div class="section-title">PENDIDIKAN</div>${eduItemsHtml}` : ""}

  ${skillsSectionHtml}

  ${portfolioSectionHtml}
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
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
  );

  const avatarHtml = p.avatarUrl
    ? `<img src="${escapeHtml(p.avatarUrl)}" alt="${escapeHtml(p.fullName)}" style="width:105px;height:105px;border-radius:50%;object-fit:cover;display:inline-block;box-shadow:0 2px 8px rgba(0,0,0,0.08);" />`
    : `<div style="width:105px;height:105px;border-radius:50%;background:#2B2E3A;color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;font-size:30px;font-weight:bold;letter-spacing:1px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">${initials}</div>`;

  const contactHtml = `
    <div style="margin-bottom:20px;font-size:10.5px;color:#475569;line-height:1.6">
      ${p.phone ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><span>📞</span><span>${escapeHtml(p.phone)}</span></div>` : ""}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;word-break:break-all"><span>✉️</span><span>${escapeHtml(p.email)}</span></div>
      ${p.portfolio.length ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;word-break:break-all"><span>🌐</span><span>${portfolioLink(p.portfolio[0])}</span></div>` : ""}
      ${p.location ? `<div style="display:flex;align-items:center;gap:6px"><span>📍</span><span>${escapeHtml(p.location)}</span></div>` : ""}
    </div>`;

  const eduItemsHtml = p.education.length
    ? `<div style="margin-bottom:20px">
        <div class="sec-title-left">EDUCATION</div>
        ${p.education
          .map(
            (e) => `
          <div style="margin-bottom:9px">
            <div style="font-weight:700;font-size:11px;color:#1E293B">${e.level ? `${escapeHtml(e.level)} ` : ""}${escapeHtml(e.program)}</div>
            <div style="font-size:10.5px;color:#475569">${escapeHtml(e.school)}</div>
            <div style="font-size:9.5px;color:#94A3B8">${escapeHtml(e.dates || "")}${e.gpa ? ` · IPK ${escapeHtml(e.gpa)}` : ""}</div>
          </div>`
          )
          .join("")}
      </div>`
    : "";

  const expertiseHtml = hardAndTools.length
    ? `<div style="margin-bottom:20px">
        <div class="sec-title-left">EXPERTISE</div>
        ${hardAndTools.map((s) => `<div style="font-size:10.5px;color:#334155;margin-bottom:3.5px;font-weight:500">${escapeHtml(s)}</div>`).join("")}
      </div>`
    : "";

  const softSkillsHtml = softSkills.length
    ? `<div>
        <div class="sec-title-left">COMPETENCIES</div>
        ${softSkills.map((s) => `<div style="font-size:10.5px;color:#475569;margin-bottom:3px">${escapeHtml(s)}</div>`).join("")}
      </div>`
    : "";

  const experienceTimelineHtml = p.experience.length
    ? `<div style="margin-bottom:20px">
        <div class="sec-title-right">WORK EXPERIENCE</div>
        <div class="timeline-container">
          ${p.experience
            .map(
              (e) => `
            <div style="position:relative;margin-bottom:16px">
              <div class="timeline-node"></div>
              <div style="font-size:10.5px;font-weight:600;color:#334155;margin-bottom:1px">
                ${escapeHtml(e.dates)}
              </div>
              <div style="font-size:10px;color:#64748B;margin-bottom:2px">
                ${escapeHtml(e.company)}${e.employmentType ? ` · ${escapeHtml(e.employmentType)}` : ""}
              </div>
              <div style="font-size:11.5px;font-weight:700;color:#0F172A;margin-bottom:3px">
                ${escapeHtml(e.role)}
              </div>
              ${e.description ? `<div style="font-size:10.5px;line-height:1.5;color:#475569;margin-bottom:3px">${escapeHtml(e.description)}</div>` : ""}
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
    p.portfolio.length > 1
      ? `<div>
          <div class="sec-title-right">PORTFOLIO &amp; LINKS</div>
          <div style="font-size:10.5px;color:#475569">
            ${p.portfolio.map((u) => `<div style="margin-bottom:3px">🔗 ${portfolioLink(u)}</div>`).join("")}
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
      <div>
        <h1 class="name-title">${escapeHtml(p.fullName)}</h1>
        <div class="role-sub">${escapeHtml(p.targetRole || p.headline || "Professional")}</div>
        <div class="divider-line"></div>
      </div>

      ${p.about ? `<div style="margin-bottom:20px"><div class="sec-title-right">ABOUT ME</div><p style="font-size:10.5px;line-height:1.6;color:#475569;text-align:justify">${escapeHtml(p.about)}</p></div>` : ""}

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
  @page { margin: 15mm 20mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, Georgia, serif; font-size: 11.5px; color: #111111; line-height: 1.45; background: #FFFFFF; }
  .header { text-align: center; margin-bottom: 12px; }
  h1 { font-size: 21px; font-weight: bold; margin-bottom: 3px; letter-spacing: 0.5px; }
  .contact { font-size: 11px; color: #222222; }
  .summary { font-size: 11px; color: #111111; text-align: justify; margin-bottom: 12px; line-height: 1.45; }
  .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #000000; padding-bottom: 2px; margin: 12px 0 6px; }
  .item-header { display: flex; justify-content: space-between; align-items: baseline; font-size: 11.5px; font-weight: bold; color: #000000; }
  .item-date { font-size: 11px; font-weight: normal; color: #222222; white-space: nowrap; text-align: right; }
  .item-desc { font-size: 11px; color: #222222; margin-top: 2px; line-height: 1.4; }
  ul.bullets { margin: 2px 0 6px 18px; padding: 0; list-style-type: disc; }
  ul.bullets li { margin-bottom: 2px; font-size: 11px; color: #222222; line-height: 1.4; }
`,
    body: renderAtsBody,
  },

  // 2. Creative / Design Style (Top Pastel Banner + 2 Kolom + Timeline)
  modern: {
    css: `
  @page { margin: 0; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 11px; color: #1E293B; line-height: 1.5; background: #FFFFFF; }
  .top-banner { height: 32px; background: #EBD6CB; width: 100%; margin-bottom: 22px; }
  .container { display: flex; padding: 0 32px 32px; gap: 32px; }
  .col-left { width: 195px; flex-shrink: 0; }
  .col-right { flex: 1; min-width: 0; }
  .avatar-wrap { text-align: center; margin-bottom: 20px; }
  .sec-title-left { font-size: 11.5px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #1E293B; margin-bottom: 9px; }
  .sec-title-right { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #1E293B; margin-bottom: 9px; }
  .name-title { font-size: 25px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #1E293B; line-height: 1.15; margin-bottom: 3px; }
  .role-sub { font-size: 13px; font-weight: 400; letter-spacing: 2px; color: #64748B; text-transform: capitalize; margin-bottom: 10px; }
  .divider-line { width: 100%; height: 1.5px; background: #CBD5E1; margin-bottom: 18px; }
  .timeline-container { position: relative; padding-left: 18px; border-left: 1.5px solid #CBD5E1; margin-left: 5px; }
  .timeline-node { position: absolute; left: -24px; top: 3px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #64748B; background: #FFFFFF; }
  ul.clean-bullets { margin: 2px 0 0 14px; padding: 0; list-style-type: disc; }
  ul.clean-bullets li { font-size: 10.5px; color: #475569; margin-bottom: 2px; line-height: 1.45; }
`,
    body: renderModernBody,
  },

  // 3. Sidebar Dark (Alternative)
  sidebar: {
    css: `
  @page { margin: 0; size: A4 portrait; } * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1E293B; line-height: 1.5; display: flex; height: 100vh; }
  .sidebar { width: 220px; background: #1E293B; color: white; padding: 24px 18px; flex-shrink: 0; }
  .avatar { width: 55px; height: 55px; border-radius: 50%; background: linear-gradient(135deg,#7C3AED,#EC4899); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: white; margin: 0 auto 12px; }
  .name { font-size: 15px; font-weight: 800; color: white; text-align: center; } .headline-side { font-size: 10px; color: #94A3B8; text-align: center; margin-top: 2px; margin-bottom: 14px; }
  .sidebar-section { margin-bottom: 14px; } .sidebar-title { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #A78BFA; margin-bottom: 6px; border-bottom: 1px solid #334155; padding-bottom: 3px; }
  .contact-item { font-size: 10px; color: #94A3B8; margin-bottom: 3px; word-break: break-all; } .main { flex: 1; padding: 24px 26px; background: white; }
  .main-section { margin-bottom: 16px; }
  .main-title { font-size: 12px; font-weight: 800; color: #1E293B; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 3px; border-bottom: 1.5px solid #7C3AED; margin-bottom: 8px; }
  .about { font-size: 11px; color: #475569; line-height: 1.55; }
`,
    body: (p) => {
      const skillItems = [...p.skills, ...p.tools]
        .map((s) => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><div style="width:6px;height:6px;background:#7C3AED;border-radius:50%;flex-shrink:0"></div><span style="font-size:10.5px;color:#E2E8F0">${escapeHtml(s)}</span></div>`)
        .join("");
      const initials = escapeHtml((p.fullName ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join(""));
      return `
  <div class="sidebar">
    <div class="avatar">${initials}</div>
    <div class="name">${escapeHtml(p.fullName)}</div>
    <div class="headline-side">${escapeHtml(p.headline ?? "")}</div>
    <div class="sidebar-section">
      <div class="sidebar-title">Kontak</div>
      <div class="contact-item">📧 ${escapeHtml(p.email)}</div>
      ${p.phone ? `<div class="contact-item">📱 ${escapeHtml(p.phone)}</div>` : ""}
      ${p.location ? `<div class="contact-item">📍 ${escapeHtml(p.location)}</div>` : ""}
    </div>
    ${[...p.skills, ...p.tools].length ? `<div class="sidebar-section"><div class="sidebar-title">Skills &amp; Tools</div>${skillItems}</div>` : ""}
    ${p.education.length ? `<div class="sidebar-section"><div class="sidebar-title">Pendidikan</div>${p.education.map((e) => `<div style="margin-bottom:6px;font-size:10.5px"><div style="font-weight:600;color:#E2E8F0">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.school)}</div><div style="color:#94A3B8">${escapeHtml(e.program)}${e.dates ? ` · ${escapeHtml(e.dates)}` : ""}</div></div>`).join("")}</div>` : ""}
  </div>
  <div class="main">
    ${p.about ? `<div class="main-section"><div class="about">${escapeHtml(p.about)}</div></div>` : ""}
    ${p.experience.length ? `<div class="main-section"><div class="main-title">Pengalaman Kerja</div>${p.experience.map((e) => `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:11.5px">${escapeHtml(e.role)} — ${escapeHtml(e.company)}</div><div style="font-size:10px;color:#64748B;margin-bottom:2px">${escapeHtml(e.dates)}</div>${e.description ? `<div style="font-size:10.5px;color:#475569">${escapeHtml(e.description)}</div>` : ""}</div>`).join("")}</div>` : ""}
  </div>
`;
    },
  },

  // 4. Minimal Elegant (Alternative)
  minimal: {
    css: `
  @page { margin: 18mm 20mm; size: A4 portrait; } * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11.5px; color: #111; line-height: 1.55; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.5px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; } .headline { font-size: 11.5px; color: #555; font-style: italic; margin-top: 2px; }
  .contact { text-align: right; font-size: 10px; color: #666; line-height: 1.6; } .section { margin-bottom: 12px; }
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-bottom: 6px; }
  .about { font-size: 11px; color: #333; line-height: 1.6; margin-bottom: 12px; border-left: 2.5px solid #111; padding-left: 10px; }
`,
    body: (p) => {
      const exp = p.experience
        .map(
          (e) =>
            `<tr><td style="width:90px;vertical-align:top;padding-right:12px;font-size:10px;color:#777;padding-bottom:8px">${escapeHtml(e.dates)}</td><td style="vertical-align:top;padding-bottom:8px"><div style="font-weight:700;font-size:11.5px">${escapeHtml(e.role)}</div><div style="font-size:10.5px;color:#555">${escapeHtml(e.company)}</div>${e.description ? `<div style="font-size:10.5px;color:#444;margin-top:2px">${escapeHtml(e.description)}</div>` : ""}</td></tr>`
        )
        .join("");
      const edu = p.education
        .map(
          (e) =>
            `<tr><td style="width:90px;vertical-align:top;padding-right:12px;font-size:10px;color:#777;padding-bottom:6px">${escapeHtml(e.dates || "")}</td><td style="vertical-align:top;padding-bottom:6px"><div style="font-weight:700;font-size:11.5px">${e.level ? `[${escapeHtml(e.level)}] ` : ""}${escapeHtml(e.school)}</div><div style="font-size:10.5px;color:#555">${escapeHtml(e.program)}${e.gpa ? ` · IPK: ${escapeHtml(e.gpa)}` : ""}</div></td></tr>`
        )
        .join("");
      return `
  <div class="header">
    <div><h1>${escapeHtml(p.fullName)}</h1><div class="headline">${escapeHtml(p.headline ?? "")}</div></div>
    <div class="contact">${escapeHtml(p.email)}<br/>${escapeHtml(p.phone ?? "")}<br/>${escapeHtml(p.location ?? "")}</div>
  </div>
  ${p.about ? `<div class="about">${escapeHtml(p.about)}</div>` : ""}
  ${p.experience.length ? `<div class="section"><div class="section-label">Pengalaman</div><table style="width:100%;border-collapse:collapse">${exp}</table></div>` : ""}
  ${p.education.length ? `<div class="section"><div class="section-label">Pendidikan</div><table style="width:100%;border-collapse:collapse">${edu}</table></div>` : ""}
  ${[...p.skills, ...p.tools].length ? `<div class="section"><div class="section-label">Skills &amp; Tools</div><div style="font-size:11px;color:#333">${[...p.skills, ...p.tools].map(escapeHtml).join(" · ")}</div></div>` : ""}
`;
    },
  },
};

export function buildCvHtml(profile: CvProfile, templateId: CvTemplateId): string {
  const theme = themes[templateId] ?? themes.ats;
  return html(profile, theme.css, theme.body(profile));
}
