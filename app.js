/* ── App state & UI actions ── */
let repoData = {};
let codeContent = {};
let batchResults = [];

function parseRepo(url) {
  const m = url.trim().replace(/\/$/, '').match(/github\.com\/([^/\s]+)\/([^/\s]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, '') } : null;
}

function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

function setMode(mode) {
  document.getElementById('singlePane').style.display = mode === 'single' ? 'block' : 'none';
  document.getElementById('batchPane').style.display  = mode === 'batch'  ? 'block' : 'none';
  document.getElementById('modeSingle').classList.toggle('active', mode === 'single');
  document.getElementById('modeBatch').classList.toggle('active',  mode === 'batch');
}

function showError(msg) {
  const isRateLimit = msg.includes('rate_limit') || msg.includes('403') || msg.includes('429');
  document.getElementById('errorBox').innerHTML = `<div class="alert alert-err">${
    isRateLimit
      ? 'GitHub API rate limit exceeded. Add a token named "gh_pat" to localStorage to authenticate (5,000 req/hr).'
      : msg
  }</div>`;
}

function clearError() { document.getElementById('errorBox').innerHTML = ''; }

function setLoading(on, msg) {
  document.getElementById('loadingBox').style.display = on ? 'block' : 'none';
  if (msg) document.getElementById('loadingMsg').textContent = msg;
  const btn = document.getElementById('analyzeBtn');
  if (btn) btn.disabled = on;
}

async function analyzeSingle() {
  clearError();
  const url = document.getElementById('repoUrl').value.trim();
  if (!url) { showError('Please enter a GitHub repository URL.'); return; }
  const parsed = parseRepo(url);
  if (!parsed) { showError('Could not parse that URL. Make sure it looks like https://github.com/username/repo'); return; }
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  setLoading(true, 'Fetching repository…');
  try {
    repoData = await loadRepo(parsed);
    setLoading(true, 'Reading code files…');
    codeContent = await loadCodeFiles(repoData);
    setLoading(false);
    renderAll();
    document.getElementById('mainContent').style.display = 'block';
    switchTab('overview', document.querySelector('.tab'));
  } catch(e) {
    setLoading(false);
    showError('Could not load repository. Is it public? Check the URL and try again. (' + e.message + ')');
    document.getElementById('emptyState').style.display = 'block';
  }
}

async function analyzeBatch() {
  const raw = document.getElementById('batchUrls').value.trim();
  const urls = raw.split('\n').map(u => u.trim()).filter(u => u.includes('github.com'));
  if (!urls.length) { showError('No valid GitHub URLs found.'); return; }
  clearError();
  batchResults = [];
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('dashTab').style.display = '';
  switchTab('dashboard', document.getElementById('dashTab'));
  document.getElementById('dashBadge').textContent = urls.length;
  renderDashboardShell(urls);
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const parsed = parseRepo(url);
    if (!parsed) { updateDashRow(i, null, url); continue; }
    try {
      const data = await loadRepo(parsed);
      const code = await loadCodeFiles(data);
      const checks = checkRequirements(data, code);
      batchResults.push({ url, parsed, data, checks });
      updateDashRow(i, { data, checks }, url);
    } catch(e) { updateDashRow(i, null, url); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('repoUrl').addEventListener('keydown', e => {
    if (e.key === 'Enter') analyzeSingle();
  });
});
