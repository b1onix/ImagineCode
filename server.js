import express from 'express';
import { promises as fs } from 'fs';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { query } from '@anthropic-ai/claude-agent-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- locations
//
// Run from a checkout, everything lives next to this file. Run from the
// packaged desktop app, this file is read-only inside app.asar — so anything
// the dreamer creates or the compiler writes moves to a writable data
// directory that the Electron shell hands us.

const DATA_DIR = process.env.IMAGINECODE_DATA_DIR || __dirname;
const WORKSPACE = path.join(DATA_DIR, 'workspace');
const OUTPUT = path.join(DATA_DIR, 'output');
const PUBLIC = path.join(__dirname, 'public');
// example imaginations copied in the first time the workspace is empty
const SEED = process.env.IMAGINECODE_SEED_DIR || path.join(__dirname, 'resources', 'seed-workspace');
// Monaco, vendored so the desktop app still has an editor with no internet
const MONACO_LOCAL = path.join(__dirname, 'node_modules', 'monaco-editor', 'min', 'vs');
const MONACO_CDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';
const hasLocalMonaco = existsSync(path.join(MONACO_LOCAL, 'loader.js'));
const MONACO_VERSION = (() => {
  try { return JSON.parse(readFileSync(path.join(__dirname, 'node_modules', 'monaco-editor', 'package.json'), 'utf8')).version; }
  catch { return '0'; }
})();
const MONACO_BASE = `/vs-${MONACO_VERSION}`;

// The SDK finds its native CLI with require.resolve, which cannot reach inside
// app.asar — the desktop shell resolves the unpacked binary and passes it here.
const CLAUDE_BIN = process.env.IMAGINECODE_CLAUDE_BIN && existsSync(process.env.IMAGINECODE_CLAUDE_BIN)
  ? process.env.IMAGINECODE_CLAUDE_BIN
  : null;
const claudeExec = () => (CLAUDE_BIN ? { pathToClaudeCodeExecutable: CLAUDE_BIN } : {});

// ---------------------------------------------------------------- providers
//
// ImagineCode can compile through four different back ends. `claude-code` is
// the agentic one (the Claude Agent SDK drives Write/Edit/Read inside output/);
// the other three are the user's own API keys, talked to over plain HTTPS and
// asked to return the finished index.html in one streamed pass.
//
// Every curated catalog below is a *floor*, not a ceiling: whenever a key is
// present the provider's own GET /v1/models is merged on top (see liveModels),
// so models released after this file was written still show up in the picker.

const MODELS = {
  'claude-sonnet-5':  { label: 'Sonnet 5',  badge: 'default · medium reasoning', desc: 'balanced + quick — the imagination workhorse', effortDefault: 'medium', supportsEffort: true },
  'claude-opus-4-8':  { label: 'Opus 4.8',  badge: 'low reasoning',              desc: 'deepest interpretation, for intricate dreams',  effortDefault: 'low',    supportsEffort: true },
  'claude-haiku-4-5': { label: 'Haiku 4.5', badge: 'fast',                       desc: 'instant sketches, lightest touch',              effortDefault: null,     supportsEffort: false },
};
const DEFAULT_MODEL = 'claude-sonnet-5';
const HANDSHAKE_MODEL = 'claude-haiku-4-5';

const ANTHROPIC_VERSION = '2023-06-01';

// thinking: 'adaptive' → send thinking:{type:'adaptive'} (Claude 4.6+ only).
// price: USD per 1M tokens, used to estimate build cost.
const ANTHROPIC_MODELS = {
  'claude-opus-5':    { label: 'Opus 5',    badge: 'most capable', desc: 'the deepest reader of invented syntax', thinking: 'adaptive', supportsEffort: true, effortDefault: 'medium', price: { in: 5,  out: 25 } },
  'claude-sonnet-5':  { label: 'Sonnet 5',  badge: 'recommended',  desc: 'balanced + quick — the imagination workhorse', thinking: 'adaptive', supportsEffort: true, effortDefault: 'medium', price: { in: 3,  out: 15 } },
  'claude-fable-5':   { label: 'Fable 5',   badge: 'most creative', desc: 'wilder interpretations, premium price', thinking: 'adaptive', supportsEffort: true, effortDefault: 'medium', price: { in: 10, out: 50 } },
  'claude-opus-4-8':  { label: 'Opus 4.8',  badge: '',             desc: 'previous flagship, still formidable', thinking: 'adaptive', supportsEffort: true, effortDefault: 'low', price: { in: 5, out: 25 } },
  'claude-opus-4-6':  { label: 'Opus 4.6',  badge: '',             desc: 'older opus generation', thinking: 'adaptive', supportsEffort: true, effortDefault: 'low', price: { in: 5, out: 25 } },
  'claude-sonnet-4-6':{ label: 'Sonnet 4.6', badge: '',            desc: 'older sonnet generation', thinking: 'adaptive', supportsEffort: true, effortDefault: 'medium', price: { in: 3, out: 15 } },
  'claude-haiku-4-5': { label: 'Haiku 4.5', badge: 'fast + cheap', desc: 'instant sketches, lightest touch', thinking: null, supportsEffort: false, effortDefault: null, price: { in: 1, out: 5 } },
};

const OPENAI_MODELS = {
  'gpt-5.6-terra': { label: 'GPT-5.6 Terra', badge: 'recommended',   desc: 'balances intelligence and cost', supportsEffort: true, effortDefault: 'medium' },
  'gpt-5.6-sol':   { label: 'GPT-5.6 Sol',   badge: 'most capable',  desc: 'frontier model for complex work', supportsEffort: true, effortDefault: 'medium' },
  'gpt-5.6-luna':  { label: 'GPT-5.6 Luna',  badge: 'fast + cheap',  desc: 'tuned for cost-sensitive builds', supportsEffort: true, effortDefault: 'low' },
};

const DEEPSEEK_MODELS = {
  'deepseek-v4-pro':   { label: 'DeepSeek V4 Pro',   badge: 'recommended',  desc: 'thinking on by default, 1M context', price: { in: 0.435, out: 0.87 } },
  'deepseek-v4-flash': { label: 'DeepSeek V4 Flash', badge: 'fast + cheap', desc: 'the bargain dreamer', price: { in: 0.14, out: 0.28 } },
};

const PROVIDERS = {
  'claude-code': {
    label: 'Claude Code',
    kind: 'agent',
    blurb: 'Your existing Claude Code login or ~/.claude settings. Agentic — it reads and edits the build directly, so incremental rebuilds are surgical.',
    needsKey: false,
    models: MODELS,
    defaultModel: DEFAULT_MODEL,
  },
  anthropic: {
    label: 'Anthropic API',
    kind: 'anthropic',
    blurb: 'Your own Anthropic API key. Claude writes the whole page in one streamed pass.',
    needsKey: true,
    keyHint: 'sk-ant-…',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    envVar: 'ANTHROPIC_API_KEY',
    base: 'https://api.anthropic.com/v1',
    maxOut: 32000,
    models: ANTHROPIC_MODELS,
    defaultModel: 'claude-sonnet-5',
  },
  openai: {
    label: 'OpenAI API',
    kind: 'openai',
    blurb: 'Your own OpenAI API key, over the Chat Completions API.',
    needsKey: true,
    keyHint: 'sk-…',
    keyUrl: 'https://platform.openai.com/api-keys',
    envVar: 'OPENAI_API_KEY',
    base: 'https://api.openai.com/v1',
    maxTokensField: 'max_completion_tokens',
    maxOut: 64000,
    models: OPENAI_MODELS,
    defaultModel: 'gpt-5.6-terra',
  },
  deepseek: {
    label: 'DeepSeek API',
    kind: 'openai',
    blurb: 'Your own DeepSeek API key, over its OpenAI-compatible endpoint.',
    needsKey: true,
    keyHint: 'sk-…',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    envVar: 'DEEPSEEK_API_KEY',
    base: 'https://api.deepseek.com/v1',
    maxTokensField: 'max_tokens',
    maxOut: 64000,
    models: DEEPSEEK_MODELS,
    defaultModel: 'deepseek-v4-pro',
  },
};
const DEFAULT_PROVIDER = 'claude-code';

