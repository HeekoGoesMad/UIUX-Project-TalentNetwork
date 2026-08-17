import type { CvProfile } from "@/types";

export type CvTemplateId = "ats" | "modern" | "sidebar" | "minimal";

export function buildHtmlAts(p: CvProfile): string {
  const skills = [...p.skills, ...p.tools].join(" · ");
  const exp = p.experience
    .map(
      (e) => `
    <div style="margin-bottom:10px">
      <div style="font-weight:bold">${e.role} — ${e.company}</div>
      <div style="font-size:11px;color:#555">${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:4px;font-size:11px">${e.achievements.join(", ")}</div>` : ""}
    </div>`
    )
    .join("");
  const edu = p.education
    .map(
      (e) => `
    <div style="margin-bottom:8px">
      <div style="font-weight:bold">${e.school}</div>
      <div style="font-size:11px;color:#555">${e.program} · ${e.dates}</div>
    </div>`
    )
    .join("");

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

export function buildHtmlModern(p: CvProfile): string {
  const exp = p.experience
    .map(
      (e) => `
    <div style="margin-bottom:10px">
      <div style="font-weight:700;color:#111">${e.role}</div>
      <div style="font-size:11px;color:#7C3AED;font-weight:600">${e.company} · ${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:3px;font-size:11px;color:#444">${e.achievements.join(", ")}</div>` : ""}
    </div>`
    )
    .join("");
  const edu = p.education
    .map(
      (e) => `
    <div style="margin-bottom:8px">
      <div style="font-weight:700">${e.school}</div>
      <div style="font-size:11px;color:#555">${e.program} · ${e.dates}</div>
    </div>`
    )
    .join("");
  const skillBadges = p.skills
    .map(
      (s) =>
        `<span style="background:#F3E8FF;color:#7C3AED;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;display:inline-block">${s}</span>`
    )
    .join("");
  const toolBadges = p.tools
    .map(
      (t) =>
        `<span style="background:#EDE9FE;color:#6D28D9;padding:3px 8px;border-radius:20px;font-size:10px;font-weight:600;margin:2px;display:inline-block">${t}</span>`
    )
    .join("");

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
      ${p.portfolio.length ? `<div class="section"><div class="section-title">Portfolio</div>${p.portfolio.map((u) => `<div style="font-size:10px;color:#7C3AED;word-break:break-all;margin-bottom:4px">${u}</div>`).join("")}</div>` : ""}
    </div>
  </div>
</body></html>`;
}

export function buildHtmlSidebar(p: CvProfile): string {
  const exp = p.experience
    .map(
      (e) => `
    <div style="margin-bottom:10px">
      <div style="font-weight:700">${e.role}</div>
      <div style="font-size:11px;color:#94A3B8">${e.company} · ${e.dates}</div>
      ${e.achievements?.length ? `<div style="margin-top:3px;font-size:11px;color:#94A3B8">${e.achievements.join(", ")}</div>` : ""}
    </div>`
    )
    .join("");
  const edu = p.education
    .map(
      (e) => `
    <div style="margin-bottom:6px;font-size:11px">
      <div style="font-weight:600;color:#E2E8F0">${e.school}</div>
      <div style="color:#94A3B8">${e.program} · ${e.dates}</div>
    </div>`
    )
    .join("");
  const skillItems = [...p.skills, ...p.tools]
    .map(
      (s) => `
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
      <div style="width:8px;height:8px;background:#7C3AED;border-radius:50%;flex-shrink:0"></div>
      <span style="font-size:11px;color:#E2E8F0">${s}</span>
    </div>`
    )
    .join("");

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
    <div class="avatar">${(p.fullName ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}</div>
    <div class="name">${p.fullName}</div>
    <div class="headline-side">${p.headline ?? ""}</div>
    <div class="sidebar-section">
      <div class="sidebar-title">Kontak</div>
      <div class="contact-item">📧 ${p.email}</div>
      ${p.phone ? `<div class="contact-item">📱 ${p.phone}</div>` : ""}
      ${p.location ? `<div class="contact-item">📍 ${p.location}</div>` : ""}
    </div>
    ${[...p.skills, ...p.tools].length ? `<div class="sidebar-section"><div class="sidebar-title">Skills &amp; Tools</div>${skillItems}</div>` : ""}
    ${p.education.length ? `<div class="sidebar-section"><div class="sidebar-title">Pendidikan</div>${edu}</div>` : ""}
    ${p.portfolio.length ? `<div class="sidebar-section"><div class="sidebar-title">Portfolio</div>${p.portfolio.map((u) => `<div style="font-size:9px;color:#7C3AED;word-break:break-all;margin-bottom:3px">${u}</div>`).join("")}</div>` : ""}
  </div>
  <div class="main">
    ${p.about ? `<div class="main-section"><div class="about">${p.about}</div></div>` : ""}
    ${p.experience.length ? `<div class="main-section"><div class="main-title">Pengalaman Kerja</div>${exp}</div>` : ""}
  </div>
</body></html>`;
}

export function buildHtmlMinimal(p: CvProfile): string {
  const exp = p.experience
    .map(
      (e) => `
    <tr>
      <td style="width:80px;vertical-align:top;padding-right:16px;font-size:10px;color:#888;padding-bottom:10px">${e.dates}</td>
      <td style="vertical-align:top;padding-bottom:10px">
        <div style="font-weight:700;font-size:12px">${e.role}</div>
        <div style="font-size:11px;color:#666">${e.company}</div>
        ${e.achievements?.length ? `<div style="font-size:11px;color:#555;margin-top:2px">${e.achievements.join(", ")}</div>` : ""}
      </td>
    </tr>`
    )
    .join("");
  const edu = p.education
    .map(
      (e) => `
    <tr>
      <td style="width:80px;vertical-align:top;padding-right:16px;font-size:10px;color:#888;padding-bottom:8px">${e.dates}</td>
      <td style="vertical-align:top;padding-bottom:8px">
        <div style="font-weight:700;font-size:12px">${e.school}</div>
        <div style="font-size:11px;color:#666">${e.program}</div>
      </td>
    </tr>`
    )
    .join("");

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
  ${[...p.skills, ...p.tools].length ? `<div class="section"><div class="section-label">Skills &amp; Tools</div><div class="skills-row">${[...p.skills, ...p.tools].join(" · ")}</div></div>` : ""}
  ${p.portfolio.length ? `<div class="section"><div class="section-label">Portfolio</div><div class="skills-row">${p.portfolio.join(" · ")}</div></div>` : ""}
</body></html>`;
}

export const cvBuilders: Record<CvTemplateId, (p: CvProfile) => string> = {
  ats: buildHtmlAts,
  modern: buildHtmlModern,
  sidebar: buildHtmlSidebar,
  minimal: buildHtmlMinimal,
};

export function buildCvHtml(profile: CvProfile, templateId: CvTemplateId): string {
  return cvBuilders[templateId](profile);
}
