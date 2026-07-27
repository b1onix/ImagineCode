import express from 'express';
import { promises as fs } from 'fs';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { query } from '@anthropic-ai/claude-agent-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.join(__dirname, 'workspace');
const OUTPUT = path.join(__dirname, 'output');
const PUBLIC = path.join(__dirname, 'public');

const MODELS = {
  'claude-sonnet-5':  { label: 'Sonnet 5',  effortDefault: 'medium', supportsEffort: true },
  'claude-opus-4-8':  { label: 'Opus 4.8',  effortDefault: 'low',    supportsEffort: true },
  'claude-haiku-4-5': { label: 'Haiku 4.5', effortDefault: null,     supportsEffort: false },
};
const DEFAULT_MODEL = 'claude-sonnet-5';
const HANDSHAKE_MODEL = 'claude-haiku-4-5';

const app = express();
app.use(express.json({ limit: '5mb' }));

const state = {
  connection: { connected: false, checkedAt: null, version: null, method: null, error: null },
  render: null, // { controller, res, startedAt }
  lastBuild: null, // { at, format, model, seconds, costUsd }
};

// ---------------------------------------------------------------- helpers

function safeJoin(root, rel) {
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = path.resolve(root, clean);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    const err = new Error('Path escapes workspace');
    err.status = 400;
    throw err;
  }
  return abs;
}