// The desktop shell forks this file over an IPC channel. If the shell is
// force-killed the channel closes, and without this the server would outlive
// it — an immortal process squatting on port 3333, invisible in the taskbar,
// blocking the next launch.
if (process.send) {
  process.on('disconnect', () => process.exit(0));
}

const app = express();
app.use(express.json({ limit: '5mb' }));

// ---------------------------------------------------------------- local-only guard
//
// This is an unauthenticated API on a predictable localhost port, and the
// desktop app leaves it listening all day. Without these two checks any web
// page the user happens to have open could read and rewrite their workspace,
// or kick off real, billable builds, entirely in the background.

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\]|::1)(:\d+)?$/i;

app.use((req, res, next) => {
  // DNS rebinding: an attacker's domain resolving to 127.0.0.1 arrives with
  // their Host, not ours
  const host = req.headers.host || '';
  if (host && !LOCAL_HOST.test(host)) {
    return res.status(403).json({ error: 'ImagineCode only answers to localhost.' });
  }
  // CSRF: browsers attach Origin to every cross-site state-changing request.
  // A missing Origin means a non-browser client (curl, a script), which cannot
  // be used to attack the user's own session.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.origin;
    if (origin) {
      let ok = false;
      try { ok = LOCAL_HOST.test(new URL(origin).host); } catch {}
      if (!ok) return res.status(403).json({ error: 'Cross-origin requests are not accepted.' });
    }
  }
  next();
});

const state = {
  // per-provider connection records; 'claude-code' is also mirrored onto
  // /api/status's top level so nothing that predates providers breaks
  connections: { 'claude-code': { connected: false, checkedAt: null, version: null, method: null, error: null } },
  render: null, // { controller, res, startedAt }
  lastBuild: null, // { at, format, model, provider, seconds, costUsd }
};
const conn = (id) => (state.connections[id] ??= { connected: false, checkedAt: null, error: null });

// ---------------------------------------------------------------- helpers

function safeJoin(root, rel) {
  const clean = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const abs = path.resolve(root, clean);
  // The root itself is never a legitimate target — every caller wants a file or
  // a folder *inside* the workspace. Letting it through would make
  // `DELETE /api/file?path=` a recursive delete of everything the dreamer owns.
  if (abs === root) {
    const err = new Error('That path is the workspace itself');
    err.status = 400;
    throw err;
  }
  if (!abs.startsWith(root + path.sep)) {
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
      // the bundled binary when packaged, whatever is on PATH otherwise
      const p = CLAUDE_BIN
        ? spawn(CLAUDE_BIN, ['--version'], { windowsHide: true })
        : spawn('claude', ['--version'], { shell: true, windowsHide: true });
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
    // in the desktop build this process is Electron wearing a Node costume;
    // the costume must not be handed down to the compiler's own child process
    if (/^(ELECTRON_RUN_AS_NODE$|ELECTRON_|NODE_OPTIONS$)/.test(k)) continue;
    env[k] = v;
  }
  Object.assign(env, userSettingsEnv());
  return env;
}

// ---------------------------------------------------------------- api keys
//
// Keys live in a gitignored file next to server.js, never in the browser.
// They are only ever sent OUT masked — the full value leaves this process
// exclusively in an Authorization / x-api-key header to the provider itself.

const KEYS_FILE = path.join(DATA_DIR, '.imaginecode-keys.json');
let keyCache = null;

function readKeys() {
  if (keyCache) return keyCache;
  try { keyCache = JSON.parse(readFileSync(KEYS_FILE, 'utf8')); } catch { keyCache = {}; }
  return keyCache;
}
async function writeKeys(next) {
  keyCache = next;
  await fs.writeFile(KEYS_FILE, JSON.stringify(next, null, 2), { mode: 0o600 });
}
// stored key wins; an env var is a convenient fallback for CI / dotfiles
function providerKey(id) {
  const stored = readKeys()[id];
  if (stored) return { key: stored, source: 'saved' };
  const envVar = PROVIDERS[id]?.envVar;
  if (envVar && process.env[envVar]) return { key: process.env[envVar], source: envVar };
  return { key: null, source: null };
}
function maskKey(k) {
  if (!k) return null;
  return k.length <= 12 ? `${k.slice(0, 3)}…${k.slice(-2)}` : `${k.slice(0, 7)}…${k.slice(-4)}`;
}

// ---------------------------------------------------------------- direct provider transport

function apiError(status, text, label) {
  let msg = String(text || '').slice(0, 400);
  try {
    const j = JSON.parse(text);
    msg = j.error?.message || j.error?.type || j.message || msg;
  } catch {}
  const hint = status === 401 ? ' — the API key was rejected'
    : status === 403 ? ' — this key is not allowed to use that model'
    : status === 404 ? ' — that model is not available on this key'
    : status === 429 ? ' — rate limited, try again in a moment'
    : status >= 500 ? ' — the provider is having a moment' : '';
  const err = new Error(`${label} ${status}${hint} · ${String(msg).slice(0, 300)}`);
  err.status = status;
  return err;
}

// yields the payload of every `data:` line in an SSE response
async function* sseData(res) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
      if (line.startsWith('data:')) yield line.slice(5).trim();
    }
  }
  if (buf.startsWith('data:')) yield buf.slice(5).trim();
}

// Optional request fields (thinking, effort, token caps) differ per model and
// drift over time. Rather than maintain a compatibility matrix, we send the
// rich body first and, on a 400 that names one of those fields, retry once
// with the plainest body the API accepts.
async function postStream(url, headers, rich, plain, signal, label) {
  const send = (body) => fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal });
  let res = await send(rich);
  if (res.status === 400 && plain) {
    const text = await res.text().catch(() => '');
    if (!/thinking|effort|output_config|max_tokens|max_completion_tokens|stream_options|reasoning|temperature|unsupported|unrecognized|not supported/i.test(text)) {
      throw apiError(400, text, label);
    }
    res = await send(plain);
  }
  if (!res.ok) throw apiError(res.status, await res.text().catch(() => ''), label);
  return res;
}

async function anthropicStream({ base, apiKey, model, system, prompt, maxTokens, thinking, effort, signal, onText, onThink, onUsage }) {
  const headers = { 'x-api-key': apiKey, 'anthropic-version': ANTHROPIC_VERSION, 'content-type': 'application/json' };
  const plain = { model, max_tokens: maxTokens, system, stream: true, messages: [{ role: 'user', content: prompt }] };
  const rich = { ...plain };
  if (thinking === 'adaptive') rich.thinking = { type: 'adaptive' };
  if (effort) rich.output_config = { effort };
  const res = await postStream(`${base}/messages`, headers, rich, plain, signal, 'Anthropic API');

  let stopReason = null;
  for await (const data of sseData(res)) {
    if (!data || data === '[DONE]') continue;
    let ev; try { ev = JSON.parse(data); } catch { continue; }
    if (ev.type === 'content_block_delta') {
      if (ev.delta?.type === 'text_delta' && ev.delta.text) onText(ev.delta.text);
      else if (ev.delta?.type === 'thinking_delta' && ev.delta.thinking) onThink(ev.delta.thinking);
    } else if (ev.type === 'message_start') {
      onUsage({ in: ev.message?.usage?.input_tokens ?? 0 });
    } else if (ev.type === 'message_delta') {
      if (ev.usage?.output_tokens != null) onUsage({ out: ev.usage.output_tokens });
      if (ev.delta?.stop_reason) stopReason = ev.delta.stop_reason;
    } else if (ev.type === 'error') {
      throw new Error(ev.error?.message || 'the Anthropic stream errored');
    }
  }
  return { stopReason };
}

