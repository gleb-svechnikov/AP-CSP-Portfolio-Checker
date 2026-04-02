/* ── App state & UI actions ── */
let repoData = {};
let codeContent = {};
let batchResults = [];

function parseRepo(url) {
  const m = url
    .trim()
    .replace(/\/$/, "")
    .match(/github\.com\/([^/\s]+)\/([^/\s]+)/);
  return m ? { owner: m[1], repo: m[2].replace(/\.git$/, "") } : null;
}

function switchTab(name, el) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  if (el) el.classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

function setMode(mode) {
  document.getElementById("singlePane").style.display =
    mode === "single" ? "block" : "none";
  document.getElementById("batchPane").style.display =
    mode === "batch" ? "block" : "none";
  document.getElementById("localPane").style.display =
    mode === "local" ? "block" : "none";
  document
    .getElementById("modeSingle")
    .classList.toggle("active", mode === "single");
  document
    .getElementById("modeBatch")
    .classList.toggle("active", mode === "batch");
  document
    .getElementById("modeLocal")
    .classList.toggle("active", mode === "local");

  // show/hide tabs based on mode
  document.getElementById("portfolioTab").style.display =
    mode === "batch" ? "none" : "";
  document.getElementById("programCodeTab").style.display =
    mode === "batch" ? "none" : "";
  document.getElementById("dashTab").style.display =
    mode === "batch" ? "" : "none";

  // reset to a sensible default tab when switching
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("emptyState").style.display = "block";
}

function showNewSearchBtn() {
  let btn = document.getElementById("newSearchBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "newSearchBtn";
    btn.className = "btn-new-search no-print";
    btn.textContent = "← New search";
    btn.onclick = () => {
      document.querySelector(".search-area").style.display = "block";
      document.getElementById("mainContent").style.display = "none";
      document.getElementById("emptyState").style.display = "block";
      btn.remove();
    };
    document.getElementById("mainContent").prepend(btn);
  }
}

function showError(msg) {
  const isRateLimit =
    msg.includes("rate_limit") || msg.includes("403") || msg.includes("429");
  document.getElementById("errorBox").innerHTML =
    `<div class="alert alert-err">${
      isRateLimit
        ? 'GitHub API rate limit exceeded. Add a token named "gh_pat" to localStorage to authenticate (5,000 req/hr).'
        : msg
    }</div>`;
}

function clearError() {
  document.getElementById("errorBox").innerHTML = "";
}

function setLoading(on, msg) {
  document.getElementById("loadingBox").style.display = on ? "block" : "none";
  if (msg) document.getElementById("loadingMsg").textContent = msg;
  const btn = document.getElementById("analyzeBtn");
  if (btn) btn.disabled = on;
}

async function analyzeSingle() {
  clearError();
  const url = document.getElementById("repoUrl").value.trim();
  if (!url) {
    showError("Please enter a GitHub repository URL.");
    return;
  }
  const parsed = parseRepo(url);
  if (!parsed) {
    showError(
      "Could not parse that URL. Make sure it looks like https://github.com/username/repo",
    );
    return;
  }
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
  document.querySelector(".search-area").style.display = "none";
  setLoading(true, "Fetching repository…");
  try {
    repoData = await loadRepo(parsed);
    setLoading(true, "Reading code files…");
    codeContent = await loadCodeFiles(repoData);
    setLoading(false);
    renderAll();
    document.getElementById("mainContent").style.display = "block";
    showNewSearchBtn();
    switchTab("overview", document.querySelector(".tab"));
  } catch (e) {
    setLoading(false);
    document.querySelector(".search-area").style.display = "block";
    showError(
      "Could not load repository. Is it public? Check the URL and try again. (" +
        e.message +
        ")",
    );
    document.getElementById("emptyState").style.display = "block";
  }
}

