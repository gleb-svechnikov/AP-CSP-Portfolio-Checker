# AP CSP Portfolio Checker

A browser-based tool for AP Computer Science Principles teachers and students to check GitHub repositories against the College Board Create Performance Task rubric (2025–2026).

---

## What it does

Paste a public GitHub repository URL and the tool fetches metadata, code files, and commit history, then checks the repo against all 6 CB rubric rows. It also supports **batch mode** — paste one URL per line to scan an entire class at once.

---

## GitHub API usage

The tool calls the **unauthenticated GitHub REST API** directly from the browser. This is important because GitHub enforces a rate limit of **60 requests per hour per IP address** for unauthenticated requests.

### Single repo analysis

Every time you click **Analyze**, the tool makes these requests:

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `GET /repos/{owner}/{repo}` | Repo metadata (language, visibility, last updated) |
| 2 | `GET /repos/{owner}/{repo}/contents/` | Root file listing |
| 3 | `GET /repos/{owner}/{repo}/commits?per_page=30` | Last 30 commits |
| 4 | `GET /repos/{owner}/{repo}/contents/README.md` | README content |
| 5–10 | `GET {download_url}` (raw.githubusercontent.com) | Up to 6 code files fetched directly |

**Total per single repo: 4 authenticated GitHub API calls + up to 6 raw file fetches.**

Raw file downloads (`raw.githubusercontent.com`) do **not** count against the GitHub API rate limit, but the 4 API calls do.

### Batch mode

Batch mode runs the same sequence for every URL in the list **sequentially**. For a class of N students:

```
API calls = N × 4   (minimum)
Raw fetches = N × up to 6
```

For example, a class of 30 students = **120 API calls** minimum, which is double the 60 req/hr unauthenticated limit.

---

## Hitting the rate limit

If you see an error like `GitHub 403` or `GitHub 429`, you've hit the rate limit. GitHub returns a `403 Forbidden` with a `X-RateLimit-Remaining: 0` header when the limit is exceeded.

### How to fix it

**Option 1 — Wait.** The limit resets every 60 minutes from your first request.

**Option 2 — Add a GitHub personal access token (PAT).** Authenticated requests get **5,000 requests per hour**. To add one:

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) and generate a classic token with no scopes (read-only public repos need no scopes).
2. In `script.js`, find the `ghFetch` function and add an `Authorization` header:

```js
async function ghFetch(path) {
  const r = await fetch('https://api.github.com' + path, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token YOUR_PAT_HERE'   // add this line
    }
  });
  if (!r.ok) throw new Error('GitHub ' + r.status);
  return r.json();
}
```

> **Warning:** Do not commit a token to a public repo. If you're hosting this tool publicly, implement a backend proxy instead of embedding the token in client-side JS.

**Option 3 — Spread batch analysis over time.** If you have a large class, analyze students in groups of 10–12 to stay under the 60 req/hr limit per session.

---

## Running locally

No build step required. Just open `index.html` in a browser, or serve it with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## Rubric coverage

| CB Row | Skill | Automated check |
|--------|-------|----------------|
| Row 1 | Program Purpose & Function | Video file present, README length, input detection |
| Row 2 | Data Abstraction | List/array usage in code |
| Row 3 | Managing Complexity | Same as Row 2 |
| Row 4 | Procedural Abstraction | Function/procedure with parameter(s) |
| Row 5 | Algorithm Implementation | Sequence (lines of code), selection (if/else), iteration (for/while) |
| Row 6 | Testing | Commit count as proxy for iterative development |

Automated checks are indicators only. College Board scorers evaluate both the code and the written responses submitted at [digitalportfolio.collegeboard.org](https://digitalportfolio.collegeboard.org).
