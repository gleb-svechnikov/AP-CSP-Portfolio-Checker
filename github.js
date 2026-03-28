/* ── GitHub API ── */
const TOKEN_KEY = 'gh_pat';
function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }

async function ghFetch(path) {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'token ' + token;
  const r = await fetch('https://api.github.com' + path, { headers });
  if (r.status === 403 || r.status === 429) {
    const remaining = r.headers.get('X-RateLimit-Remaining');
    if (remaining === '0' || r.status === 429) {
      const tok = prompt('GitHub API rate limit exceeded.\n\nEnter a Personal Access Token to continue (no scopes needed for public repos).\nIt will be saved to localStorage as "gh_pat".');
      if (tok && tok.trim()) localStorage.setItem(TOKEN_KEY, tok.trim());
      throw new Error('rate_limit');
    }
  }
  if (!r.ok) throw new Error('GitHub ' + r.status);
  return r.json();
}

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('fetch failed');
  return r.text();
}

async function loadRepo(parsed) {
  const [infoRes, contentsRes, commitsRes] = await Promise.all([
    ghFetch('/repos/' + parsed.owner + '/' + parsed.repo),
    ghFetch('/repos/' + parsed.owner + '/' + parsed.repo + '/contents/'),
    ghFetch('/repos/' + parsed.owner + '/' + parsed.repo + '/commits?per_page=30'),
  ]);
  let readmeText = '';
  try {
    const rm = await ghFetch('/repos/' + parsed.owner + '/' + parsed.repo + '/contents/README.md');
    if (rm.content) readmeText = atob(rm.content.replace(/\n/g, ''));
  } catch(e) {}
  return { info: infoRes, contents: contentsRes, commits: commitsRes, readmeText, parsed };
}

async function loadCodeFiles(data) {
  const exts = ['.py','.js','.ts','.java','.cpp','.c','.cs','.rb','.go','.swift','.html','.php'];
  const files = (data.contents || []).filter(f =>
    f.type === 'file' && exts.some(e => f.name.toLowerCase().endsWith(e))
  ).slice(0, 6);
  const result = {};
  for (const f of files) {
    try { result[f.name] = await fetchText(f.download_url); } catch(e) {}
  }
  return result;
}