async function analyzeBatch() {
  const raw = document.getElementById("batchUrls").value.trim();
  const urls = raw
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.includes("github.com"));
  if (!urls.length) {
    showError("No valid GitHub URLs found.");
    return;
  }
  clearError();
  batchResults = [];
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("mainContent").style.display = "block";
  document.querySelector(".search-area").style.display = "none";
  switchTab("dashboard", document.getElementById("dashTab"));
  document.getElementById("dashBadge").textContent = urls.length;
  renderDashboardShell(urls);
  showNewSearchBtn();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const parsed = parseRepo(url);
    if (!parsed) {
      updateDashRow(i, null, url);
      continue;
    }
    try {
      const data = await loadRepo(parsed);
      const code = await loadCodeFiles(data);
      const checks = checkRequirements(data, code);
      batchResults.push({ url, parsed, data, checks });
      updateDashRow(i, { data, checks }, url);
    } catch (e) {
      updateDashRow(i, null, url);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("repoUrl").addEventListener("keydown", (e) => {
    if (e.key === "Enter") analyzeSingle();
  });
});

async function analyzeLocal() {
  if (!window.showDirectoryPicker) {
    showError(
      "Your browser does not support the File System Access API. Try Chrome or Edge.",
    );
    return;
  }
  let dirHandle;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: "read" });
  } catch (e) {
    return; // user cancelled
  }

  clearError();
  document.getElementById("emptyState").style.display = "none";
  document.getElementById("mainContent").style.display = "none";
  document.querySelector(".search-area").style.display = "none";
  setLoading(true, "Reading local folder…");

  try {
    const exts = [
      ".py",
      ".js",
      ".ts",
      ".java",
      ".cpp",
      ".c",
      ".cs",
      ".rb",
      ".go",
      ".swift",
      ".html",
      ".php",
    ];
    const contents = [];
    codeContent = {};
    let readmeText = "";

    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind !== "file") continue;
      const lower = name.toLowerCase();
      // always add every file to contents so checks (e.g. video) can find them
      contents.push({ name, type: "file", html_url: "", download_url: "" });
      if (/readme/i.test(name)) {
        const file = await handle.getFile();
        readmeText = await file.text();
      }
      if (
        exts.some((e) => lower.endsWith(e)) &&
        Object.keys(codeContent).length < 6
      ) {
        const file = await handle.getFile();
        codeContent[name] = await file.text();
      }
    }

    // read commit history from .git/logs/HEAD
    let commits = [];
    try {
      const gitHandle = await dirHandle.getDirectoryHandle(".git");
      const logsHandle = await gitHandle.getDirectoryHandle("logs");
      const headHandle = await logsHandle.getFileHandle("HEAD");
      const headFile = await headHandle.getFile();
      const headText = await headFile.text();
      // each non-empty line is one ref-log entry = one commit action
      commits = headText
        .split("\n")
        .filter((l) => l.trim().length > 0)
        .map((line) => {
          // format: <old-sha> <new-sha> <author> <timestamp> <tz>\t<message>
          const parts = line.split("\t");
          return { message: parts[1] || "", raw: line };
        });
    } catch (e) {
      // no .git folder or no logs — leave commits empty
    }

    console.log("📁 Local folder:", dirHandle.name);
    console.log(
      "📄 All files found:",
      contents.map((f) => f.name),
    );
    console.log(
      "📝 README detected:",
      readmeText ? `yes (${readmeText.length} chars)` : "no",
    );
    console.log("💻 Code files loaded:", Object.keys(codeContent));
    console.log(
      "🎬 Video files:",
      contents
        .filter((f) => /\.(mp4|mov|avi|webm|mkv|gif)$/i.test(f.name))
        .map((f) => f.name),
    );
    console.log("📦 Commits from .git/logs/HEAD:", commits.length);

    // build a repoData-compatible object from local files
    repoData = {
      info: {
        name: dirHandle.name,
        html_url: "",
        language: contents.length
          ? contents[0].name.split(".").pop().toUpperCase()
          : "—",
        private: false,
        updated_at: new Date().toISOString(),
      },
      contents,
      commits,
      readmeText,
      parsed: { owner: "local", repo: dirHandle.name },
    };

    setLoading(false);
    renderAll();
    document.getElementById("mainContent").style.display = "block";
    showNewSearchBtn();
    switchTab("overview", document.querySelector(".tab"));
  } catch (e) {
    setLoading(false);
    document.querySelector(".search-area").style.display = "block";
    showError("Could not read folder: " + e.message);
    document.getElementById("emptyState").style.display = "block";
  }
}