async function openaiStream({ base, apiKey, model, system, prompt, maxTokens, maxTokensField, effort, signal, label, onText, onThink, onUsage }) {
  const headers = { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' };
  const messages = [{ role: 'system', content: system }, { role: 'user', content: prompt }];
  const plain = { model, stream: true, messages };
  const rich = { ...plain, stream_options: { include_usage: true } };
  if (maxTokens) rich[maxTokensField || 'max_tokens'] = maxTokens;
  if (effort) rich.reasoning_effort = effort;
  const res = await postStream(`${base}/chat/completions`, headers, rich, plain, signal, label);

  let stopReason = null;
  for await (const data of sseData(res)) {
    if (!data || data === '[DONE]') continue;
    let ev; try { ev = JSON.parse(data); } catch { continue; }
    const choice = ev.choices?.[0];
    const d = choice?.delta;
    if (d?.content) onText(d.content);
    // DeepSeek (and several compatible servers) stream chain-of-thought here
    if (d?.reasoning_content) onThink(d.reasoning_content);
    if (choice?.finish_reason) stopReason = choice.finish_reason;
    if (ev.usage) onUsage({ in: ev.usage.prompt_tokens ?? 0, out: ev.usage.completion_tokens ?? 0 });
    if (ev.error) throw new Error(ev.error.message || 'the provider stream errored');
  }
  return { stopReason };
}

// ---------------------------------------------------------------- model discovery

const liveCache = {}; // providerId -> { at, key, models }

async function liveModels(id) {
  const p = PROVIDERS[id];
  const { key } = providerKey(id);
  if (!p || p.kind === 'agent' || !key) return null;
  const cached = liveCache[id];
  if (cached && cached.key === key && Date.now() - cached.at < 300_000) return cached.models;

  const headers = p.kind === 'anthropic'
    ? { 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION }
    : { Authorization: `Bearer ${key}` };
  const url = p.kind === 'anthropic' ? `${p.base}/models?limit=1000` : `${p.base}/models`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw apiError(res.status, await res.text().catch(() => ''), `${p.label} models`);
  const json = await res.json();
  const models = {};
  for (const m of json.data || []) {
    if (!m?.id) continue;
    // the chat catalogs also carry image / audio / embedding endpoints
    if (p.kind !== 'anthropic' && /embed|whisper|tts|dall-e|image|audio|realtime|moderation|transcribe|sora|clip|search/i.test(m.id)) continue;
    models[m.id] = { label: m.display_name || m.id, live: true };
  }
  liveCache[id] = { at: Date.now(), key, models };
  return models;
}

// curated entries first (they carry labels, blurbs and pricing), then anything
// else the account can actually reach
function mergeCatalog(id, live) {
  const curated = PROVIDERS[id]?.models || {};
  const out = {};
  for (const [k, v] of Object.entries(curated)) out[k] = { ...v, available: !live || !!live[k] };
  if (live) for (const [k, v] of Object.entries(live)) if (!out[k]) out[k] = { ...v, badge: 'on your account', desc: '', available: true };
  return out;
}

async function providerPayload(id) {
  const p = PROVIDERS[id];
  const { key, source } = providerKey(id);
  const payload = {
    id, label: p.label, kind: p.kind, blurb: p.blurb, needsKey: !!p.needsKey,
    keyHint: p.keyHint || null, keyUrl: p.keyUrl || null, envVar: p.envVar || null,
    hasKey: !!key, keyMask: maskKey(key), keySource: source,
    defaultModel: p.defaultModel, models: mergeCatalog(id, null),
    connection: conn(id), modelsError: null,
  };
  if (p.kind !== 'agent' && key) {
    try { payload.models = mergeCatalog(id, await liveModels(id)); }
    catch (err) { payload.modelsError = String(err?.message || err).slice(0, 220); }
  }
  return payload;
}

// ---------------------------------------------------------------- language rules
//
// The dreamer's own reference manual for the language they invented: what it is
// called, how it works in general, a syntax → meaning glossary, and worked
// examples. Without it the compiler has to *guess* what `~>` or `bloom {}`
// means from context; with it, it is told. This is the difference between an
// interpreter of vibes and a compiler for a real (if imaginary) language.
//
// Kept deliberately separate from Standing Build Notes: notes are about taste
// ("always dark mode"), rules are about MEANING, and meaning outranks taste.

const RULES_FILE = path.join(DATA_DIR, '.imaginecode-rules.json');

// Caps exist because every character here is prepended to every build. A
// runaway paste should cost the dreamer a truncation notice, not a 400 from the
// provider halfway through a build they already paid for.
const RULES_LIMITS = {
  name: 60,
  overview: 4000,
  syntax: 240,
  means: 700,
  exampleSource: 2400,
  exampleMeans: 900,
  rules: 200,
  examples: 40,
  total: 26_000,
};

const str = (v, max) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

let rulesCache = null;

// Everything that reaches the prompt or the page goes through here, so a
// hand-edited file, an older schema and a fresh install all produce the same
// shape. Ids are positional rather than random: this module has no clock and no
// randomness to lean on, and the front end only needs them to be stable within
// one payload.
function normalizeRules(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const list = (v) => (Array.isArray(v) ? v : []);
  const rules = list(r.rules)
    .map((x, i) => ({
      id: `r${i + 1}`,
      syntax: str(x?.syntax, RULES_LIMITS.syntax),
      means: str(x?.means, RULES_LIMITS.means),
      // absent means on: a rule pasted in by hand should count
      on: x?.on !== false,
    }))
    .filter((x) => x.syntax || x.means)
    .slice(0, RULES_LIMITS.rules);
  const examples = list(r.examples)
    .map((x, i) => ({
      id: `e${i + 1}`,
      source: str(x?.source, RULES_LIMITS.exampleSource),
      means: str(x?.means, RULES_LIMITS.exampleMeans),
      on: x?.on !== false,
    }))
    .filter((x) => x.source || x.means)
    .slice(0, RULES_LIMITS.examples);
  return {
    enabled: r.enabled !== false,
    name: str(r.name, RULES_LIMITS.name),
    overview: str(r.overview, RULES_LIMITS.overview),
    rules,
    examples,
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : null,
  };
}

function readRules() {
  if (rulesCache) return rulesCache;
  let raw = null;
  try { raw = JSON.parse(readFileSync(RULES_FILE, 'utf8')); } catch {}
  rulesCache = normalizeRules(raw);
  return rulesCache;
}

// Renders the spec exactly as the compiler will receive it. The UI shows the
// output of this same function, so "what the compiler reads" is never a
// well-meaning approximation of what it actually reads.
function compileRules(rules) {
  const r = normalizeRules(rules);
  if (!r.enabled) return { text: '', ruleCount: 0, exampleCount: 0, chars: 0, truncated: false };
  const on = r.rules.filter((x) => x.on && (x.syntax || x.means));
  const ex = r.examples.filter((x) => x.on && (x.source || x.means));
  if (!r.overview && !on.length && !ex.length) {
    return { text: '', ruleCount: 0, exampleCount: 0, chars: 0, truncated: false };
  }

  const named = r.name || 'this language';
  const parts = [
    `════════ THE LANGUAGE SPEC — written by the dreamer who invented ${named} ════════`,
    `This section is the AUTHORITATIVE definition of the language in the source files below. It was written by the person who invented it. Where it says what something means, that IS what it means — it outranks every general reading heuristic in your instructions, and it outranks any more natural-looking interpretation you would otherwise have reached. Read all of it before you read a single line of source.`,
  ];
  if (r.name) parts.push('', `LANGUAGE NAME: ${r.name}`);
  if (r.overview) parts.push('', 'HOW THIS LANGUAGE WORKS, IN THE DREAMER\'S OWN WORDS:', r.overview);
  if (on.length) {
    parts.push('', `SYNTAX GLOSSARY — ${on.length} rule${on.length === 1 ? '' : 's'}. Each line is binding: when the construct on the left appears in the source, it means exactly what is on the right.`);
    for (const x of on) {
      // A rule that only fills one side is still information: half a rule is a
      // sentence about the language, and dropping it silently would be worse.
      if (x.syntax && x.means) parts.push(`  · ${x.syntax}  →  ${x.means}`);
      else parts.push(`  · ${x.syntax || x.means}`);
    }
  }
  if (ex.length) {
    parts.push('', `WORKED EXAMPLES — ${ex.length} snippet${ex.length === 1 ? '' : 's'} of ${named} with the dreamer's own explanation of what each one must compile to. Treat these as test cases: source shaped like this compiles like this.`);
    for (const [i, x] of ex.entries()) {
      parts.push('', `  ── example ${i + 1} · source ──`, x.source || '(no snippet given)');
      if (x.means) parts.push(`  ── example ${i + 1} · compiles to ──`, x.means);
    }
  }
  parts.push(
    '',
    'Two things this spec does NOT license: it never adds content of its own (the fidelity law still governs everything that reaches the screen — only source lines put things on the page), and where it is silent you fall back to your normal reading. Where it speaks, it wins.',
    '════════ END OF THE LANGUAGE SPEC ════════',
  );

  let text = parts.join('\n');
  let truncated = false;
  if (text.length > RULES_LIMITS.total) {
    text = `${text.slice(0, RULES_LIMITS.total)}\n… (the language spec was truncated here because of its length — the rules above still apply)\n════════ END OF THE LANGUAGE SPEC ════════`;
    truncated = true;
  }
  return { text, ruleCount: on.length, exampleCount: ex.length, chars: text.length, truncated };
}

// what both /api/rules and /api/rules/* answer with
function rulesPayload(rules = readRules()) {
  const r = normalizeRules(rules);
  const compiled = compileRules(r);
  return {
    rules: r,
    limits: RULES_LIMITS,
    compiled: { text: compiled.text, chars: compiled.chars, ruleCount: compiled.ruleCount, exampleCount: compiled.exampleCount, truncated: compiled.truncated },
    active: !!compiled.text,
  };
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

LAW 4 — THE DREAMER'S SPEC IS THE SPEC (the authority law):
- When the prompt contains a section marked THE LANGUAGE SPEC, it was written by the person who invented this language, and it is the authoritative definition of it. Read it before the source.
- Anything it defines is settled: its meaning for a symbol, keyword, block or construct overrides the general reading heuristics below, and overrides any interpretation you find more natural. If the spec says \`~>\` means "fades in over two seconds", it does not mean "flows into", however much it looks like it.
- Its worked examples are test cases. Source shaped like an example compiles the way that example says it compiles.
- The spec defines MEANING, never content: it can tell you that \`bloom\` means a card that scales up on hover, it cannot put a card on the page. Only the source files do that, and LAW 2 still governs every pixel.
- Where the spec is silent, fall back to the heuristics below. Where it speaks, it wins. Never contradict it, never argue with it, and never mention it in your build log.

HOW TO READ THE LANGUAGE (defaults — any of these yields to the dreamer's spec):
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
1. Read the language spec, if one is given. Then read the source below.
2. Write (fresh build) or Edit (incremental build) index.html in the current working directory. Touch no other files.
3. MANDATORY SELF-AUDIT before finishing — Read the index.html you produced and check every piece of visible content:
   (a) every visible string traces to a quoted string or written word in the source;
   (b) no identifier name (MyHeader, button1, …) appears as visible text;
   (c) no invented copy anywhere — declared-but-textless elements are empty;
   (d) nothing exists that the source didn't declare;
   (e) every construct the dreamer's spec defines behaves the way the spec says, not the way it merely looks like it should.
   Fix any violation with the Edit tool before you finish. Do not skip this step.
4. Your final message: one or two short plain-text sentences for the build log, stating only facts about this build. Describe what you built or changed — NEVER list excluded, unreferenced or unchanged files. Mention only file names that actually appear in the source section above. No markdown, no code fences.`;

// The agentic path (Claude Code) writes files itself. Direct API providers have
// no tools, so they hand the finished file back inside one fenced block and we
// write it. Appended last so it overrides the tool talk in COMPILER_SYSTEM.
const DIRECT_MODE = `

════════ DIRECT MODE — THIS SECTION OVERRIDES EVERY TOOL INSTRUCTION ABOVE ════════
You have NO tools in this mode. You cannot read, write or edit files. Ignore every mention of the Write, Edit and Read tools above; the laws about WHAT to compile all still apply, unchanged.

Instead, RETURN the finished file:
- Emit the COMPLETE contents of index.html inside exactly ONE fenced code block opened with \`\`\`html and closed with \`\`\`.
- The block must be the whole file, from <!doctype html> to </html>. Never truncate it, never abbreviate it, and never write placeholders like "… rest unchanged …" or "// same as before".
- Emit nothing before the block except (optionally) your brief reasoning.
- After the closing fence, write one or two short plain-text sentences for the build log — facts about this build only. No markdown, no second code block.
- On an INCREMENTAL build the current index.html is given to you. Return the FULL updated file with the smallest possible changes applied; everything the source diff does not require must come back byte-for-byte identical.
- Run the mandatory self-audit against the file you are about to emit (every visible string traces to the source; no identifier names on screen; no invented copy; nothing undeclared; every construct the dreamer's spec defines behaves as the spec says) and fix violations before you emit it.`;

function targetLine(format) {
  return format === 'react'
    ? 'React — one self-contained index.html using React 18 UMD + ReactDOM UMD + Babel Standalone from CDN, app written as React function components with hooks in <script type="text/babel">.'
    : 'HTML — one self-contained index.html with inline <style> and <script>.';
}

// The spec goes AHEAD of the source in both prompt builders: the compiler should
// know what the language means before it meets a line of it, not reinterpret
// what it has already read.
function specParts(compiled) {
  return compiled?.text ? ['', compiled.text] : [];
}

function buildRenderPrompt({ files, entryPath, format, instructions, spec, direct }) {
  const entryFile = files.find((f) => f.path === entryPath) || files[0];
  const others = files.filter((f) => f !== entryFile);
  const parts = [
    `TARGET FORMAT: ${targetLine(format)}`,
    `ENTRY FILE: ${entryFile.path}`,
    'Compile the entry file. Modules below are included ONLY if the entry file references them by name — otherwise ignore them completely.',
  ];
  if (instructions?.trim()) parts.push(`STANDING BUILD NOTES FROM THE DREAMER: ${instructions.trim()}`);
  parts.push(...specParts(spec));
  parts.push('', `════════ ENTRY file: ${entryFile.path} ════════`, entryFile.content);
  for (const f of others) parts.push('', `════════ module (only if referenced by the entry): ${f.path} ════════`, f.content);
  parts.push('', `Compile now — exactly what is written, nothing else. Remember the fidelity law: identifiers are never visible text, textless elements stay empty, and nothing may exist without a source line.${spec?.text ? ' The dreamer\'s language spec above defines what the constructs mean — honour every rule in it.' : ''} ${direct
    ? 'Return the complete index.html in one ```html block, then the short build log message.'
    : 'Write index.html, run the mandatory self-audit, then give the short build log message.'}`);
  return parts.join('\n');
}

function buildIncrementalPrompt({ files, entryPath, format, instructions, notesChanged, specChanged, spec, changes, direct, currentHtml }) {
  const entryFile = files.find((f) => f.path === entryPath) || files[0];
  const parts = [
    'INCREMENTAL BUILD — the compiled site already exists as index.html in the current directory.',
    direct
      ? 'The current index.html is reproduced below. Return the FULL updated file with the SMALLEST possible changes applied — and ONLY those changes. Everything not required by the changes must come back byte-for-byte identical.'
      : 'Read index.html, then apply the SMALLEST edits that make it reflect the source changes below — and ONLY those changes. Use the Edit tool; do not rewrite the file. Everything not required by the changes must remain byte-for-byte untouched.',
    `TARGET FORMAT: ${targetLine(format)} (unchanged)`,
    `ENTRY FILE: ${entryPath}`,
  ];
  if (instructions?.trim()) parts.push(`STANDING BUILD NOTES${notesChanged ? ' (these changed since the last build — re-apply where relevant)' : ''}: ${instructions.trim()}`);
  parts.push(...specParts(spec));
  // A spec edit is a change to what the EXISTING build means, which no source
  // diff will show. Saying so is the only thing that makes the compiler re-read
  // the parts of the site the diff doesn't mention.
  if (specChanged) {
    parts.push('', spec?.text
      ? 'THE LANGUAGE SPEC ABOVE CHANGED SINCE THE LAST BUILD. Re-read it, then re-check the existing build against it: anything the previous build got wrong under the old spec (or under a guess, where there was no spec) must be corrected now, even where the source did not change. Keep the edits minimal and targeted — this is still an incremental build.'
      : 'THE LANGUAGE SPEC WAS REMOVED SINCE THE LAST BUILD. Keep the existing build as it is except where the source changes below require otherwise — do not undo interpretations that still match the source.');
  }
  parts.push('', 'SOURCE CHANGES SINCE THE LAST BUILD:');
  for (const c of changes.changed) {
    parts.push('', `════════ ${c.path} — PREVIOUS version ════════`, c.prev, '', `════════ ${c.path} — CURRENT version ════════`, c.curr);
  }
  for (const a of changes.added) parts.push('', `════════ ${a.path} — NEW file ════════`, a.curr);
  for (const r of changes.removed) parts.push('', `════════ ${r.path} — DELETED (its previous content, remove what it produced if the entry referenced it) ════════`, r.prev);
  parts.push('', 'FULL CURRENT SOURCE for fidelity reference — the existing build traces to these files (entry first, then modules that count only if the entry references them). Content that traces to any of them is legitimate; do NOT remove it unless the diff above removed its source line:');
  parts.push('', `════════ ENTRY: ${entryFile?.path ?? entryPath} ════════`, entryFile?.content ?? '');
  for (const f of files.filter((x) => x !== entryFile)) parts.push('', `════════ module: ${f.path} ════════`, f.content);
  if (direct && currentHtml) parts.push('', '════════ CURRENT index.html — the build you are updating ════════', currentHtml);
  parts.push('', `Apply the minimal edits now — change only what the diff requires, verify against the FULL source (identifiers never visible, no invented copy, nothing unwritten, nothing written removed)${spec?.text ? ', and against the dreamer\'s language spec above (every construct it defines behaves as it says)' : ''}. ${direct
    ? 'Return the complete updated index.html in one ```html block, then the short build log message.'
    : 'Then give the short build log message.'}`);
  return parts.join('\n');
}

// ---------------------------------------------------------------- direct build plumbing

// Splits a streamed response into prose (build log / reasoning, shown verbatim
// in the Imagine Terminal) and code (shown as a live byte counter — nobody
// wants 60KB of markup scrolling past). Fence markers can straddle chunk
// boundaries, so the tail is held back until it can't be a partial fence.
function makeSink(res) {
  let full = '', pending = '', inCode = false, codeChars = 0, lastTick = 0;
  const tick = (force) => {
    if (!force && Date.now() - lastTick < 300) return;
    lastTick = Date.now();
    ndjson(res, { type: 'code', chars: codeChars });
  };
  const out = (s) => {
    if (inCode) { codeChars += s.length; tick(); }
    else ndjson(res, { type: 'delta', text: s });
  };
  return {
    text(s) {
      full += s;
      pending += s;
      for (;;) {
        const i = pending.indexOf('```');
        if (i === -1) {
          const keep = Math.min(2, pending.length); // could be a fence being born
          const emit = pending.slice(0, pending.length - keep);
          pending = pending.slice(pending.length - keep);
          if (emit) out(emit);
          return;
        }
        if (i) out(pending.slice(0, i));
        pending = pending.slice(i + 3);
        inCode = !inCode;
        if (inCode) ndjson(res, { type: 'stage', text: 'writing index.html…' });
      }
    },
    end() {
      if (pending) { out(pending); pending = ''; }
      tick(true);
      return full;
    },
    get codeChars() { return codeChars; },
  };
}