async function buildTree(dir, relBase = '') {
  const out = [];
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const rel = relBase ? `${relBase}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push({ name: e.name, path: rel, type: 'folder', children: await buildTree(path.join(dir, e.name), rel) });
    } else {
      out.push({ name: e.name, path: rel, type: 'file' });
    }
  }
  out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1));
  return out;
}

async function collectSources(dir, relBase = '', acc = []) {
  let entries = [];
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const rel = relBase ? `${relBase}/${e.name}` : e.name;
    if (e.isDirectory()) await collectSources(path.join(dir, e.name), rel, acc);
    else {
      const stat = await fs.stat(path.join(dir, e.name));
      if (stat.size > 200_000) continue;
      const content = await fs.readFile(path.join(dir, e.name), 'utf8').catch(() => null);
      if (content !== null) acc.push({ path: rel, content });
    }
  }
  return acc;
}

function ndjson(res, obj) {
  try { res.write(JSON.stringify(obj) + '\n'); } catch { /* client gone */ }
}

function claudeVersion() {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      const p = spawn('claude', ['--version'], { shell: true, windowsHide: true });
      let buf = '';
      p.stdout.on('data', (d) => (buf += d));
      p.on('close', () => finish(buf.trim() || null));
      p.on('error', () => finish(null));
      setTimeout(() => { try { p.kill(); } catch {} finish(null); }, 8000);
    } catch { finish(null); }
  });
}

// The user's own Claude Code configuration — including third-party provider
// endpoints and keys — lives in ~/.claude/settings.json under `env`.
// Honor it exactly like the real CLI does.
let settingsEnvCache = { at: 0, env: {} };
function userSettingsEnv() {
  if (Date.now() - settingsEnvCache.at < 5000) return settingsEnvCache.env;
  const env = {};
  for (const f of ['settings.json', 'settings.local.json']) {
    try {
      const j = JSON.parse(readFileSync(path.join(os.homedir(), '.claude', f), 'utf8'));
      Object.assign(env, j.env || {});
    } catch {}
  }
  settingsEnvCache = { at: Date.now(), env };
  return env;
}

function detectAuthMethod() {
  const senv = userSettingsEnv();
  if (senv.ANTHROPIC_AUTH_TOKEN || senv.ANTHROPIC_API_KEY) {
    let host = '';
    try { host = senv.ANTHROPIC_BASE_URL ? ` (${new URL(senv.ANTHROPIC_BASE_URL).host})` : ''; } catch {}
    return `.claude settings.json${host}`;
  }
  if (process.env.ANTHROPIC_API_KEY) return 'API key';
  if (existsSync(path.join(os.homedir(), '.claude', '.credentials.json'))) return 'Claude Code login';
  return null;
}

// Environment for the SDK's child process:
//  1. start from our env — minus session-scoped vars if ImagineCode itself was
//     launched from inside a Claude Code session (they confuse the child)
//  2. overlay the user's ~/.claude settings `env` (provider URL, keys) on top
function sdkEnv() {
  const nested = !!process.env.CLAUDECODE;
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (nested && /^(CLAUDECODE$|CLAUDE_CODE_|CLAUDE_AGENT_|CLAUDE_PID$|CLAUDE_EFFORT$|AI_AGENT$|BAGGAGE$|ANTHROPIC_BASE_URL$|ANTHROPIC_DEFAULT_)/.test(k)) continue;
    env[k] = v;
  }
  Object.assign(env, userSettingsEnv());
  return env;
}

// ---------------------------------------------------------------- compiler prompt

const COMPILER_SYSTEM = `You are the ImagineCode Compiler — the compiler for programming languages that don't exist yet.

The user has INVENTED their own programming language. There is no spec and no grammar — but there IS source code, and you are a COMPILER, not a co-author. You translate exactly what is written into a real, working website. Nothing more.

LAW 1 — THERE ARE NO SYNTAX ERRORS IN IMAGINATION:
- Every program compiles. Never reject syntax as "invalid" — invented syntax is the whole point.
- Never output error messages, warnings, or lectures about the code. Interpret it.

LAW 2 — COMPILE WHAT IS WRITTEN. ONLY WHAT IS WRITTEN. (the fidelity law)
- Every element, every piece of text, every style and every behavior in your output must trace directly back to a line of the source. If you cannot point at the line that asked for it, it must not exist in the output.
- NEVER add content: no extra headings, paragraphs, labels, placeholder text, sections, buttons, links, icons, footers, badges, or decorative flourishes the source did not declare.
- NEVER extend behaviors: if the source says a click shows a popup with "Yay, you clicked", the popup contains exactly that text — no close button, no title, no extras. Mechanics that are genuinely required (like being able to dismiss that popup) are implemented invisibly (e.g. click anywhere to dismiss, or it fades on its own), never as new visible elements.
- Identifiers are NOT content. In \`create header = MyHeader\` or \`use button = button1\`, the words MyHeader and button1 are names the dreamer invented to REFER to the element — variable names, nothing more. They NEVER appear on screen. That header renders as an empty styled bar containing only its declared children; that button renders as an empty styled button. Worked example: \`create header = MyHeader { border.color = brown }\` compiles to a brown-bordered header bar with NO text inside — not to a header that says "MyHeader".
- Declared-but-textless elements stay textless: a button with no written label is an empty (but styled, sized and functional) button. NEVER invent placeholder copy like "This is a button", "Click me" or lorem ipsum.
- Unstated rendering details (what "small" means in pixels, font fallback, layout flow, default spacing) get the most neutral, minimal reasonable default — a rendering decision, never a content addition.
- Execution quality applies to what IS written: declared colors exact, declared animations smooth, declared centering actually centered. Be a precise browser for their language, not an eager designer.

LAW 3 — SOURCE SCOPE:
- Compile the ENTRY file. Other workspace files are modules: include one ONLY if the entry file references it by name. Unreferenced files do not exist for this build — never merge them in.

HOW TO READ THE LANGUAGE:
- Indentation, nesting and blocks = structure and hierarchy.
- "quoted text" = literal copy for the screen — reproduce exactly, including emoji.
- [square brackets] = interactive elements the source declares.
- Property-style lines (height = small, border.color = brown, font.Small, center = true) = style declarations — implement each precisely.
- Arrows and connectors (->, =>, ::, -) = flow, mapping, behavior chains.
- when / OnClick / OnHover / animation = real working interactivity — implement exactly the named behavior, nothing extra.
- Vibe / mood / style words, when written, are design instructions — translate them faithfully.
- Comments (#, //) = the dreamer talking to themselves; context, not content.

OUTPUT CONTRACT:
- HTML mode: write EXACTLY ONE file named index.html — fully self-contained (all CSS in a <style> tag, all JS in a <script> tag). No external assets, except a Google Font when the source names or clearly implies one.
- React mode: write EXACTLY ONE file named index.html that loads react@18 UMD, react-dom@18 UMD and @babel/standalone from a CDN, then defines the app as idiomatic React function components with hooks inside <script type="text/babel">. No build tools, no npm.

INCREMENTAL BUILDS:
- When the prompt is marked INCREMENTAL, the compiled site already exists. Read index.html first, then apply the smallest possible changes with the Edit tool so the file reflects exactly the source changes — and only the changes. Never regenerate from scratch. Everything the diff does not require must remain untouched, so the site stays consistent build to build.

PROCESS:
1. Read the source below.
2. Write (fresh build) or Edit (incremental build) index.html in the current working directory. Touch no other files.
3. MANDATORY SELF-AUDIT before finishing — Read the index.html you produced and check every piece of visible content:
   (a) every visible string traces to a quoted string or written word in the source;
   (b) no identifier name (MyHeader, button1, …) appears as visible text;
   (c) no invented copy anywhere — declared-but-textless elements are empty;
   (d) nothing exists that the source didn't declare.
   Fix any violation with the Edit tool before you finish. Do not skip this step.
4. Your final message: one or two short plain-text sentences for the build log, stating only facts about this build. Describe what you built or changed — NEVER list excluded, unreferenced or unchanged files. Mention only file names that actually appear in the source section above. No markdown, no code fences.`;

function targetLine(format) {
  return format === 'react'
    ? 'React — one self-contained index.html using React 18 UMD + ReactDOM UMD + Babel Standalone from CDN, app written as React function components with hooks in <script type="text/babel">.'
    : 'HTML — one self-contained index.html with inline <style> and <script>.';
}

function buildRenderPrompt({ files, entryPath, format, instructions }) {
  const entryFile = files.find((f) => f.path === entryPath) || files[0];
  const others = files.filter((f) => f !== entryFile);
  const parts = [
    `TARGET FORMAT: ${targetLine(format)}`,
    `ENTRY FILE: ${entryFile.path}`,
    'Compile the entry file. Modules below are included ONLY if the entry file references them by name — otherwise ignore them completely.',
  ];
  if (instructions?.trim()) parts.push(`STANDING BUILD NOTES FROM THE DREAMER: ${instructions.trim()}`);
  parts.push('', `════════ ENTRY file: ${entryFile.path} ════════`, entryFile.content);
  for (const f of others) parts.push('', `════════ module (only if referenced by the entry): ${f.path} ════════`, f.content);
  parts.push('', 'Compile now — exactly what is written, nothing else. Remember the fidelity law: identifiers are never visible text, textless elements stay empty, and nothing may exist without a source line. Write index.html, run the mandatory self-audit, then give the short build log message.');
  return parts.join('\n');
}

function buildIncrementalPrompt({ files, entryPath, format, instructions, notesChanged, changes }) {
  const entryFile = files.find((f) => f.path === entryPath) || files[0];
  const parts = [
    'INCREMENTAL BUILD — the compiled site already exists as index.html in the current directory.',
    'Read index.html, then apply the SMALLEST edits that make it reflect the source changes below — and ONLY those changes. Use the Edit tool; do not rewrite the file. Everything not required by the changes must remain byte-for-byte untouched.',
    `TARGET FORMAT: ${targetLine(format)} (unchanged)`,
    `ENTRY FILE: ${entryPath}`,
  ];
  if (instructions?.trim()) parts.push(`STANDING BUILD NOTES${notesChanged ? ' (these changed since the last build — re-apply where relevant)' : ''}: ${instructions.trim()}`);
  parts.push('', 'SOURCE CHANGES SINCE THE LAST BUILD:');
  for (const c of changes.changed) {
    parts.push('', `════════ ${c.path} — PREVIOUS version ════════`, c.prev, '', `════════ ${c.path} — CURRENT version ════════`, c.curr);
  }
  for (const a of changes.added) parts.push('', `════════ ${a.path} — NEW file ════════`, a.curr);
  for (const r of changes.removed) parts.push('', `════════ ${r.path} — DELETED (its previous content, remove what it produced if the entry referenced it) ════════`, r.prev);
  parts.push('', 'FULL CURRENT SOURCE for fidelity reference — the existing build traces to these files (entry first, then modules that count only if the entry references them). Content that traces to any of them is legitimate; do NOT remove it unless the diff above removed its source line:');
  parts.push('', `════════ ENTRY: ${entryFile?.path ?? entryPath} ════════`, entryFile?.content ?? '');
  for (const f of files.filter((x) => x !== entryFile)) parts.push('', `════════ module: ${f.path} ════════`, f.content);
  parts.push('', 'Apply the minimal edits now — change only what the diff requires, verify against the FULL source (identifiers never visible, no invented copy, nothing unwritten, nothing written removed). Then give the short build log message.');
  return parts.join('\n');
}

const MANIFEST = () => path.join(OUTPUT, '.imaginecode-build.json');
async function readManifest() {
  try { return JSON.parse(await fs.readFile(MANIFEST(), 'utf8')); } catch { return null; }
}
function diffSources(prev, files) {
  const curr = Object.fromEntries(files.map((f) => [f.path, f.content]));
  const changed = [], added = [], removed = [];
  for (const [p, c] of Object.entries(curr)) {
    if (!(p in prev)) added.push({ path: p, curr: c });
    else if (prev[p] !== c) changed.push({ path: p, prev: prev[p], curr: c });
  }
  for (const [p, c] of Object.entries(prev)) if (!(p in curr)) removed.push({ path: p, prev: c });
  return { changed, added, removed };
}

// ---------------------------------------------------------------- API: connection

app.get('/api/status', (req, res) => {
  res.json({ ...state.connection, models: MODELS, defaultModel: DEFAULT_MODEL, lastBuild: state.lastBuild, building: !!state.render });
});

app.post('/api/connect', async (req, res) => {
  const t0 = Date.now();
  const [version, method] = await Promise.all([claudeVersion(), Promise.resolve(detectAuthMethod())]);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  // handshake with the model the user will actually compile with, so the
  // check also proves their provider serves it
  const handshakeModel = MODELS[req.body?.model] ? req.body.model : HANDSHAKE_MODEL;
  try {
    const q = query({
      prompt: 'Reply with exactly: ok',
      options: {
        model: handshakeModel,
        maxTurns: 1,
        allowedTools: [],
        settingSources: ['user'],
        abortController: controller,
        env: sdkEnv(),
      },
    });
    let ok = false, resultMsg = null;
    for await (const msg of q) {
      if (msg.type === 'result') {
        ok = msg.subtype === 'success' && !msg.is_error;
        resultMsg = msg.result || msg.subtype;
      }
    }
    clearTimeout(timeout);
    state.connection = {
      connected: ok,
      checkedAt: new Date().toISOString(),
      version: version || 'Claude Agent SDK (bundled)',
      method: method || 'Claude Code login',
      latencyMs: Date.now() - t0,
      error: ok ? null : String(resultMsg || 'Handshake reply was not successful').slice(0, 300),
    };
  } catch (err) {
    clearTimeout(timeout);
    state.connection = {
      connected: false,
      checkedAt: new Date().toISOString(),
      version: version || null,
      method,
      latencyMs: Date.now() - t0,
      error: controller.signal.aborted
        ? 'Handshake timed out. Is Claude Code installed and logged in? Run `claude` in a terminal once.'
        : String(err?.message || err),
    };
  }
  res.json(state.connection);
});

// ---------------------------------------------------------------- API: files

app.get('/api/files', async (req, res) => {
  res.json({ tree: await buildTree(WORKSPACE) });
});

app.get('/api/file', async (req, res) => {
  try {
    const abs = safeJoin(WORKSPACE, req.query.path);
    const content = await fs.readFile(abs, 'utf8');
    res.json({ path: req.query.path, content });
  } catch (err) {
    res.status(err.status || 404).json({ error: err.status ? err.message : 'File not found' });
  }
});

app.put('/api/file', async (req, res) => {
  try {
    const abs = safeJoin(WORKSPACE, req.body.path);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, req.body.content ?? '', 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/files', async (req, res) => {
  try {
    const { path: rel, type } = req.body;
    const abs = safeJoin(WORKSPACE, rel);
    if (existsSync(abs)) return res.status(409).json({ error: 'Already exists' });
    if (type === 'folder') await fs.mkdir(abs, { recursive: true });
    else {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, req.body.content ?? '', 'utf8');
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.delete('/api/file', async (req, res) => {
  try {
    const abs = safeJoin(WORKSPACE, req.query.path);
    await fs.rm(abs, { recursive: true, force: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/rename', async (req, res) => {
  try {
    const from = safeJoin(WORKSPACE, req.body.from);
    const to = safeJoin(WORKSPACE, req.body.to);
    if (existsSync(to)) return res.status(409).json({ error: 'Target already exists' });
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/search', async (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  if (!q) return res.json({ results: [] });
  const files = await collectSources(WORKSPACE);
  const results = [];
  for (const f of files) {
    const lines = f.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const idx = lines[i].toLowerCase().indexOf(q);
      if (idx !== -1) {
        results.push({ path: f.path, line: i + 1, col: idx + 1, text: lines[i].trim().slice(0, 160) });
        if (results.length >= 200) return res.json({ results });
      }
    }
  }
  res.json({ results });
});

// ---------------------------------------------------------------- API: render (the compiler)

app.post('/api/render', async (req, res) => {
  const { entry, format = 'html', model = DEFAULT_MODEL, effort, instructions, fresh } = req.body || {};
  const modelInfo = MODELS[model] || MODELS[DEFAULT_MODEL];
  const modelId = MODELS[model] ? model : DEFAULT_MODEL;

  if (state.render) {
    ndjson(state.render.res, { type: 'error', message: 'Superseded by a new build.' });
    try { state.render.controller.abort(); state.render.res.end(); } catch {}
    state.render = null;
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const controller = new AbortController();
  state.render = { controller, res, startedAt: Date.now() };
  // client disconnect: res 'close' with an unfinished response (req 'close'
  // fires on body completion in modern Node, which is not a disconnect)
  res.on('close', () => { if (!res.writableEnded && state.render?.res === res) controller.abort(); });

  const t0 = Date.now();
  const finish = () => { if (state.render?.res === res) state.render = null; };

  try {
    const files = await collectSources(WORKSPACE);
    if (!files.length) {
      ndjson(res, { type: 'error', message: 'The workspace is empty — imagine something first.' });
      res.end(); return finish();
    }
    const entryPath = files.some((f) => f.path === entry) ? entry : files[0].path;

    // incremental unless: first build, forced fresh, or format/entry changed
    const manifest = fresh ? null : await readManifest();
    const canIncrement = !!manifest && existsSync(path.join(OUTPUT, 'index.html'))
      && manifest.format === format && manifest.entry === entryPath;
    let mode = 'fresh', changes = null;
    const notesChanged = (manifest?.instructions || '') !== (instructions || '');
    if (canIncrement) {
      changes = diffSources(manifest.sources || {}, files);
      const changeCount = changes.changed.length + changes.added.length + changes.removed.length;
      if (!changeCount && !notesChanged) {
        ndjson(res, { type: 'stage', text: 'no changes since the last build — the existing site is already up to date' });
        ndjson(res, { type: 'done', ok: true, seconds: 0, costUsd: 0, url: '/preview/' });
        res.end(); return finish();
      }
      mode = 'incremental';
    }
    if (mode === 'fresh') {
      await fs.rm(OUTPUT, { recursive: true, force: true });
      await fs.mkdir(OUTPUT, { recursive: true });
    }

    const effortLevel = modelInfo.supportsEffort ? (effort || modelInfo.effortDefault) : undefined;
    ndjson(res, { type: 'stage', text: `imagine build --entry ${entryPath} --target ${format} --model ${modelId}${effortLevel ? `[${effortLevel}]` : ''}${mode === 'incremental' ? ' --incremental' : ''}` });
    if (mode === 'incremental') {
      const n = changes.changed.length + changes.added.length + changes.removed.length;
      ndjson(res, { type: 'stage', text: `editing the existing build — ${n} source change${n === 1 ? '' : 's'}${notesChanged ? ' + updated build notes' : ''}, everything else stays untouched` });
    } else {
      ndjson(res, { type: 'stage', text: `reading imagination… ${files.length} file${files.length === 1 ? '' : 's'}, ${files.reduce((n, f) => n + f.content.split('\n').length, 0)} lines` });
    }

    const q = query({
      prompt: mode === 'incremental'
        ? buildIncrementalPrompt({ files, entryPath, format, instructions, notesChanged, changes })
        : buildRenderPrompt({ files, entryPath, format, instructions }),
      options: {
        cwd: OUTPUT,
        model: modelId,
        ...(effortLevel ? { effort: effortLevel } : {}),
        systemPrompt: COMPILER_SYSTEM,
        allowedTools: ['Write', 'Edit', 'Read'],
        permissionMode: 'acceptEdits',
        settingSources: ['user'],
        includePartialMessages: true,
        maxTurns: 30,
        abortController: controller,
        env: sdkEnv(),
      },
    });

    let finalResult = null;
    for await (const msg of q) {
      if (msg.type === 'system' && msg.subtype === 'init') {
        ndjson(res, { type: 'stage', text: `compiler online · ${msg.model || modelId}` });
      } else if (msg.type === 'stream_event') {
        const ev = msg.event;
        if (ev?.type === 'content_block_delta') {
          if (ev.delta?.type === 'text_delta' && ev.delta.text) ndjson(res, { type: 'delta', text: ev.delta.text });
          else if (ev.delta?.type === 'thinking_delta' && ev.delta.thinking) ndjson(res, { type: 'think', text: ev.delta.thinking });
        } else if (ev?.type === 'content_block_start' && ev.content_block?.type === 'thinking') {
          ndjson(res, { type: 'stage', text: 'compiler is dreaming…' });
        }
      } else if (msg.type === 'assistant') {
        for (const block of msg.message?.content || []) {
          if (block.type === 'tool_use') {
            const file = block.input?.file_path ? path.basename(String(block.input.file_path)) : '';
            ndjson(res, { type: 'tool', name: block.name, file });
          }
        }
      } else if (msg.type === 'result') {
        finalResult = msg;
      }
    }

    const seconds = ((Date.now() - t0) / 1000).toFixed(1);
    const built = existsSync(path.join(OUTPUT, 'index.html'));

    if (finalResult && !finalResult.is_error && built) {
      const costUsd = finalResult.total_cost_usd ?? null;
      state.lastBuild = { at: new Date().toISOString(), format, model: modelId, seconds: Number(seconds), costUsd };
      state.connection.connected = true;
      await fs.writeFile(MANIFEST(), JSON.stringify({
        entry: entryPath,
        format,
        instructions: instructions || '',
        sources: Object.fromEntries(files.map((f) => [f.path, f.content])),
        at: new Date().toISOString(),
      })).catch(() => {});
      ndjson(res, { type: 'summary', text: finalResult.result || '' });
      ndjson(res, { type: 'done', ok: true, seconds: Number(seconds), costUsd, url: '/preview/' });
    } else if (controller.signal.aborted) {
      ndjson(res, { type: 'error', message: `build stopped after ${seconds}s` });
    } else {
      const reason = finalResult?.result || finalResult?.subtype || 'the compiler produced no output';
      ndjson(res, { type: 'error', message: `build failed after ${seconds}s — ${String(reason).slice(0, 400)}` });
    }
  } catch (err) {
    if (controller.signal.aborted) {
      ndjson(res, { type: 'error', message: 'build stopped' });
    } else {
      ndjson(res, { type: 'error', message: `compiler crashed — ${String(err?.message || err).slice(0, 400)}` });
    }
  }
  res.end();
  finish();
});

app.post('/api/render/stop', (req, res) => {
  if (state.render) { state.render.controller.abort(); res.json({ stopped: true }); }
  else res.json({ stopped: false });
});

// ---------------------------------------------------------------- preview + static

app.use('/preview', (req, res, next) => {
  if ((req.path === '/' || req.path === '') && !existsSync(path.join(OUTPUT, 'index.html'))) {
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><title>ImagineCode</title>
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@1,300..500&family=Fragment+Mono&display=swap" rel="stylesheet"><style>
      body{margin:0;height:100vh;display:grid;place-items:center;background:#0b0b0e;color:#8f8f9a;text-align:center;font-family:'Fragment Mono',Consolas,monospace}
      .s{font-size:96px;line-height:1;margin-bottom:10px;color:#17171e}
      h1{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:300;font-size:24px;margin:0 0 14px;color:#eceae3;letter-spacing:.01em}
      p{font-size:11.5px;margin:0;letter-spacing:.04em}
      kbd{background:#121218;border:1px solid #32323e;border-bottom-width:2px;border-radius:4px;padding:2px 7px;font-size:10px;color:#c6f24e}
    </style></head><body><div><div class="s">✦</div><h1>Nothing has been imagined into existence&nbsp;yet.</h1><p>press <kbd>▶ run</kbd> or <kbd>ctrl+enter</kbd> in imaginecode to compile your imagination</p></div></body></html>`);
  }
  next();
}, express.static(OUTPUT));

app.use(express.static(PUBLIC));

// ---------------------------------------------------------------- boot

async function ensureDirs() {
  await fs.mkdir(WORKSPACE, { recursive: true });
  await fs.mkdir(OUTPUT, { recursive: true });
  await fs.mkdir(PUBLIC, { recursive: true });
}

const BASE_PORT = Number(process.env.PORT) || 3333;
async function start(port, attempt = 0) {
  await ensureDirs();
  const server = app.listen(port, () => {
    console.log('');
    console.log('  ✦ ImagineCode — the compiler for languages that don\'t exist yet');
    console.log(`  ✦ IDE:     http://localhost:${port}`);
    console.log(`  ✦ Preview: http://localhost:${port}/preview/`);
    console.log('');
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 10) start(port + 1, attempt + 1);
    else { console.error(err); process.exit(1); }
  });
}
start(BASE_PORT);
