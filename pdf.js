/* ── PDF / print export ── */
function getCE(id) {
  const el = document.getElementById(id);
  return el ? el.innerText.trim() : '';
}

function numberedListing(filename, src) {
  const CHUNK = 55;
  const lines = src.split('\n');
  const chunks = [];
  for (let i = 0; i < lines.length; i += CHUNK) {
    chunks.push(lines.slice(i, i + CHUNK).map((line, j) =>
      `<div class="pcl-row"><span class="pcl-ln">${i + j + 1}</span><span class="pcl-lc">${escHtml(line)}</span></div>`
    ).join(''));
  }
  const body = chunks.map(c => `<div class="pcl-chunk">${c}</div>`).join('');
  return `<div class="pcl-file"><div class="pcl-filename">${escHtml(filename)}</div><div class="pcl-body">${body}</div></div>`;
}

function generatePDF() {
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

  const codeSections = Object.entries(codeContent).map(([name, src]) => numberedListing(name, src)).join('');

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>AP CSP Portfolio — ${escHtml(info.name || repoData.parsed?.repo || 'repo')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;color:#1c1b18;line-height:1.65;padding:44px;font-size:14px}
  h1{font-size:20px;font-weight:600}
  h2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#6b6960;margin:28px 0 10px;padding-bottom:6px;border-bottom:1px solid #e2e0d8}
  .hdr{border-bottom:2px solid #4f46e5;padding-bottom:16px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-end}
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
  /* code listing */
  .code-listing-title{font-size:9pt;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#6b6960;padding-bottom:5pt;border-bottom:1pt solid #e2e0d8;margin-bottom:10pt;page-break-before:always}
  .pcl-file{border:1pt solid #e2e0d8;border-radius:4pt;margin-bottom:12pt;overflow:hidden;break-inside:auto}
  .pcl-filename{font-family:'DM Mono',monospace;font-size:8.5pt;font-weight:700;padding:4pt 8pt;background:#f0efe9;border-bottom:1pt solid #e2e0d8;color:#4f46e5;break-after:avoid}
  .pcl-body{font-family:'DM Mono',monospace;font-size:8pt;line-height:1.5}
  .pcl-chunk{break-inside:avoid;page-break-inside:avoid}
  .pcl-row{display:flex;min-height:1em}
  .pcl-ln{min-width:32pt;text-align:right;padding:0 6pt 0 3pt;color:#9b9890;border-right:1pt solid #e2e0d8;background:#f7f6f2;flex-shrink:0}
  .pcl-lc{padding:0 6pt;white-space:pre-wrap;word-break:break-all;color:#1c1b18;flex:1}
  .ft{margin-top:36px;padding-top:12px;border-top:1px solid #e2e0d8;font-size:11px;color:#9b9890;display:flex;justify-content:space-between}
  @page{margin:1.8cm 1.5cm;size:A4}
  @page{@bottom-right{content:"Page " counter(page) " of " counter(pages);font-size:9pt;color:#9b9890}}
  @media print{body{padding:0}}
</style></head><body>
<div class="hdr">
  <div><h1>AP Computer Science Principles</h1><p style="font-size:12px;color:#6b6960;margin-top:3px">Create Performance Task — Digital Portfolio</p></div>
  <p style="font-size:12px;color:#6b6960">${escHtml(info.html_url || '')}</p>
</div>
<div class="score">
  <div class="sb">${passed}/${checks.length}</div>
  <div>
    <div style="font-size:14px;font-weight:600">${pct}% of automated checks passed</div>
    <div style="font-size:11px;color:#9b9890;margin-top:1px">6 rubric rows · 6 points total · Scored by College Board</div>
  </div>
</div>
<h2>Written Responses — submit at digitalportfolio.collegeboard.org</h2>
${responses.map(r => {
  const val = getCE('pdf_' + r.id);
  return `<div class="rl">${r.label}</div><div class="rh">${r.rubric}</div><div class="rb ${val ? '' : 'empty'}">${val ? escHtml(val) : 'Not completed'}</div>`;
}).join('')}
<h2>Automated Requirements Checklist</h2>
<div class="cg">
${checks.map(c => `<div class="ci" style="border-left:3px solid ${sc(c.status)}">
  <span style="color:${sc(c.status)};font-weight:600;font-size:13px;flex-shrink:0;line-height:1.5">${si(c.status)}</span>
  <div><div class="ct">${c.title}<span class="cr">${c.rubricRow}</span></div><div class="cd">${c.detail}</div></div>
</div>`).join('')}
</div>
${codeSections ? `<div class="code-listing-title">Code Listing</div>${codeSections}` : ''}
<div class="ft">
  <span>AP CSP Portfolio Checker · ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
  <span>apcentral.collegeboard.org</span>
</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (repoData.parsed?.repo || 'portfolio') + '-ap-csp-portfolio.html';
  a.click();
  URL.revokeObjectURL(a.href);
}
