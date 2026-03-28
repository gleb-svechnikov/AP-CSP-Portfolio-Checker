/* ── PDF / print export ── */
function generatePDF() {
  const get = id => (document.getElementById(id) ? document.getElementById(id).value.trim() : '');
  const name = get('pdf_name') || 'Student';
  const teacher = get('pdf_teacher') || '—';
  const year = get('pdf_year') || '2026';
  const period = get('pdf_period') || '—';
  const info = repoData.info || {};
  const checks = checkRequirements();
  const passed = checks.filter(c => c.status === 'pass').length;
  const pct = Math.round(passed / checks.length * 100);

  const responses = [
    { id:'3a', label:'3a — Program Purpose & Function', rubric:'Row 1 (1 pt): Describe the program\'s purpose, what the video shows including input and output, and the functionality demonstrated.' },
    { id:'3b', label:'3b — Data Abstraction',           rubric:'Row 2 (1 pt): Show list creation and list usage code segments. Name the list and describe the data it represents.' },
    { id:'3c', label:'3c — Managing Complexity',        rubric:'Row 3 (1 pt): Explain how the list manages complexity. Describe how the program would differ without the list.' },
    { id:'3d', label:'3d — Procedural Abstraction',     rubric:'Row 4 (1 pt): Show procedure definition and call. Identify parameter(s) and how they affect the procedure.' },
    { id:'3e', label:'3e — Algorithm Implementation',   rubric:'Row 5 (1 pt): Explain how the algorithm achieves its purpose with sequencing, selection, and iteration.' },
    { id:'3f', label:'3f — Testing',                    rubric:'Row 6 (1 pt): Describe two calls with different arguments, conditions tested, and result of each call.' },
  ];

  const sc = s => s === 'pass' ? '#16a34a' : s === 'warn' ? '#d97706' : '#dc2626';
  const si = s => s === 'pass' ? '✓' : s === 'warn' ? '◑' : '✗';

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>AP CSP Portfolio — ${name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;color:#1c1b18;line-height:1.65;padding:44px;font-size:14px}
  h1{font-size:20px;font-weight:600}
  h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#6b6960;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #e2e0d8}
  .hdr{border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .mc{background:#f7f6f2;border-radius:6px;padding:10px 12px;border:1px solid #e2e0d8}
  .mv{font-size:15px;font-weight:600}
  .mk{font-size:11px;color:#6b6960;margin-top:1px}
  .score{background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:16px;margin-bottom:22px}
  .sb{font-size:30px;font-weight:600;color:#4f46e5}
  .rb{background:#f7f6f2;border:1px solid #e2e0d8;border-left:3px solid #4f46e5;border-radius:0 5px 5px 0;padding:10px 13px;font-size:13px;line-height:1.7;white-space:pre-wrap;min-height:44px;margin-top:5px}
  .rb.empty{color:#9b9890;font-style:italic}
  .rl{font-size:13px;font-weight:600;margin-bottom:1px;margin-top:14px}
  .rh{font-size:11px;color:#6b6960;font-style:italic;margin-bottom:4px}
  .cg{display:grid;gap:6px;margin-top:8px}
  .ci{display:flex;gap:9px;align-items:flex-start;padding:6px 10px;border-radius:5px;border:1px solid #e2e0d8}
  .ct{font-size:12px;font-weight:500}
  .cr{font-size:11px;font-weight:500;background:#eef2ff;color:#4f46e5;border-radius:3px;padding:1px 5px;margin-left:3px}
  .cd{font-size:11px;color:#6b6960;margin-top:1px}
  .ft{margin-top:36px;padding-top:12px;border-top:1px solid #e2e0d8;font-size:11px;color:#9b9890;display:flex;justify-content:space-between}
  @page{margin:1.5cm}
  @media print{body{padding:0}}
</style></head><body>
<div class="hdr">
  <div><h1>AP Computer Science Principles</h1><p style="font-size:12px;color:#6b6960;margin-top:3px">Create Performance Task — Digital Portfolio</p></div>
  <p style="font-size:12px;color:#6b6960">Exam Year: <strong>${year}</strong></p>
</div>
<div class="meta">
  <div class="mc"><div class="mv">${name}</div><div class="mk">Student</div></div>
  <div class="mc"><div class="mv">${teacher}</div><div class="mk">Teacher</div></div>
  <div class="mc"><div class="mv">${period}</div><div class="mk">Period</div></div>
  <div class="mc"><div class="mv">${info.name || repoData.parsed?.repo || '—'}</div><div class="mk">Repository</div></div>
</div>
<div class="score">
  <div class="sb">${passed}/${checks.length}</div>
  <div>
    <div style="font-size:14px;font-weight:600">${pct}% of automated checks passed</div>
    <div style="font-size:11px;color:#6b6960;margin-top:2px">${info.html_url || ''}</div>
    <div style="font-size:11px;color:#9b9890;margin-top:1px">6 rubric rows · 6 points total · Scored by College Board</div>
  </div>
</div>
<h2>Written Responses — submit at digitalportfolio.collegeboard.org</h2>
${responses.map(r => {
  const val = get('pdf_' + r.id);
  return `<div class="rl">${r.label}</div><div class="rh">${r.rubric}</div><div class="rb ${val ? '' : 'empty'}">${val ? escHtml(val) : 'Not completed'}</div>`;
}).join('')}
<h2>Automated Requirements Checklist</h2>
<div class="cg">
${checks.map(c => `<div class="ci" style="border-left:3px solid ${sc(c.status)}">
  <span style="color:${sc(c.status)};font-weight:600;font-size:13px;flex-shrink:0;line-height:1.5">${si(c.status)}</span>
  <div><div class="ct">${c.title}<span class="cr">${c.rubricRow}</span></div><div class="cd">${c.detail}</div></div>
</div>`).join('')}
</div>
<div class="ft">
  <span>AP CSP Portfolio Checker · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
  <span>apcentral.collegeboard.org</span>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (name.replace(/\s+/g,'-').toLowerCase() || 'student') + '-ap-csp-portfolio.html';
  a.click();
  URL.revokeObjectURL(a.href);
}
