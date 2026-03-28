/* ── Rendering ── */
function escHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function statusColor(s) {
  return s === 'pass' ? 'var(--green)' : s === 'warn' ? 'var(--amber)' : 'var(--red)';
}

function renderAll() {
  const info = repoData.info || {};
  const commits = repoData.commits || [];
  const checks = checkRequirements();
  const passed = checks.filter(c => c.status === 'pass').length;
  const pct = Math.round(passed / checks.length * 100);
  const color = statusColor(pct >= 80 ? 'pass' : pct >= 50 ? 'warn' : 'fail');

  document.getElementById('reqBadge').textContent = checks.length;

  const updated = info.updated_at
    ? new Date(info.updated_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
    : '—';

  document.getElementById('repoMeta').innerHTML = `
    <div class="meta-card"><div class="meta-val">${info.language||'—'}</div><div class="meta-key">Language</div></div>
    <div class="meta-card"><div class="meta-val">${commits.length}</div><div class="meta-key">Commits</div></div>
    <div class="meta-card"><div class="meta-val">${(repoData.contents||[]).length}</div><div class="meta-key">Files</div></div>
    <div class="meta-card"><div class="meta-val">${updated}</div><div class="meta-key">Last updated</div></div>`;

  document.getElementById('scoreBanner').innerHTML = `
    <div class="score-circle" style="border-color:${color}">
      <span class="score-num" style="color:${color}">${passed}</span>
      <span class="score-denom">/ ${checks.length}</span>
    </div>
    <div class="score-info">
      <h3>${info.name || repoData.parsed.repo}</h3>
      <p>by ${repoData.parsed.owner} · <a href="${info.html_url}" target="_blank">View on GitHub ↗</a></p>
      <div class="progress-wrap">
        <div class="progress-track"><progress value="${pct}" max="100"></progress></div>
      </div>
    </div>
    <div><span class="score-pct" style="color:${color}">${pct}%</span><div style="font-size:12px;color:GrayText">requirements met</div></div>`;

  const critical = checks.filter(c => ['video','algo','abstraction','list','selection','iteration'].includes(c.id));
  document.getElementById('overviewChecks').innerHTML = critical.map(reqCard).join('');
  document.getElementById('allRequirements').innerHTML = checks.map(reqCard).join('');

  renderRubric(checks);
  renderCode();

  // pre-fill 3a from README if the field is empty
  const ta = document.getElementById('pdf_3a');
  if (ta && !ta.textContent.trim() && repoData.readmeText) ta.textContent = repoData.readmeText.trim();

  // populate print-only code listing
  const listing = document.getElementById('print-code-listing');
  if (listing) {
    const files = Object.entries(codeContent);
    if (files.length) {
      const CHUNK = 55; // lines per unbreakable chunk
      listing.innerHTML = '<div class="print-code-title">Code Listing</div>' +
        files.map(([name, src]) => {
          const lines = src.split('\n');
          // split into chunks so page breaks happen between chunks, not mid-chunk
          const chunks = [];
          for (let i = 0; i < lines.length; i += CHUNK) {
            chunks.push(lines.slice(i, i + CHUNK).map((line, j) =>
              `<div class="pcl-row"><span class="pcl-ln">${i + j + 1}</span><span class="pcl-lc">${escHtml(line)}</span></div>`
            ).join(''));
          }
          const chunkedBody = chunks.map(c => `<div class="pcl-chunk">${c}</div>`).join('');
          return `<div class="pcl-file"><div class="pcl-filename">${escHtml(name)}</div><div class="pcl-body">${chunkedBody}</div></div>`;
        }).join('');
    } else {
      listing.innerHTML = '';
    }
  }
}

function reqCard(c) {
  const labels = { pass:'Met', warn:'Partial', fail:'Missing' };
  return `
    <div class="req-card ${c.status}">
      <div class="req-head">
        <span class="req-badge badge-${c.status}">${labels[c.status]}</span>
        <div style="flex:1">
          <div class="req-title">${c.title}</div>
          <div class="req-meta">
            <span class="req-cat">${c.category}</span>
            <span class="req-rubric-tag">${c.rubricRow}${c.pts ? ' · ' + c.pts + ' pt' + (c.pts > 1 ? 's' : '') : ''}</span>
          </div>
        </div>
      </div>
      <div class="req-detail">${c.detail}</div>
      <div class="req-cb-ref"><strong>CB requirement:</strong> ${c.cbRef}</div>
    </div>`;
}

function renderRubric(checks) {
  const rubricRows = [
    { row:'Row 1', pts:1, skill:'Program Purpose & Function',
      what:'Describe the program\'s purpose, what the video shows (including input and output), and the functionality demonstrated.',
      ids:['video','readme','input'] },
    { row:'Row 2', pts:1, skill:'Data Abstraction',
      what:'Show two code segments: one where the list is created/stored, one where it is used. Name the list and describe the data it represents.',
      ids:['list'] },
    { row:'Row 3', pts:1, skill:'Managing Complexity',
      what:'Explain how the list manages the program\'s complexity. Describe how the program would differ without the list.',
      ids:['list'] },
    { row:'Row 4', pts:1, skill:'Procedural Abstraction',
      what:'Show the procedure definition and a call to it. Identify the parameter(s) and explain how they affect the procedure\'s behavior.',
      ids:['abstraction'] },
    { row:'Row 5', pts:1, skill:'Algorithm Implementation',
      what:'Explain how the algorithm achieves its purpose, specifically how it includes sequencing, selection, and iteration.',
      ids:['sequence','selection','algo'] },
    { row:'Row 6', pts:1, skill:'Testing',
      what:'Describe two calls with different arguments. For each: the argument used, the condition(s) tested, and the result of the call.',
      ids:['commits'] },
  ];

  const statusFor = ids => {
    const relevant = checks.filter(c => ids.includes(c.id));
    if (relevant.every(c => c.status === 'pass')) return 'pass';
    if (relevant.some(c => c.status === 'fail')) return 'fail';
    return 'warn';
  };

  const rowHtml = rubricRows.map(r => {
    const s = statusFor(r.ids);
    const color = statusColor(s);
    const icon = s === 'pass' ? '✓' : s === 'warn' ? '◑' : '✗';
    return `<tr>
      <td><span class="row-num">${r.row}</span></td>
      <td><span class="pts-badge">${r.pts} pt</span></td>
      <td style="font-weight:500">${r.skill}</td>
      <td style="color:GrayText">${r.what}</td>
      <td style="text-align:center;color:${color};font-size:15px;font-weight:600">${icon}</td>
    </tr>`;
  }).join('');

  document.getElementById('rubricPanel').innerHTML = `
    <div class="rubric-panel">
      <div class="rubric-panel-header">
        <h3>College Board Create PT Scoring Guidelines — 6 rows · 6 points total</h3>
        <a href="https://apcentral.collegeboard.org/media/pdf/ap-csp-create-performance-task-scoring-guidelines-2024.pdf" target="_blank">Official rubric PDF ↗</a>
      </div>
      <div style="overflow-x:auto">
        <table class="rubric-table">
          <thead><tr>
            <th style="width:64px">Row</th>
            <th style="width:52px">Points</th>
            <th style="width:190px">Skill</th>
            <th>What is required</th>
            <th style="width:52px;text-align:center">Status</th>
          </tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </div>
    </div>
    <div class="alert alert-info" style="font-size:12px;line-height:1.6">
      <strong>Note:</strong> Automated checks detect what is present in the code repository. All 6 rows also require written responses submitted at
      <a href="https://digitalportfolio.collegeboard.org" target="_blank">digitalportfolio.collegeboard.org</a>.
      Code detection is an indicator only — a College Board scorer evaluates both the written responses and the code together.
    </div>`;
}

function renderCode() {
  const files = repoData.contents || [];
  const exts = ['.py','.js','.ts','.java','.cpp','.c','.cs','.rb','.go','.swift','.html','.php'];
  const codeFiles = files.filter(f => f.type === 'file' && exts.some(e => f.name.toLowerCase().endsWith(e)));
  if (!codeFiles.length) {
    document.getElementById('codePanel').innerHTML = '<div class="empty"><div class="empty-icon">⊘</div><p>No code files found.</p></div>';
    return;
  }
  document.getElementById('codePanel').innerHTML = codeFiles.map(f => {
    const txt = codeContent[f.name] || '';
    const lines = txt ? txt.split('\n').length : '—';
    const preview = txt
      ? escHtml(txt.slice(0, 2500)) + (txt.length > 2500 ? '\n…' : '')
      : '<em style="color:GrayText">Could not load file content.</em>';
    return `
      <div class="code-file">
        <div class="code-file-header">
          <span class="code-filename">${f.name}</span>
          <span class="code-lines">${lines} lines</span>
          <a class="code-link" href="${f.html_url}" target="_blank">View on GitHub ↗</a>
        </div>
        <div class="code-body"><pre>${preview}</pre></div>
      </div>`;
  }).join('');
}

function renderDashboardShell(urls) {
  const rows = urls.map((u, i) => `
    <tr id="dashrow-${i}" class="scan-row">
      <td>${parseRepo(u) ? parseRepo(u).owner + '/' + parseRepo(u).repo : u}</td>
      <td colspan="4"><span class="pill" style="color:GrayText">Scanning…</span></td>
    </tr>`).join('');
  document.getElementById('dashboardPanel').innerHTML = `
    <div style="background:Canvas;border:1px solid ButtonBorder;border-radius:10px;overflow:hidden;">
      <table class="class-table">
        <thead><tr><th>Repository</th><th>Score</th><th>Video</th><th>Algorithm</th><th>Abstraction</th></tr></thead>
        <tbody id="dashBody">${rows}</tbody>
      </table>
    </div>
    <div id="classStats" style="margin-top:1rem"></div>`;
}

function updateDashRow(i, result, url) {
  const row = document.getElementById('dashrow-' + i);
  if (!row) return;
  row.classList.remove('scan-row');
  if (!result) {
    row.innerHTML = `<td><a href="${url}" target="_blank">${url}</a></td><td colspan="4"><span class="pill pill-fail">Error</span></td>`;
    return;
  }
  const { data, checks } = result;
  const passed = checks.filter(c => c.status === 'pass').length;
  const pct = Math.round(passed / checks.length * 100);
  const color = statusColor(pct >= 80 ? 'pass' : pct >= 50 ? 'warn' : 'fail');
  const pillCls = pct >= 80 ? 'pill-pass' : pct >= 50 ? 'pill-warn' : 'pill-fail';
  const dot = id => {
    const c = checks.find(c => c.id === id);
    return `<span class="pill ${c.status==='pass'?'pill-pass':c.status==='warn'?'pill-warn':'pill-fail'}">${c.status==='pass'?'✓':c.status==='warn'?'~':'✗'}</span>`;
  };
  row.innerHTML = `
    <td><a href="${data.info.html_url}" target="_blank">${data.parsed.owner}/${data.parsed.repo}</a></td>
    <td><span class="pill ${pillCls}">${passed}/${checks.length}</span><progress value="${pct}" max="100"></progress></td>
    <td>${dot('video')}</td><td>${dot('algo')}</td><td>${dot('abstraction')}</td>`;
  updateClassStats();
}

function updateClassStats() {
  const n = batchResults.length;
  if (!n) return;
  const avg = Math.round(
    batchResults.reduce((s, r) => s + (r.checks.filter(c => c.status === 'pass').length / r.checks.length * 100), 0) / n
  );
  document.getElementById('classStats').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
      <div class="meta-card"><div class="meta-val">${n}</div><div class="meta-key">Repos analyzed</div></div>
      <div class="meta-card"><div class="meta-val">${avg}%</div><div class="meta-key">Avg requirements met</div></div>
      <div class="meta-card"><div class="meta-val">${batchResults.filter(r=>r.checks.find(c=>c.id==='video').status==='pass').length}</div><div class="meta-key">Have video</div></div>
      <div class="meta-card"><div class="meta-val">${batchResults.filter(r=>r.checks.find(c=>c.id==='algo').status==='pass').length}</div><div class="meta-key">Algorithm complete</div></div>
    </div>`;
}