// Pulls index.html and the build-log sentence out of the model's reply.
function extractBuild(text) {
  let html = null, log = '';
  const blocks = [...text.matchAll(/```[a-zA-Z]*[ \t]*\r?\n([\s\S]*?)```/g)];
  if (blocks.length) {
    const best = blocks.reduce((a, b) => (b[1].length > a[1].length ? b : a));
    html = best[1];
    log = text.slice(best.index + best[0].length).trim() || text.slice(0, best.index).trim();
  } else {
    // unterminated fence, or a model that skipped the fence entirely
    const i = text.search(/<!doctype html|<html[\s>]/i);
    if (i >= 0) {
      const end = text.toLowerCase().lastIndexOf('</html>');
      html = end > i ? text.slice(i, end + 7) : text.slice(i);
      log = text.slice(0, i).replace(/```[a-zA-Z]*\s*$/, '').trim();
    }
  }
  if (html != null) html = html.replace(/\s+$/, '') + '\n';
  log = log.replace(/```[\s\S]*?```/g, '').replace(/^#+\s*/gm, '').trim().slice(0, 600);
  return { html, log };
}

function estimateCost(modelInfo, usage) {
  const p = modelInfo?.price;
  if (!p || (!usage.in && !usage.out)) return null;
  return ((usage.in || 0) * p.in + (usage.out || 0) * p.out) / 1_000_000;
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

app.get('/api/status', async (req, res) => {
  const providers = {};
  for (const id of Object.keys(PROVIDERS)) providers[id] = await providerPayload(id);
  const spec = compileRules(readRules());
  res.json({
    ...conn('claude-code'),            // legacy top level = the Claude Code connection
    models: MODELS, defaultModel: DEFAULT_MODEL,
    providers, defaultProvider: DEFAULT_PROVIDER,
    // whether a language spec is in play is part of "what will the next build do"
    rules: { active: !!spec.text, ruleCount: spec.ruleCount, exampleCount: spec.exampleCount },
    lastBuild: state.lastBuild, building: !!state.render,
  });
});

app.get('/api/providers', async (req, res) => {
  const providers = {};
  for (const id of Object.keys(PROVIDERS)) providers[id] = await providerPayload(id);
  res.json({ providers, defaultProvider: DEFAULT_PROVIDER });
});

// Save (or clear) a key. The key itself is never echoed back — only its mask.
app.put('/api/provider/key', async (req, res) => {
  const { provider, key } = req.body || {};
  const p = PROVIDERS[provider];
  if (!p || !p.needsKey) return res.status(400).json({ error: 'Unknown provider' });
  const keys = { ...readKeys() };
  const trimmed = String(key ?? '').trim();
  if (trimmed) keys[provider] = trimmed; else delete keys[provider];
  try { await writeKeys(keys); } catch (err) { return res.status(500).json({ error: `Could not save the key — ${err.message}` }); }
  delete liveCache[provider];
  state.connections[provider] = { connected: false, checkedAt: null, error: null };
  res.json(await providerPayload(provider));
});

app.delete('/api/provider/key', async (req, res) => {
  const provider = String(req.query.provider || '');
  if (!PROVIDERS[provider]) return res.status(400).json({ error: 'Unknown provider' });
  const keys = { ...readKeys() };
  delete keys[provider];
  try { await writeKeys(keys); } catch (err) { return res.status(500).json({ error: err.message }); }
  delete liveCache[provider];
  state.connections[provider] = { connected: false, checkedAt: null, error: null };
  res.json(await providerPayload(provider));
});

// force a fresh GET /v1/models
app.post('/api/provider/models/refresh', async (req, res) => {
  const provider = String(req.body?.provider || '');
  if (!PROVIDERS[provider]) return res.status(400).json({ error: 'Unknown provider' });
  delete liveCache[provider];
  res.json(await providerPayload(provider));
});

app.post('/api/connect', async (req, res) => {
  const providerId = PROVIDERS[req.body?.provider] ? req.body.provider : DEFAULT_PROVIDER;
  const t0 = Date.now();

  // ── direct API providers: the key round-trips against GET /v1/models, which
  //    proves the credential, the network path and which models it can reach
  if (PROVIDERS[providerId].kind !== 'agent') {
    const p = PROVIDERS[providerId];
    const { key, source } = providerKey(providerId);
    if (!key) {
      state.connections[providerId] = {
        connected: false, checkedAt: new Date().toISOString(), method: p.label,
        error: `No ${p.label} key yet — paste one in Settings → Compiler Provider.`,
      };
      return res.json({ ...state.connections[providerId], provider: providerId });
    }
    try {
      const live = await liveModels(providerId);
      const wanted = req.body?.model;
      const count = live ? Object.keys(live).length : 0;
      state.connections[providerId] = {
        connected: true,
        checkedAt: new Date().toISOString(),
        version: count ? `${count} model${count === 1 ? '' : 's'} available` : 'key accepted',
        method: source === 'saved' ? `${p.label} key` : `${p.label} key (${source})`,
        latencyMs: Date.now() - t0,
        error: null,
        warning: wanted && live && count && !live[wanted]
          ? `${wanted} isn't in this account's model list — builds with it may 404.` : null,
      };
    } catch (err) {
      state.connections[providerId] = {
        connected: false, checkedAt: new Date().toISOString(), method: p.label,
        latencyMs: Date.now() - t0, error: String(err?.message || err).slice(0, 300),
      };
    }
    return res.json({ ...state.connections[providerId], provider: providerId });
  }

  // ── Claude Code: handshake through the Agent SDK
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
        ...claudeExec(),
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
    state.connections['claude-code'] = {
      connected: ok,
      checkedAt: new Date().toISOString(),
      version: version || 'Claude Agent SDK (bundled)',
      method: method || 'Claude Code login',
      latencyMs: Date.now() - t0,
      error: ok ? null : String(resultMsg || 'Handshake reply was not successful').slice(0, 300),
    };
  } catch (err) {
    clearTimeout(timeout);
    state.connections['claude-code'] = {
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
  res.json({ ...state.connections['claude-code'], provider: 'claude-code' });
});

// ---------------------------------------------------------------- API: prefs
//
// Small key/value bag for things that must outlive a page origin — the desktop
// app can land on a different port than last time, which would silently reset
// anything kept in localStorage. "have you seen the introduction yet" is
// exactly that kind of fact.

const PREFS_FILE = path.join(DATA_DIR, '.imaginecode-prefs.json');
let prefsCache = null;
function readPrefs() {
  if (prefsCache) return prefsCache;
  try { prefsCache = JSON.parse(readFileSync(PREFS_FILE, 'utf8')); } catch { prefsCache = {}; }
  return prefsCache;
}

// write to a sibling then rename, so an interrupted save can never leave a
// truncated file where the previous good one was
async function writeJsonAtomic(file, value, mode) {
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), mode ? { mode } : undefined);
  await fs.rename(tmp, file);
}

app.get('/api/prefs', (req, res) => res.json(readPrefs()));

app.put('/api/prefs', async (req, res) => {
  const next = { ...readPrefs(), ...(req.body || {}) };
  try { await writeJsonAtomic(PREFS_FILE, next); }
  catch (err) { return res.status(500).json({ error: err.message }); }
  // only trust the cache once the bytes are actually on disk
  prefsCache = next;
  res.json(next);
});

// ---------------------------------------------------------------- API: language rules

app.get('/api/rules', (req, res) => res.json(rulesPayload()));

app.put('/api/rules', async (req, res) => {
  const next = normalizeRules(req.body?.rules ?? req.body);
  const prev = readRules();
  // the timestamp is what the UI shows as "saved just now"; only move it when
  // something a build would actually notice changed
  const same = JSON.stringify({ ...prev, updatedAt: null }) === JSON.stringify({ ...next, updatedAt: null });
  next.updatedAt = same ? prev.updatedAt : new Date().toISOString();
  try { await writeJsonAtomic(RULES_FILE, next); }
  catch (err) { return res.status(500).json({ error: `Could not save the language rules — ${err.message}` }); }
  rulesCache = next;
  res.json(rulesPayload(next));
});

// Render an unsaved draft exactly as the compiler would see it, so the editor's
// preview cannot drift from the real thing.
app.post('/api/rules/preview', (req, res) => {
  res.json(rulesPayload(normalizeRules(req.body?.rules ?? req.body)));
});

// ---------------------------------------------------------------- API: rules from the source
//
// Reading your own invented language back to yourself is the hard part of
// writing it down. This asks the configured provider to do a first pass over the
// workspace and propose a glossary, which the dreamer then edits — it is never
// saved automatically, and never overwrites what they already wrote.

const INFER_SYSTEM = `You are a linguist reading source code written in a programming language that does not exist. Your job is to document the language, NOT to compile it, judge it, or improve it.

Return ONLY a JSON object, no prose and no code fence, with exactly this shape:
{"name":"...","overview":"...","rules":[{"syntax":"...","means":"..."}],"examples":[{"source":"...","means":"..."}]}

- name: what this language appears to be called, or a short apt name for it (max 60 chars). If the source names itself, use that name.
- overview: 2-5 sentences on how the language works as a whole — its shape, how structure is expressed, what kind of program it describes. Describe the system, not the specific page in front of you.
- rules: 5-14 entries, most distinctive first. "syntax" is the construct exactly as it appears, generalised with a placeholder where a value varies (e.g. "x -> y", "[ label ]", "vibe = <words>"). "means" is one precise sentence on what a compiler must DO with it. Only include constructs that actually appear in the source. Never invent syntax that isn't there.
- examples: 1-3 short snippets copied VERBATIM from the source (2-6 lines each), each with one or two sentences on what it must compile to.
- Describe the LANGUAGE, never the content: "quoted text becomes literal copy on the page", never "the page says we open at six".
- If a construct's meaning is genuinely ambiguous, say what it most likely means and keep the sentence short — the dreamer will correct you.`;

app.post('/api/rules/infer', async (req, res) => {
  const providerId = PROVIDERS[req.body?.provider] ? req.body.provider : DEFAULT_PROVIDER;
  const provider = PROVIDERS[providerId];
  const direct = provider.kind !== 'agent';

  const files = await collectSources(WORKSPACE);
  if (!files.length) return res.status(400).json({ error: 'The workspace is empty — write some of your language first, then ask for a reading.' });

  // the entry file leads; the rest are context, trimmed so a big workspace
  // can't turn one convenience button into an enormous bill
  const entryPath = files.some((f) => f.path === req.body?.entry) ? req.body.entry : files[0].path;
  const entryFile = files.find((f) => f.path === entryPath);
  const others = files.filter((f) => f !== entryFile);
  let budget = 60_000;
  const parts = [`════════ ${entryFile.path} ════════`, entryFile.content.slice(0, budget)];
  budget -= Math.min(budget, entryFile.content.length);
  for (const f of others) {
    if (budget <= 2000) { parts.push('', `(${others.length - others.indexOf(f)} further file(s) omitted for length)`); break; }
    const slice = f.content.slice(0, budget);
    parts.push('', `════════ ${f.path} ════════`, slice);
    budget -= slice.length;
  }
  const prompt = `Document the language these files are written in.\n\n${parts.join('\n')}\n\nReturn only the JSON object.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  res.on('close', () => { if (!res.writableEnded) controller.abort(); });
  // The reading can take minutes, and the dreamer is free to close the tab or
  // navigate away in the middle of it. Every answer goes through here so a late
  // reply to a client that has already gone is dropped rather than thrown.
  const reply = (status, body) => { if (!res.writableEnded) res.status(status).json(body); };

  try {
    let text = '';
    if (direct) {
      const { key: apiKey } = providerKey(providerId);
      if (!apiKey) return reply(400, { error: `No ${provider.label} key saved — add one in Settings → Compiler Provider.` });
      const catalog = mergeCatalog(providerId, liveCache[providerId]?.models || null);
      const modelId = catalog[req.body?.model] ? req.body.model : (typeof req.body?.model === 'string' && req.body.model.trim()) || provider.defaultModel;
      const common = {
        base: provider.base, apiKey, model: modelId,
        system: INFER_SYSTEM, prompt,
        maxTokens: Math.min(provider.maxOut || 8000, 8000),
        signal: controller.signal,
        onText: (t) => { text += t; },
        onThink: () => {},
        onUsage: () => {},
      };
      if (provider.kind === 'anthropic') await anthropicStream({ ...common, thinking: null });
      else await openaiStream({ ...common, maxTokensField: provider.maxTokensField, label: provider.label });
    } else {
      const modelId = MODELS[req.body?.model] ? req.body.model : DEFAULT_MODEL;
      const q = query({
        prompt,
        options: {
          model: modelId,
          systemPrompt: INFER_SYSTEM,
          allowedTools: [],
          maxTurns: 1,
          settingSources: ['user'],
          abortController: controller,
          env: sdkEnv(),
          ...claudeExec(),
        },
      });
      for await (const msg of q) {
        if (msg.type === 'result') {
          if (msg.is_error) throw new Error(String(msg.result || msg.subtype || 'the reading failed'));
          text = String(msg.result || '');
        }
      }
    }
    // models fence JSON however they like; take the outermost object
    let parsed = null;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    for (const candidate of [fenced?.[1], text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1), text]) {
      if (!candidate) continue;
      try { parsed = JSON.parse(candidate); break; } catch {}
    }
    if (!parsed || typeof parsed !== 'object') {
      return reply(502, { error: `${provider.label} replied without a usable reading of the language. Try again, or write the rules yourself.` });
    }
    // proposals are normalized like everything else, but never written to disk —
    // the dreamer reviews them and presses Save themselves
    const proposal = normalizeRules({ ...parsed, enabled: true });
    if (!proposal.overview && !proposal.rules.length) {
      return reply(502, { error: 'The reading came back empty. Try again with more of your language written down.' });
    }
    reply(200, { proposal, from: { provider: providerId, entry: entryPath, files: files.length } });
  } catch (err) {
    if (controller.signal.aborted || err?.name === 'AbortError') {
      return reply(504, { error: 'The reading timed out before it finished.' });
    }
    reply(502, { error: String(err?.message || err).slice(0, 300) });
  } finally {
    // every path, including the early returns above — a stray 3-minute timer
    // would otherwise sit on the event loop long after the answer was sent
    clearTimeout(timeout);
  }
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
  const { entry, format = 'html', model, effort, instructions, fresh } = req.body || {};
  const providerId = PROVIDERS[req.body?.provider] ? req.body.provider : DEFAULT_PROVIDER;
  const provider = PROVIDERS[providerId];
  const direct = provider.kind !== 'agent';

  // curated entries carry effort/pricing metadata; live-discovered ids don't,
  // but they are still perfectly valid to compile with — so for direct
  // providers any non-empty id is passed straight through (a wrong one comes
  // back as a clear 404 from the provider rather than a silent substitution)
  const catalog = mergeCatalog(providerId, direct ? liveCache[providerId]?.models || null : null);
  const modelId = catalog[model] ? model : (direct && typeof model === 'string' && model.trim()) || provider.defaultModel;
  const modelInfo = catalog[modelId] || {};

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
    const { key: apiKey } = direct ? providerKey(providerId) : { key: null };
    if (direct && !apiKey) {
      ndjson(res, { type: 'error', message: `No ${provider.label} key saved — add one in Settings → Compiler Provider.` });
      res.end(); return finish();
    }

    const files = await collectSources(WORKSPACE);
    if (!files.length) {
      ndjson(res, { type: 'error', message: 'The workspace is empty — imagine something first.' });
      res.end(); return finish();
    }
    const entryPath = files.some((f) => f.path === entry) ? entry : files[0].path;

    // The spec is read fresh per build (the dreamer may have just edited it) and
    // compared against what the last build was compiled under, because an edit
    // to it changes the meaning of source that did not itself change.
    const spec = compileRules(readRules());

    // incremental unless: first build, forced fresh, or format/entry changed
    const manifest = fresh ? null : await readManifest();
    const canIncrement = !!manifest && existsSync(path.join(OUTPUT, 'index.html'))
      && manifest.format === format && manifest.entry === entryPath;
    let mode = 'fresh', changes = null;
    const notesChanged = (manifest?.instructions || '') !== (instructions || '');
    const specNowChanged = (manifest?.spec || '') !== (spec.text || '');
    if (canIncrement) {
      changes = diffSources(manifest.sources || {}, files);
      const changeCount = changes.changed.length + changes.added.length + changes.removed.length;
      if (!changeCount && !notesChanged && !specNowChanged) {
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
    ndjson(res, { type: 'stage', text: `imagine build --entry ${entryPath} --target ${format} --via ${providerId} --model ${modelId}${effortLevel ? `[${effortLevel}]` : ''}${mode === 'incremental' ? ' --incremental' : ''}` });
    if (spec.text) {
      ndjson(res, { type: 'stage', text: `reading your language spec… ${spec.ruleCount} rule${spec.ruleCount === 1 ? '' : 's'}${spec.exampleCount ? `, ${spec.exampleCount} worked example${spec.exampleCount === 1 ? '' : 's'}` : ''} — the compiler follows these over its own guesses` });
      if (spec.truncated) ndjson(res, { type: 'stage', text: 'the spec was long enough to be truncated — trim it in Language Rules if the compiler starts missing rules' });
    }
    if (mode === 'incremental') {
      const n = changes.changed.length + changes.added.length + changes.removed.length;
      ndjson(res, { type: 'stage', text: `${direct ? 'rewriting' : 'editing'} the existing build — ${n} source change${n === 1 ? '' : 's'}${notesChanged ? ' + updated build notes' : ''}${specNowChanged ? ' + updated language spec' : ''}, everything else stays untouched` });
    } else {
      ndjson(res, { type: 'stage', text: `reading imagination… ${files.length} file${files.length === 1 ? '' : 's'}, ${files.reduce((n, f) => n + f.content.split('\n').length, 0)} lines` });
    }

    const indexPath = path.join(OUTPUT, 'index.html');
    const writeManifest = () => fs.writeFile(MANIFEST(), JSON.stringify({
      entry: entryPath,
      format,
      provider: providerId,
      instructions: instructions || '',
      // the compiled spec text, so the next build can tell whether the meaning
      // of the language changed under a site that already exists
      spec: spec.text || '',
      sources: Object.fromEntries(files.map((f) => [f.path, f.content])),
      at: new Date().toISOString(),
    })).catch(() => {});

    // ══════════ direct API providers: one streamed pass, we write the file ══════════
    if (direct) {
      const currentHtml = mode === 'incremental' ? await fs.readFile(indexPath, 'utf8').catch(() => null) : null;
      const prompt = mode === 'incremental'
        ? buildIncrementalPrompt({ files, entryPath, format, instructions, notesChanged, specChanged: specNowChanged, spec, changes, direct: true, currentHtml })
        : buildRenderPrompt({ files, entryPath, format, instructions, spec, direct: true });

      ndjson(res, { type: 'stage', text: `compiler online · ${provider.label} · ${modelId}` });
      const sink = makeSink(res);
      const usage = { in: 0, out: 0 };
      const common = {
        base: provider.base, apiKey, model: modelId,
        system: COMPILER_SYSTEM + DIRECT_MODE, prompt,
        maxTokens: provider.maxOut, effort: effortLevel, signal: controller.signal,
        onText: (t) => sink.text(t),
        onThink: (t) => ndjson(res, { type: 'think', text: t }),
        onUsage: (u) => Object.assign(usage, u),
      };
      const { stopReason } = provider.kind === 'anthropic'
        ? await anthropicStream({ ...common, thinking: modelInfo.thinking })
        : await openaiStream({ ...common, maxTokensField: provider.maxTokensField, label: provider.label });
      const full = sink.end();

      const seconds = ((Date.now() - t0) / 1000).toFixed(1);
      if (stopReason === 'max_tokens' || stopReason === 'length') {
        ndjson(res, { type: 'error', message: `build failed after ${seconds}s — ${modelId} hit its output limit mid-file. Try a model with a bigger output budget, or split the imagination into smaller files.` });
        res.end(); return finish();
      }
      const { html, log } = extractBuild(full);
      if (!html || !/<\s*html|<!doctype/i.test(html)) {
        ndjson(res, { type: 'error', message: `build failed after ${seconds}s — ${provider.label} replied without an index.html code block.` });
        res.end(); return finish();
      }

      await fs.mkdir(OUTPUT, { recursive: true });
      await fs.writeFile(indexPath, html, 'utf8');
      ndjson(res, { type: 'tool', name: 'Write', file: 'index.html' });
      await writeManifest();

      const costUsd = estimateCost(modelInfo, usage);
      conn(providerId).connected = true;
      conn(providerId).error = null;
      state.lastBuild = { at: new Date().toISOString(), format, provider: providerId, model: modelId, seconds: Number(seconds), costUsd };
      ndjson(res, { type: 'summary', text: log || `Compiled ${entryPath} into index.html.` });
      ndjson(res, { type: 'done', ok: true, seconds: Number(seconds), costUsd, tokens: usage, url: '/preview/' });
      res.end(); return finish();
    }

    // ══════════ Claude Code: the agentic path ══════════
    const q = query({
      prompt: mode === 'incremental'
        ? buildIncrementalPrompt({ files, entryPath, format, instructions, notesChanged, specChanged: specNowChanged, spec, changes })
        : buildRenderPrompt({ files, entryPath, format, instructions, spec }),
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
        ...claudeExec(),
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
    const built = existsSync(indexPath);

    if (finalResult && !finalResult.is_error && built) {
      const costUsd = finalResult.total_cost_usd ?? null;
      state.lastBuild = { at: new Date().toISOString(), format, provider: providerId, model: modelId, seconds: Number(seconds), costUsd };
      conn('claude-code').connected = true;
      await writeManifest();
      ndjson(res, { type: 'summary', text: finalResult.result || '' });
      ndjson(res, { type: 'done', ok: true, seconds: Number(seconds), costUsd, url: '/preview/' });
    } else if (controller.signal.aborted) {
      ndjson(res, { type: 'error', message: `build stopped after ${seconds}s` });
    } else {
      const reason = finalResult?.result || finalResult?.subtype || 'the compiler produced no output';
      ndjson(res, { type: 'error', message: `build failed after ${seconds}s — ${String(reason).slice(0, 400)}` });
    }
  } catch (err) {
    if (controller.signal.aborted || err?.name === 'AbortError') {
      ndjson(res, { type: 'error', message: 'build stopped' });
    } else {
      // an already-explained provider error (401, 429, output limit…) reads better
      // on its own than wrapped in "the compiler crashed"
      const raw = String(err?.message || err).slice(0, 400);
      const explained = direct && /\b(4\d\d|5\d\d)\b|key|limit|quota|credit/i.test(raw);
      ndjson(res, { type: 'error', message: explained ? raw : `compiler crashed — ${raw}` });
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

// Monaco is vendored into node_modules so the desktop app has a working editor
// with no internet at all; a bare checkout that skipped the dependency still
// falls back to the CDN through IMAGINE_ENV below.
// The path carries the version so the immutable caching is honest — an app
// update ships a different URL rather than a browser cache full of last
// release's editor.
if (hasLocalMonaco) app.use(MONACO_BASE, express.static(MONACO_LOCAL, { maxAge: '7d', immutable: true }));

// what the front end needs to know about the process serving it
app.get('/env.js', (req, res) => {
  res.type('application/javascript').send(
    `window.IMAGINE_ENV=${JSON.stringify({
      monacoBase: hasLocalMonaco ? MONACO_BASE : MONACO_CDN,
      monacoCdn: MONACO_CDN,
      desktop: !!process.env.IMAGINECODE_DESKTOP,
      version: process.env.IMAGINECODE_VERSION || null,
    })};`
  );
});

app.use(express.static(PUBLIC));

// ---------------------------------------------------------------- boot

// A brand-new install opens on an empty explorer, which is a bleak first
// impression for an IDE whose whole point is "look what you can write".
// The seed imaginations are copied in exactly once, and never restored after
// the dreamer deletes them.
async function seedWorkspace() {
  if (!existsSync(SEED)) return;
  // the flag, not the emptiness of the directory, is what makes this once-only:
  // deleting both examples should not conjure them back on the next launch
  if (readPrefs().seeded) return;
  let existing = [];
  try { existing = await fs.readdir(WORKSPACE); } catch {}
  if (existing.length) return;
  try {
    await fs.cp(SEED, WORKSPACE, { recursive: true });
    const next = { ...readPrefs(), seeded: true };
    await writeJsonAtomic(PREFS_FILE, next);
    prefsCache = next;
  } catch (err) {
    console.error('could not seed the workspace —', err.message);
  }
}

async function ensureDirs() {
  await fs.mkdir(WORKSPACE, { recursive: true });
  await fs.mkdir(OUTPUT, { recursive: true });
  await fs.mkdir(PUBLIC, { recursive: true });
  await seedWorkspace();
}

const BASE_PORT = Number(process.env.PORT) || 3333;
async function start(port, attempt = 0) {
  await ensureDirs();
  const server = app.listen(port, '127.0.0.1', () => {
    console.log('');
    console.log('  ✦ ImagineCode — the compiler for languages that don\'t exist yet');
    console.log(`  ✦ IDE:     http://localhost:${port}`);
    console.log(`  ✦ Preview: http://localhost:${port}/preview/`);
    console.log('');
    // the desktop shell waits for this before it opens a window
    process.send?.({ type: 'listening', port, url: `http://127.0.0.1:${port}` });
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 10) start(port + 1, attempt + 1);
    else {
      console.error(err);
      process.send?.({ type: 'fatal', message: String(err?.message || err) });
      process.exit(1);
    }
  });
}
start(BASE_PORT);
