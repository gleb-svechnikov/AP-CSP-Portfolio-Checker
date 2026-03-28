/* ── Requirements engine — each check maps to a CB rubric row ── */
function checkRequirements(data, code) {
  data = data || repoData;
  code = code || codeContent;
  const files = data.contents || [];
  const commits = data.commits || [];
  const src = Object.values(code).join('\n');
  const info = data.info || {};
  const readme = data.readmeText || '';
  const res = [];

  const vidFile = files.find(f => /\.(mp4|mov|avi|webm|mkv|gif)$/i.test(f.name));
  res.push({ id:'video', title:'Video demonstration included', category:'Artifacts',
    rubricRow:'Row 1', pts:1,
    cbRef:'The video must show the program running, at least one feature, and the program\'s input and output. Maximum 1 minute / 30 MB.',
    status: vidFile ? 'pass' : 'fail',
    detail: vidFile ? `Found: ${vidFile.name}` : 'No video file (.mp4, .mov, .webm, .gif) found. Upload a ≤1 min screen recording showing the program running with visible input and output.' });

  const hasReadme = files.some(f => /readme/i.test(f.name));
  res.push({ id:'readme', title:'README / written project description', category:'Artifacts',
    rubricRow:'Row 1', pts:1,
    cbRef:'Provide a written response describing the program\'s purpose, identifying input(s) and output(s), and describing the functionality shown in the video.',
    status: hasReadme ? (readme.length > 100 ? 'pass' : 'warn') : 'fail',
    detail: hasReadme
      ? (readme.length > 100 ? 'README found with substantial content.' : 'README found but very short — expand to describe purpose, inputs, outputs, and features shown in the video.')
      : 'No README found.' });

  res.push({ id:'public', title:'Repository is public (accessible to scorers)', category:'Repository',
    rubricRow:'Submission', pts:0,
    cbRef:'Program code must be submitted and accessible. A public GitHub repository satisfies this requirement for College Board scorers.',
    status: !info.private ? 'pass' : 'fail',
    detail: !info.private ? 'Repository is publicly accessible.' : 'Repository is private. Must be public before submitting to the AP Digital Portfolio.' });

  const lines = src.split('\n').filter(l => l.trim().length > 2);
  res.push({ id:'sequence', title:'Sequencing — ordered executable statements', category:'Program Code',
    rubricRow:'Row 5', pts:1,
    cbRef:'The algorithm must include sequencing: the program executes each step of the algorithm in the order given.',
    status: lines.length >= 10 ? 'pass' : lines.length >= 3 ? 'warn' : 'fail',
    detail: `${lines.length} non-empty lines detected. The written response for Row 5 must explain how the code executes in a specific order to produce the correct result.` });

  const hasBranch = /\bif\b|\belif\b|\belse\b|\bmatch\b|\bcase\b|\bswitch\b|\bwhen\b/.test(src);
  res.push({ id:'selection', title:'Selection — conditional logic (if/else/match)', category:'Program Code',
    rubricRow:'Row 5', pts:1,
    cbRef:'The algorithm must include selection: a conditional that allows different operations based on whether a condition is true or false.',
    status: hasBranch ? 'pass' : 'fail',
    detail: hasBranch ? 'Conditional statements detected (if/elif/else or match/case).' : 'No conditionals found. Must include if/else, match/case, or switch — required for Row 5.' });

  const hasLoop = /\bfor\b|\bwhile\b|\bloop\b|\beach\b|\bforEach\b/.test(src);
  res.push({ id:'algo', title:'Iteration — loop construct (for/while)', category:'Program Code',
    rubricRow:'Row 5', pts:1,
    cbRef:'The algorithm must include iteration: a loop that repeats a set of statements zero or more times.',
    status: hasLoop ? 'pass' : 'fail',
    detail: hasLoop ? 'Loop construct detected (for/while).' : 'No loops found. Must include a for or while loop — required for Row 5.' });

  const hasProcParam = /def\s+\w+\s*\([^)]*\w[^)]*\)|function\s+\w+\s*\([^)]*\w[^)]*\)|void\s+\w+\s*\([^)]+\)|public\s+\w+\s+\w+\s*\([^)]+\)/.test(src);
  const hasProc = /\bdef |\bfunction |\bvoid |\bproc /.test(src);
  res.push({ id:'abstraction', title:'Student-defined procedure with parameter(s)', category:'Program Code',
    rubricRow:'Row 4', pts:1,
    cbRef:'Implement a procedure with ≥1 parameter that has an effect on the procedure\'s functionality. Show the definition and a call to the procedure.',
    status: hasProcParam ? 'pass' : hasProc ? 'warn' : 'fail',
    detail: hasProcParam ? 'Procedure with parameter(s) detected — satisfies Row 4.' :
      hasProc ? 'Procedure found but parameters may be missing or empty. Row 4 requires ≥1 parameter that meaningfully affects the procedure\'s behavior.' :
      'No procedures/functions found. Must define at least one with parameter(s) for Row 4.' });

  const hasList = /\[.*\]/.test(src) || /\blist\(|\bArrayList|\bvector<|\[\]/.test(src);
  res.push({ id:'list', title:'List or collection for data abstraction', category:'Program Code',
    rubricRow:'Rows 2 & 3', pts:2,
    cbRef:'The program must include a list used to manage complexity (Row 2). The written response must explain how using the list manages complexity vs. not using it (Row 3).',
    status: hasList ? 'pass' : 'fail',
    detail: hasList ? 'List/array/collection detected — satisfies Rows 2 and 3 data abstraction requirement.' : 'No list or collection found. Must store multiple related values in a list/array to satisfy Rows 2–3.' });

  const hasInput = /\binput\(|\bprompt\(|\breadline|\bScanner|\bargv|\bsys\.argv|\bevent\b|\bonclick|\bonkey/i.test(src);
  res.push({ id:'input', title:'Program accepts user input or events', category:'Program Code',
    rubricRow:'Row 1', pts:1,
    cbRef:'Input can be user interaction, a file, external data, or user-defined values. The video and Row 1 written response must identify the input(s).',
    status: hasInput ? 'pass' : 'warn',
    detail: hasInput ? 'Input handling detected.' : 'No explicit input detected. Verify the program responds to user interaction — it must be visible in the video and described in Row 1.' });

  const n = commits.length;
  res.push({ id:'commits', title:'Commit history (documents development)', category:'Repository',
    rubricRow:'Row 6', pts:0,
    cbRef:'Row 6 asks students to describe testing and refinement. Multiple commits provide evidence of iterative development, testing, and debugging over time.',
    status: n >= 3 ? 'pass' : n >= 1 ? 'warn' : 'fail',
    detail: `${n} commit(s). ${n < 3 ? 'More commits help document the testing and refinement process described in Row 6.' : 'Good commit history — supports the Row 6 testing narrative.'}` });

  return res;
}
