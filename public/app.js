/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — front-end
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ─────────────── icons (16×16, stroke = currentColor) ─────────────── */
const I = {
  files:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M5.5 2.5h5l3 3v8h-8z"/><path d="M10.5 2.5v3h3"/><path d="M5.5 5.5h-3v8h6"/></svg>',
  search:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="6.7" cy="6.7" r="4.2"/><path d="m9.9 9.9 3.6 3.6"/></svg>',
  play:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4.5 2.8v10.4L13 8z" stroke-linejoin="round"/></svg>',
  gear:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M12.4 3.6l-1.2 1.2M4.8 11.2l-1.2 1.2"/></svg>',
  zap:      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8.8 1.5 3.5 9h3.4l-.7 5.5L11.5 7H8.1z" stroke-linejoin="round"/></svg>',
  newFile:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M4 1.5h5l3 3V12"/><path d="M9 1.5v3h3"/><path d="M4 1.5v6M12 12v2.5M4 10.5v4M2 12.5h4M10 14.5h4"/></svg>',
  newFolder:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M1.5 3.5h4l1.5 2h6.5v7h-12z"/><path d="M8 8.2v3.6M6.2 10h3.6"/></svg>',
  refresh:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9"/><path d="M13.7 1.6v3h-3"/></svg>',
  collapse: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="m4 9.5 4-3.5 4 3.5M4 13.5 8 10l4 3.5"/><path d="M2.5 3h11"/></svg>',
  close:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
  split:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1"><rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1"/><path d="M9.4 2.8v10.4"/></svg>',
  external: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 2.5h4.5V7M13.2 2.8 7.5 8.5M11 9v4.5H2.5V5H7"/></svg>',
  stop:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="4" y="4" width="8" height="8" rx="0.5"/></svg>',
  clear:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="8" cy="8" r="5.6"/><path d="M4.2 11.8 11.8 4.2"/></svg>',
  chevDown: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="m4 6 4 4 4-4"/></svg>',
<<<<<<< HEAD
=======
  rules:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.1"><path d="M3 2.5h7.5l2.5 2.5v8.5H3z"/><path d="M10.5 2.5v2.5H13"/><path d="M5 7h6M5 9.3h6M5 11.6h3.5"/></svg>',
  trash:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3.2 4.6h9.6M6.4 4.6V3.2h3.2v1.4M4.4 4.6l.6 8.2h6l.6-8.2"/></svg>',
  grip:     '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/><circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/></svg>',
>>>>>>> df90e14 (Changes)
};

/* ─────────────── state ─────────────── */
const S = {
  tree: [],
  tabs: [],                 // {id, kind:'file'|'welcome'|'settings', path?, name}
  active: null,
  models: {},               // path -> monaco model
  savedVersions: {},        // path -> alternativeVersionId at last save
  viewStates: {},
  dirty: new Set(),
  expanded: new Set(),
  selectedPath: null,
<<<<<<< HEAD
  settings: { format: 'html', model: 'claude-sonnet-5', notes: '', entry: '' },
  catalog: {},
=======
  settings: { format: 'html', provider: 'claude-code', model: 'claude-sonnet-5', models: {}, notes: '', entry: '' },
  providers: {},             // id -> { label, models, hasKey, keyMask, connection, … }
>>>>>>> df90e14 (Changes)
  connection: { connected: false },
  building: false,
  previewOpen: false,
  recents: [],
};
let editor = null;
let tabSeq = 0;

<<<<<<< HEAD
/* ─────────────── settings persistence ─────────────── */
function loadLocal() {
  try { Object.assign(S.settings, JSON.parse(localStorage.getItem('imaginecode.settings') || '{}')); } catch {}
  try { S.recents = JSON.parse(localStorage.getItem('imaginecode.recents') || '[]'); } catch {}
}
function saveSettings() { localStorage.setItem('imaginecode.settings', JSON.stringify(S.settings)); updateStatusChips(); }
function pushRecent(p) {
  S.recents = [p, ...S.recents.filter((r) => r !== p)].slice(0, 6);
  localStorage.setItem('imaginecode.recents', JSON.stringify(S.recents));
=======
/* ─────────────── provider helpers ─────────────── */
const prov = (id = S.settings.provider) => S.providers[id] || null;
function curModel() {
  const p = prov();
  const picked = S.settings.models?.[S.settings.provider];
  if (picked) return picked;
  return p?.defaultModel || S.settings.model;
}
function setModel(id) {
  (S.settings.models ??= {})[S.settings.provider] = id;
  S.settings.model = id;   // mirrored so a downgraded build still finds a model
  saveSettings();
}
function providerLabel(id = S.settings.provider) { return prov(id)?.label || 'Claude Code'; }
function modelLabel(id = curModel()) { return prov()?.models?.[id]?.label || String(id).replace(/^claude-/, ''); }
// a direct-API provider is usable the moment it has a key; claude-code needs a handshake
function providerReady(id = S.settings.provider) {
  const p = prov(id);
  if (!p) return false;
  return p.needsKey ? !!p.hasKey : !!p.connection?.connected;
}

/* ─────────────── settings persistence ─────────────── */
//
// localStorage is keyed by origin, and the origin includes the port — which
// shifts whenever 3333 is already taken. Everything is therefore mirrored to
// the server's prefs file, which belongs to the install rather than to a port,
// and localStorage is kept as the fast local read.

async function loadLocal() {
  let local = {}, recents = [];
  try { local = JSON.parse(localStorage.getItem('imaginecode.settings') || '{}'); } catch {}
  try { recents = JSON.parse(localStorage.getItem('imaginecode.recents') || '[]'); } catch {}

  // nothing here yet: this may be the same install on a different port
  if (!Object.keys(local).length || !recents.length) {
    try {
      const prefs = await api('/api/prefs');
      if (!Object.keys(local).length && prefs.settings) local = prefs.settings;
      if (!recents.length && Array.isArray(prefs.recents)) recents = prefs.recents;
    } catch {}
  }
  Object.assign(S.settings, local);
  S.recents = recents;
}

let mirrorTimer = null;
function mirrorPrefs() {
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => {
    fetch('/api/prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: S.settings, recents: S.recents }),
    }).catch(() => {});
  }, 800);
}

function saveSettings() {
  localStorage.setItem('imaginecode.settings', JSON.stringify(S.settings));
  mirrorPrefs();
  updateStatusChips();
}
function pushRecent(p) {
  S.recents = [p, ...S.recents.filter((r) => r !== p)].slice(0, 6);
  localStorage.setItem('imaginecode.recents', JSON.stringify(S.recents));
  mirrorPrefs();
>>>>>>> df90e14 (Changes)
}

/* ─────────────── api ─────────────── */
async function api(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg = res.statusText;
    try { msg = (await res.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
const jsonBody = (obj) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });

/* ─────────────── file chips ─────────────── */
const KNOWN_CHIPS = {
  html: '#ff9c6b', css: '#8fa8ff', js: '#f2d24e', jsx: '#7cd8e8', json: '#c4c98a', md: '#a0b4e8',
};
function chipFor(name) {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
  if (KNOWN_CHIPS[ext]) return { bg: KNOWN_CHIPS[ext], ext };
  let h = 0;
  for (const c of ext || name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return { bg: `hsl(${h} 55% 64%)`, ext };
}
function chipHTML(name) {
  const c = chipFor(name);
  return `<span class="file-chip" style="background:${c.bg}" title=".${esc(c.ext || '?')}"></span>`;
}

/* ═══════════════ MONACO ═══════════════ */
<<<<<<< HEAD
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
require(['vs/editor/editor.main'], () => {
=======

// The desktop build serves Monaco from disk so the editor exists with no
// internet; a plain checkout without the dependency falls back to the CDN.
const ENV = window.IMAGINE_ENV || {};
const MONACO_CDN = ENV.monacoCdn || 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(s);
  });
}

async function bootMonaco() {
  let base = ENV.monacoBase || MONACO_CDN;
  try {
    await loadScript(`${base}/loader.js`);
  } catch {
    if (base === MONACO_CDN) throw new Error('Monaco could not be loaded');
    base = MONACO_CDN;
    await loadScript(`${base}/loader.js`);
  }
  require.config({ paths: { vs: base } });
  await new Promise((resolve) => require(['vs/editor/editor.main'], resolve));
  startEditor();
}

function startEditor() {
>>>>>>> df90e14 (Changes)
  monaco.languages.register({ id: 'imagine' });
  monaco.languages.setMonarchTokensProvider('imagine', {
    tokenizer: {
      root: [
        [/^\s*(#|\/\/).*$/, 'comment'],
        [/"[^"\n]*"/, 'string'],
        [/'[^'\n]*'/, 'string'],
        [/\[[^\]\n]*\]/, 'imagine-button'],
        [/(->|=>|::|\.{2,}|→|═+|─+|~>|\|>)/, 'imagine-arrow'],
        [/\$?\b\d+(\.\d+)?(px|%|s|ms|em|rem|vh|vw)?\b/, 'number'],
        [/\b(imagine|summon|dream|conjure|make|create|build|when|then|show|hide|add|every|click|clicks?|hover|scroll|type|animate|pulse|glow|float|spin|fade|slide|bounce|vibe|mood|style|theme|color|colors|font|button|page|site|website|section|menu|nav|footer|header|hero|card|cards|grid|list|form|input|title|subtitle|text|image|video|link|scene|track|onclick|onhover|background|foreground|shadow|border|confetti)\b/i, 'keyword'],
        [/\b[A-Z][A-Z0-9_ ]{2,}(?=[\s:{]|$)/, 'imagine-caps'],
        [/^\s*[\w][\w '&-]*(?=\s*[:{=])/, 'imagine-key'],
        [/[{}()]/, 'delimiter.bracket'],
      ],
    },
  });
  monaco.languages.setLanguageConfiguration('imagine', {
    comments: { lineComment: '#' },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
      { open: '{', close: '}' }, { open: '[', close: ']' }, { open: '(', close: ')' },
      { open: '"', close: '"' }, { open: "'", close: "'" },
    ],
  });
  monaco.editor.defineTheme('imaginecode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '565664', fontStyle: 'italic' },
      { token: 'string', foreground: 'e8c07c' },
      { token: 'number', foreground: '8ad8b0' },
      { token: 'keyword', foreground: 'c6f24e' },
      { token: 'imagine-key', foreground: '8fa8ff' },
      { token: 'imagine-button', foreground: 'ffd98e', fontStyle: 'bold' },
      { token: 'imagine-arrow', foreground: 'ff8dbe' },
      { token: 'imagine-caps', foreground: '7cd8c4' },
    ],
    colors: {
      'editor.background': '#0b0b0e',
      'editor.foreground': '#c9c9cf',
      'editor.lineHighlightBorder': '#141419',
      'editor.selectionBackground': '#262638',
      'editorLineNumber.foreground': '#3c3c46',
      'editorLineNumber.activeForeground': '#8f8f9a',
      'editorIndentGuide.background1': '#1a1a21',
      'editorCursor.foreground': '#c6f24e',
      'editorWidget.background': '#101015',
      'editorWidget.border': '#32323e',
      'minimap.background': '#0b0b0e',
      'scrollbarSlider.background': '#26262f66',
      'scrollbarSlider.hoverBackground': '#34343f99',
    },
  });

  editor = monaco.editor.create($('#monaco-host'), {
    theme: 'imaginecode-dark',
    fontFamily: '"Fragment Mono", "Cascadia Mono", Consolas, monospace',
    fontSize: 13,
    lineHeight: 23,
    fontLigatures: false,
    minimap: { enabled: true },
    wordWrap: 'on',
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    scrollBeyondLastLine: false,
    renderLineHighlight: 'all',
    bracketPairColorization: { enabled: true },
    padding: { top: 8 },
    tabSize: 2,
    automaticLayout: true,
    stickyScroll: { enabled: false },
  });
  editor.onDidChangeCursorPosition((e) => {
    $('#sb-pos').textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
  });
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => saveActive());
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => run());

  // webfont loads after Monaco measures glyphs — remeasure or the caret drifts
  document.fonts?.ready?.then(() => monaco.editor.remeasureFonts());

  init();
<<<<<<< HEAD
=======
}

bootMonaco().catch(async (err) => {
  console.error(err);
  await init();
  TERM.line('t-err', '✗ the code editor could not be loaded — check your internet connection, or reinstall so Monaco is bundled locally.');
  showPanel(true);
>>>>>>> df90e14 (Changes)
});

function langFor(path) {
  const ext = path.split('.').pop().toLowerCase();
  return ({ html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'javascript', ts: 'typescript', json: 'json', md: 'markdown' })[ext] || 'imagine';
}

/* ═══════════════ INIT ═══════════════ */
async function init() {
<<<<<<< HEAD
  loadLocal();
=======
  await loadLocal();
>>>>>>> df90e14 (Changes)
  bindChrome();
  updateStatusChips();
  termBoot();

<<<<<<< HEAD
  const [status] = await Promise.all([api('/api/status').catch(() => null), refreshTree()]);
  if (status) {
    S.catalog = status.models || {};
    if (status.connected) applyConnection(status);
    if (!S.catalog[S.settings.model]) S.settings.model = status.defaultModel || 'claude-sonnet-5';
  }
=======
  const [status] = await Promise.all([api('/api/status').catch(() => null), refreshTree(), RULES.load()]);
  if (status) applyProviders(status);
>>>>>>> df90e14 (Changes)
  buildSettingsPage();
  updateStatusChips();

  openSpecial('welcome');
  const first = flatFiles().find((f) => f.path.endsWith('.imagine')) || flatFiles()[0];
<<<<<<< HEAD
  if (first) await openFile(first.path, { keepFocus: true });
  activateTab(S.tabs.find((t) => t.kind === 'welcome')?.id);
=======
  if (first && editor) await openFile(first.path, { keepFocus: true });
  activateTab(S.tabs.find((t) => t.kind === 'welcome')?.id);

  ONBOARDING.boot();
  // the introduction gets the first word; the rules recommendation follows it
  api('/api/prefs').then((prefs) => RULES.nudge(prefs)).catch(() => RULES.nudge(null));
>>>>>>> df90e14 (Changes)
}

function flatFiles(nodes = S.tree, acc = []) {
  for (const n of nodes) {
    if (n.type === 'file') acc.push(n);
    else flatFiles(n.children || [], acc);
  }
  return acc;
}

/* ═══════════════ TERMINAL ═══════════════ */
const TERM = {
<<<<<<< HEAD
  el: null, para: null, think: null,
=======
  el: null, para: null, think: null, codeEl: null,
>>>>>>> df90e14 (Changes)
  line(cls, html) {
    this.closeStream();
    const d = document.createElement('div');
    d.className = `t-line ${cls}`;
    d.innerHTML = html;
    this.el.appendChild(d);
    this.scroll();
    return d;
  },
  stream(kind, text) {
    const key = kind === 'think' ? 'think' : 'para';
    const other = kind === 'think' ? 'para' : 'think';
    this[other] = null;
<<<<<<< HEAD
=======
    this.codeEl = null;
>>>>>>> df90e14 (Changes)
    if (!this[key]) {
      const d = document.createElement('div');
      d.className = `t-line ${kind === 'think' ? 't-think' : 't-delta'}`;
      this.el.appendChild(d);
      this[key] = d;
    }
    this[key].textContent += text;
    this.scroll();
  },
<<<<<<< HEAD
  closeStream() { this.para = null; this.think = null; },
=======
  closeStream() { this.para = null; this.think = null; this.codeEl = null; },
>>>>>>> df90e14 (Changes)
  clear() { this.el.innerHTML = ''; this.closeStream(); },
  scroll() {
    const near = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight < 90;
    if (near) this.el.scrollTop = this.el.scrollHeight;
  },
  cmd(text) {
    this.line('t-cmd', `<span class="t-prompt">imagine ✦</span> <span class="t-cmd-text">${esc(text)}</span>`);
  },
};
function termBoot() {
  TERM.el = $('#terminal');
  TERM.line('t-banner', 'IMAGINECODE — the compiler for languages that don\'t exist yet');
  TERM.line('t-dim', 'syntax is optional · errors are impossible · builds are dreams with a URL');
  TERM.line('t-dim', 'log only — the compiler writes here, your keyboard doesn\'t. real commands (like /login) belong in a real terminal.');
  TERM.line('t-dim', '');
}

function loginHelp() {
  TERM.line('t-dim', '');
  TERM.line('t-err', 'Claude Code isn\'t logged in on this computer yet — one-time fix, ~60 seconds:');
  TERM.line('t-stage', '1 · press the Windows key, type  cmd  and press Enter — a real terminal opens');
  TERM.line('t-stage', '2 · in it, type  claude  and press Enter');
  TERM.line('t-stage', '3 · inside Claude, type  /login  — your browser opens, approve it');
  TERM.line('t-stage', '4 · come back here and press  ⚡ Connect Claude Code  again');
<<<<<<< HEAD
=======
  TERM.line('t-dim', 'no Claude Code at all? switch the compiler provider in Settings → Compiler Provider');
  TERM.line('t-dim', 'and paste an Anthropic, OpenAI or DeepSeek API key instead — no CLI, no login.');
>>>>>>> df90e14 (Changes)
  TERM.line('t-dim', 'using a third-party Claude provider instead? no /login needed — put its config in');
  TERM.line('t-dim', '~/.claude/settings.json under "env" (ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY) — ImagineCode loads it automatically.');
  TERM.line('t-dim', '(this Imagine Terminal is just the build log — it can\'t run /login for you)');
}

<<<<<<< HEAD
function reportConnectFailure(errText, quiet) {
  const needsLogin = /not logged in|\/login/i.test(errText || '');
  if (needsLogin) {
    loginHelp();
    if (!quiet) toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in. Open Windows cmd → run "claude" → type /login. Exact steps are in the Imagine Terminal below.', 16000);
  } else {
    TERM.line('t-err', `✗ connection failed — ${esc(errText || 'unknown')}`);
    if (!quiet) toast('err', 'Could not connect', errText || 'Is Claude Code installed and logged in?');
=======
function keyHelp(id, rejected) {
  const p = prov(id);
  const label = p?.label || 'This provider';
  TERM.line('t-dim', '');
  if (rejected ?? p?.hasKey) {
    TERM.line('t-err', `${label} rejected the key that's saved here.`);
    TERM.line('t-stage', `1 · check it's the whole key, freshly copied${p?.keyUrl ? `  →  ${p.keyUrl}` : ''}`);
    TERM.line('t-stage', '2 · Settings (⚙ in the activity bar) → Compiler Provider');
    TERM.line('t-stage', `3 · press Replace on the ${label} card and paste again`);
    TERM.line('t-dim', 'still rejected? the key may be revoked, or the account may be out of credit.');
  } else {
    TERM.line('t-err', `${label} needs an API key before it can compile anything.`);
    TERM.line('t-stage', `1 · get a key${p?.keyUrl ? `  →  ${p.keyUrl}` : ''}`);
    TERM.line('t-stage', '2 · open Settings (⚙ in the activity bar) → Compiler Provider');
    TERM.line('t-stage', `3 · paste it into the ${label} card and press Save`);
  }
  TERM.line('t-dim', `keys are stored in .imaginecode-keys.json next to server.js${p?.envVar ? ` (or set ${p.envVar} in your environment)` : ''} — never in the browser.`);
}

function reportConnectFailure(errText, quiet) {
  const txt = errText || '';
  const needsLogin = /not logged in|\/login/i.test(txt);
  const keyIssue = /no .* key yet|api key|401|credential|invalid.*key|unauthor/i.test(txt);
  if (needsLogin && S.settings.provider === 'claude-code') {
    loginHelp();
    if (!quiet) toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in. Open Windows cmd → run "claude" → type /login. Exact steps are in the Imagine Terminal below.', 16000);
  } else if (keyIssue && S.settings.provider !== 'claude-code') {
    const rejected = !/no .* key yet/i.test(txt);
    TERM.line('t-err', `✗ ${esc(txt)}`);
    keyHelp(S.settings.provider, rejected);
    if (!quiet) toast('err', rejected ? `${providerLabel()} rejected that key` : `${providerLabel()} needs a key`, 'Details and next steps are in the Imagine Terminal below.', 14000);
  } else {
    TERM.line('t-err', `✗ connection failed — ${esc(txt || 'unknown')}`);
    if (!quiet) toast('err', 'Could not connect', txt || `Is ${providerLabel()} reachable?`);
>>>>>>> df90e14 (Changes)
  }
}

/* ═══════════════ EXPLORER ═══════════════ */
async function refreshTree() {
  const { tree } = await api('/api/files');
  S.tree = tree;
  if (![...S.expanded].length) tree.filter((n) => n.type === 'folder').forEach((n) => S.expanded.add(n.path));
  renderTree();
  renderRecents();
}

function renderTree() {
  const host = $('#file-tree');
  host.innerHTML = '';
  const walk = (nodes, depth) => {
    for (const n of nodes) {
      host.appendChild(treeRow(n, depth));
      if (n.type === 'folder' && S.expanded.has(n.path)) walk(n.children || [], depth + 1);
    }
  };
  walk(S.tree, 0);
}

function treeRow(n, depth) {
  const row = document.createElement('div');
  row.className = 'tree-row' + (S.selectedPath === n.path ? ' selected' : '') + (S.dirty.has(n.path) ? ' dirty' : '');
  row.style.paddingLeft = `${10 + depth * 12}px`;
  row.dataset.path = n.path;
  if (n.type === 'folder') {
    row.innerHTML = `<span class="chev ${S.expanded.has(n.path) ? 'down' : ''}"></span><span class="tree-label">${esc(n.name)}</span>`;
    row.onclick = () => {
      S.expanded.has(n.path) ? S.expanded.delete(n.path) : S.expanded.add(n.path);
      S.selectedPath = n.path;
      renderTree();
    };
  } else {
    const isEntry = S.settings.entry === n.path;
    row.innerHTML = `<span style="width:6px;flex:none"></span>${chipHTML(n.name)}<span class="tree-label">${esc(n.name)}</span>${isEntry ? '<span class="entry-badge">entry</span>' : ''}`;
    row.onclick = () => { S.selectedPath = n.path; renderTree(); openFile(n.path); };
  }
  row.oncontextmenu = (e) => { e.preventDefault(); S.selectedPath = n.path; renderTree(); showCtx(e, ctxItemsFor(n)); };
  return row;
}

function selectedFolder() {
  if (!S.selectedPath) return '';
  const find = (nodes) => {
    for (const n of nodes) {
      if (n.path === S.selectedPath) return n;
      if (n.type === 'folder') { const r = find(n.children || []); if (r) return r; }
    }
    return null;
  };
  const node = find(S.tree);
  if (!node) return '';
  return node.type === 'folder' ? node.path : (S.selectedPath.includes('/') ? S.selectedPath.slice(0, S.selectedPath.lastIndexOf('/')) : '');
}

function inlineTreeInput({ placeholder, initial = '', onDone }) {
  const host = $('#file-tree');
  const row = document.createElement('div');
  row.className = 'tree-input-row';
  row.style.paddingLeft = '24px';
  row.innerHTML = `<input type="text" spellcheck="false" placeholder="${esc(placeholder)}">`;
  host.prepend(row);
  const input = row.querySelector('input');
  input.value = initial;
  input.focus();
  if (initial.includes('.')) input.setSelectionRange(0, initial.lastIndexOf('.'));
  else input.select();
  let done = false;
  const finish = (commit) => {
    if (done) return; done = true;
    const v = input.value.trim();
    row.remove();
    if (commit && v) onDone(v);
  };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  };
  input.onblur = () => finish(false);
}

function newFileFlow() {
  switchSideView('explorer');
  inlineTreeInput({
    placeholder: 'anything.yourlanguage',
    onDone: async (name) => {
      const base = selectedFolder();
      const p = base ? `${base}/${name}` : name;
      try {
        await api('/api/files', jsonBody({ path: p, type: 'file', content: '' }));
        await refreshTree();
        await openFile(p);
        toast('info', 'New imagination', `${name} — invent any syntax you like.`);
      } catch (err) { toast('err', 'Could not create file', err.message); }
    },
  });
}
function newFolderFlow() {
  switchSideView('explorer');
  inlineTreeInput({
    placeholder: 'folder name',
    onDone: async (name) => {
      const base = selectedFolder();
      try {
        await api('/api/files', jsonBody({ path: base ? `${base}/${name}` : name, type: 'folder' }));
        await refreshTree();
      } catch (err) { toast('err', 'Could not create folder', err.message); }
    },
  });
}
async function deletePath(p) {
  if (!confirm(`Delete "${p}"?\n\nEven imagination has an undo problem — this is permanent.`)) return;
  await api(`/api/file?path=${encodeURIComponent(p)}`, { method: 'DELETE' });
  for (const t of [...S.tabs]) if (t.kind === 'file' && (t.path === p || t.path.startsWith(p + '/'))) closeTab(t.id, { force: true });
  if (S.settings.entry === p || S.settings.entry.startsWith(p + '/')) { S.settings.entry = ''; saveSettings(); }
  S.selectedPath = null;
  await refreshTree();
  buildSettingsPage();
}
function renameFlow(p) {
  const name = p.split('/').pop();
  const row = $(`.tree-row[data-path="${CSS.escape(p)}"]`);
  if (!row) return;
  const label = row.querySelector('.tree-label');
  const input = document.createElement('input');
  input.type = 'text'; input.value = name; input.spellcheck = false;
  input.style.cssText = 'flex:1;min-width:0;background:#3c3c3c;color:#e8e8e8;border:1px solid #007fd4;outline:none;font:13px var(--font-ui);height:20px;padding:0 4px';
  label.replaceWith(input);
  input.focus();
  if (name.includes('.')) input.setSelectionRange(0, name.lastIndexOf('.')); else input.select();
  let done = false;
  const finish = async (commit) => {
    if (done) return; done = true;
    const v = input.value.trim();
    if (!commit || !v || v === name) return renderTree();
    const to = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) + v : v;
    try {
      await api('/api/rename', jsonBody({ from: p, to }));
      const tab = S.tabs.find((t) => t.path === p);
      if (S.models[p]) {
        const m = S.models[p]; const content = m.getValue(); m.dispose();
        delete S.models[p];
        S.models[to] = monaco.editor.createModel(content, langFor(to), monaco.Uri.file('/' + to));
        S.savedVersions[to] = S.models[to].getAlternativeVersionId();
        wireModel(to);
      }
      if (tab) { tab.path = to; tab.name = v; }
      if (S.settings.entry === p) { S.settings.entry = to; saveSettings(); }
      S.selectedPath = to;
      await refreshTree();
      renderTabs(); updateBreadcrumbs();
      if (S.active && S.tabs.find((t) => t.id === S.active)?.path === to) editor.setModel(S.models[to]);
    } catch (err) { toast('err', 'Rename failed', err.message); renderTree(); }
  };
  input.onkeydown = (e) => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); };
  input.onblur = () => finish(false);
}

function ctxItemsFor(n) {
  if (n.type === 'folder') {
    return [
      { label: 'New Imagination File', run: newFileFlow },
      { label: 'New Folder', run: newFolderFlow },
      'sep',
      { label: 'Rename…', keys: 'F2', run: () => renameFlow(n.path) },
      { label: 'Delete', keys: 'Del', run: () => deletePath(n.path) },
    ];
  }
  return [
    { label: 'Open', run: () => openFile(n.path) },
    { label: '▶ Set as Entry File', run: () => { S.settings.entry = n.path; saveSettings(); renderTree(); buildSettingsPage(); toast('info', 'Entry file set', `The compiler now starts from ${n.path}.`); } },
    'sep',
    { label: 'Rename…', keys: 'F2', run: () => renameFlow(n.path) },
    { label: 'Delete', keys: 'Del', run: () => deletePath(n.path) },
    'sep',
    { label: '▶ Run Imagination', keys: 'Ctrl+Enter', run: () => run() },
  ];
}

/* ═══════════════ TABS + EDITOR ═══════════════ */
function wireModel(path) {
  S.models[path].onDidChangeContent(() => {
    const isDirty = S.models[path].getAlternativeVersionId() !== S.savedVersions[path];
    const had = S.dirty.has(path);
    if (isDirty) S.dirty.add(path); else S.dirty.delete(path);
    if (had !== isDirty) { renderTabs(); renderTree(); }
  });
}

async function openFile(path, { line, keepFocus } = {}) {
  if (!S.models[path]) {
    const { content } = await api(`/api/file?path=${encodeURIComponent(path)}`);
    S.models[path] = monaco.editor.createModel(content, langFor(path), monaco.Uri.file('/' + path));
    S.savedVersions[path] = S.models[path].getAlternativeVersionId();
    wireModel(path);
  }
  let tab = S.tabs.find((t) => t.kind === 'file' && t.path === path);
  if (!tab) {
    tab = { id: ++tabSeq, kind: 'file', path, name: path.split('/').pop() };
    S.tabs.push(tab);
  }
  pushRecent(path);
  renderRecents();
  if (!keepFocus) activateTab(tab.id, { line });
  else renderTabs();
}

<<<<<<< HEAD
function openSpecial(kind) {
  let tab = S.tabs.find((t) => t.kind === kind);
  if (!tab) {
    tab = { id: ++tabSeq, kind, name: kind === 'welcome' ? 'Welcome' : 'Settings' };
=======
const SPECIAL_TABS = { welcome: { name: 'Welcome', ico: '✦' }, settings: { name: 'Settings', ico: '⚙' }, rules: { name: 'Language Rules', ico: '§' } };

function openSpecial(kind) {
  let tab = S.tabs.find((t) => t.kind === kind);
  if (!tab) {
    tab = { id: ++tabSeq, kind, name: SPECIAL_TABS[kind]?.name || kind };
>>>>>>> df90e14 (Changes)
    S.tabs.push(tab);
  }
  activateTab(tab.id);
}

function activateTab(id, { line } = {}) {
  if (id == null) return;
  const prev = S.tabs.find((t) => t.id === S.active);
  if (prev?.kind === 'file' && editor?.getModel()) S.viewStates[prev.path] = editor.saveViewState();

  S.active = id;
  const tab = S.tabs.find((t) => t.id === id);
  const isFile = tab?.kind === 'file';

  $('#monaco-host').classList.toggle('hidden-under', !isFile);
  $('#welcome').classList.toggle('active', tab?.kind === 'welcome');
  $('#settings-page').classList.toggle('active', tab?.kind === 'settings');
<<<<<<< HEAD
=======
  $('#rules-page').classList.toggle('active', tab?.kind === 'rules');
>>>>>>> df90e14 (Changes)
  $('#empty-editor').classList.toggle('active', !tab);

  if (isFile) {
    editor.setModel(S.models[tab.path]);
    if (S.viewStates[tab.path]) editor.restoreViewState(S.viewStates[tab.path]);
    if (line) {
      editor.revealLineInCenter(line);
      editor.setPosition({ lineNumber: line, column: 1 });
    }
    editor.focus();
    $('#sb-lang').textContent = langFor(tab.path) === 'imagine' ? 'Imagine' : langFor(tab.path);
    S.selectedPath = tab.path;
    renderTree();
  }
  renderTabs();
  updateBreadcrumbs();
}

function closeTab(id, { force } = {}) {
  const idx = S.tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  const tab = S.tabs[idx];
  if (tab.kind === 'file' && S.dirty.has(tab.path) && !force) saveFile(tab.path); // forgiving IDE: save on close
  S.tabs.splice(idx, 1);
  if (S.active === id) {
    const next = S.tabs[idx] || S.tabs[idx - 1];
    S.active = null;
    activateTab(next?.id);
    if (!next) { renderTabs(); updateBreadcrumbs(); $('#empty-editor').classList.add('active'); $('#monaco-host').classList.add('hidden-under'); }
  } else renderTabs();
}

<<<<<<< HEAD
function renderTabs() {
=======
// the desktop shell mirrors this to decide whether closing needs a warning
let lastDirtyReport = -1;
function reportDirty() {
  // unsaved language rules count as unsaved work: they are typed, they are
  // valuable, and they live nowhere else until they are saved
  const n = S.dirty.size + (RULES.isDirty() ? 1 : 0);
  if (n === lastDirtyReport) return;
  lastDirtyReport = n;
  window.imagine?.setDirtyCount(n);
}

function renderTabs() {
  reportDirty();
>>>>>>> df90e14 (Changes)
  const host = $('#tabbar');
  host.innerHTML = '';
  for (const t of S.tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (t.id === S.active ? ' active' : '') + (t.kind === 'file' && S.dirty.has(t.path) ? ' dirty' : '');
<<<<<<< HEAD
    const icon = t.kind === 'file' ? chipHTML(t.name) : `<span class="tab-ico">${t.kind === 'welcome' ? '✦' : '⚙'}</span>`;
=======
    const icon = t.kind === 'file' ? chipHTML(t.name) : `<span class="tab-ico">${SPECIAL_TABS[t.kind]?.ico || '✦'}</span>`;
>>>>>>> df90e14 (Changes)
    el.innerHTML = `${icon}<span class="tab-label">${esc(t.name)}</span><span class="tab-close" title="Close"><span class="x">✕</span></span>`;
    el.onclick = () => activateTab(t.id);
    el.onauxclick = (e) => { if (e.button === 1) { e.preventDefault(); closeTab(t.id); } };
    el.querySelector('.tab-close').onclick = (e) => { e.stopPropagation(); closeTab(t.id); };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      showCtx(e, [
        { label: 'Close', run: () => closeTab(t.id) },
        { label: 'Close Others', run: () => [...S.tabs].filter((x) => x.id !== t.id).forEach((x) => closeTab(x.id)) },
        { label: 'Close All', run: () => [...S.tabs].forEach((x) => closeTab(x.id)) },
      ]);
    };
    host.appendChild(el);
  }
}

function updateBreadcrumbs() {
  const tab = S.tabs.find((t) => t.id === S.active);
  const bc = $('#breadcrumbs');
  if (!tab || tab.kind !== 'file') { bc.innerHTML = ''; return; }
  const parts = tab.path.split('/');
  bc.innerHTML = `<span class="bc-chip">${chipHTML(tab.name)}</span>` + parts
    .map((p, i) => `<span>${esc(p)}</span>${i < parts.length - 1 ? '<span class="bc-sep">›</span>' : ''}`)
    .join('');
}

async function saveFile(path) {
  if (!S.models[path]) return;
  await api('/api/file', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path, content: S.models[path].getValue() }) });
  S.savedVersions[path] = S.models[path].getAlternativeVersionId();
  S.dirty.delete(path);
  renderTabs(); renderTree();
}
function saveActive() {
  const tab = S.tabs.find((t) => t.id === S.active);
  if (tab?.kind === 'file') saveFile(tab.path).then(() => flashStatus(`✦ saved ${tab.name}`));
  if (tab?.kind === 'settings') flashStatus('✦ settings save themselves here');
<<<<<<< HEAD
}
async function saveAll() { for (const p of [...S.dirty]) await saveFile(p); }
=======
  if (tab?.kind === 'rules') RULES.save().then((ok) => ok && flashStatus('✦ language rules saved'));
}
async function saveAll() {
  for (const p of [...S.dirty]) await saveFile(p);
  // an unsaved spec is unsaved work like any other — Save All must include it,
  // and so must the desktop shell's save-before-close
  if (RULES.isDirty()) await RULES.save({ quiet: true });
}
>>>>>>> df90e14 (Changes)

function flashStatus(text, ms = 2400) {
  const el = $('#sb-build');
  const prev = el.textContent;
  el.textContent = text;
  clearTimeout(el._t);
  el._t = setTimeout(() => { if (!S.building) el.textContent = prev.startsWith('✦') ? prev : '✦ ready'; }, ms);
}

/* ═══════════════ CONNECT ═══════════════ */
<<<<<<< HEAD
function applyConnection(c) {
  S.connection = c;
  const sb = $('#sb-claude');
  const ab = $('#ab-claude');
  sb.classList.remove('connecting');
  if (c.connected) {
    document.getElementById('statusbar').classList.add('connected');
    sb.innerHTML = `<span class="sb-zap">⚡</span> Claude Code`;
    sb.title = `${c.version || 'connected'} · ${c.method || ''} · click to re-check`;
    ab.classList.add('connected');
    ab.title = `Claude Code connected — ${c.version || ''}`;
  } else {
    document.getElementById('statusbar').classList.remove('connected');
    sb.innerHTML = `<span class="sb-zap">⚡</span> Connect Claude Code`;
    sb.title = c.error || 'Click to connect';
    ab.classList.remove('connected');
  }
  ab.querySelector('.ab-dot')?.classList.toggle('connected', !!c.connected);
=======
// the whole provider table, straight from the server (keys arrive masked)
function applyProviders(payload) {
  const next = payload?.providers;
  if (!next || !Object.keys(next).length) return;
  S.providers = next;
  const ids = Object.keys(next);
  if (!next[S.settings.provider]) S.settings.provider = payload.defaultProvider || ids[0];
  // a model remembered for a provider that no longer offers it falls back to its default
  S.settings.models ??= {};
  for (const id of ids) {
    const picked = S.settings.models[id];
    if (!picked || !next[id].models?.[picked]) S.settings.models[id] = next[id].defaultModel;
  }
  S.connection = next['claude-code']?.connection || S.connection;
  saveSettings();
  updateConnChip();
}
// one provider changed (key saved, models refreshed) — patch it in place
function applyProviderPayload(p) {
  if (!p?.id) return;
  S.providers[p.id] = p;
  if (!p.models?.[S.settings.models?.[p.id]]) (S.settings.models ??= {})[p.id] = p.defaultModel;
  if (p.id === 'claude-code') S.connection = p.connection || S.connection;
  saveSettings();
  buildSettingsPage();
  updateConnChip();
}

function applyConnection(c) {
  const id = c?.provider && S.providers[c.provider] ? c.provider : 'claude-code';
  const conn = { connected: false, ...(c || {}) };
  if (S.providers[id]) S.providers[id].connection = conn;
  if (id === 'claude-code') S.connection = conn;
  updateConnChip();
}

// the ⚡ chip + activity-bar lamp always describe the CURRENT provider
function updateConnChip() {
  const id = S.settings.provider;
  const p = prov(id);
  const c = p?.connection || (id === 'claude-code' ? S.connection : null) || { connected: false };
  const sb = $('#sb-claude'), ab = $('#ab-claude');
  if (!sb || !ab) return;
  sb.classList.remove('connecting');
  const label = providerLabel(id);
  let text, title, lit;
  if (c.connected) {
    lit = true;
    text = label;
    title = `${c.version || 'connected'} · ${c.method || ''} — click to re-check`;
  } else if (p?.needsKey && !p.hasKey) {
    lit = false;
    text = `Add ${label} key`;
    title = c.error || `${label} needs an API key — click to open Settings`;
  } else {
    lit = false;
    text = `Connect ${label}`;
    title = c.error || 'Click to connect';
  }
  document.getElementById('statusbar').classList.toggle('connected', lit);
  sb.innerHTML = `<span class="sb-zap">⚡</span> ${esc(text)}`;
  sb.title = title;
  ab.classList.toggle('connected', lit);
  ab.title = lit ? `${label} connected — ${c.version || ''}` : `${label} — not connected`;
  ab.querySelector('.ab-dot')?.classList.toggle('connected', lit);
  const wc = $('#w-connect');
  if (wc) wc.innerHTML = `<span class="wl-ico">⚡</span> ${esc(lit ? `${label} connected ✓ — re-check` : text)}`;
  updateStatusChips();
>>>>>>> df90e14 (Changes)
}

let connecting = null;
async function connect({ quiet } = {}) {
  if (connecting) return connecting;
<<<<<<< HEAD
  const sb = $('#sb-claude');
  sb.classList.add('connecting');
  sb.innerHTML = `<span class="sb-zap">⚡</span> Connecting…`;
  TERM.line('t-stage', 'connecting to Claude Code…');
  connecting = (async () => {
    try {
      const c = await api('/api/connect', jsonBody({ model: S.settings.model }));
      applyConnection(c);
      if (c.connected) {
        TERM.line('t-ok', `⚡ Claude Code connected · ${esc(c.version || '')} · ${esc(c.method || '')} · ${((c.latencyMs || 0) / 1000).toFixed(1)}s`);
        if (!quiet) toast('ok', 'Claude Code connected', `${c.version || 'ready'} — via ${c.method || 'local login'}. Your imagination now has a compiler.`);
=======
  const id = S.settings.provider;
  const p = prov(id);
  // no key at all: connecting can't succeed — send them to the one place that fixes it
  if (p?.needsKey && !p.hasKey) {
    showPanel(true);
    keyHelp(id, false);
    if (!quiet) toast('err', `${providerLabel(id)} needs a key`, 'Opening Settings → Compiler Provider — paste your key there.', 12000);
    openSpecial('settings');
    return false;
  }
  const sb = $('#sb-claude');
  sb.classList.add('connecting');
  sb.innerHTML = `<span class="sb-zap">⚡</span> Connecting…`;
  TERM.line('t-stage', `connecting to ${providerLabel(id)}…`);
  connecting = (async () => {
    try {
      const c = await api('/api/connect', jsonBody({ provider: id, model: curModel() }));
      applyConnection(c);
      if (c.connected) {
        TERM.line('t-ok', `⚡ ${esc(providerLabel(id))} connected · ${esc(c.version || '')} · ${esc(c.method || '')} · ${((c.latencyMs || 0) / 1000).toFixed(1)}s`);
        if (c.warning) TERM.line('t-dim', `  ${esc(c.warning)}`);
        if (!quiet) toast('ok', `${providerLabel(id)} connected`, `${c.version || 'ready'} — via ${c.method || 'local login'}. Your imagination now has a compiler.`);
        if (S.tabs.find((t) => t.id === S.active)?.kind === 'settings') buildSettingsPage();
>>>>>>> df90e14 (Changes)
      } else {
        reportConnectFailure(c.error, quiet);
      }
      return c.connected;
    } catch (err) {
<<<<<<< HEAD
      applyConnection({ connected: false, error: err.message });
=======
      applyConnection({ provider: id, connected: false, error: err.message });
>>>>>>> df90e14 (Changes)
      reportConnectFailure(err.message, quiet);
      return false;
    } finally { connecting = null; }
  })();
  return connecting;
}

/* ═══════════════ RUN (compile imagination) ═══════════════ */
async function run(opts = {}) {
  if (S.building) return stopBuild();
  if (!flatFiles().length) return toast('info', 'Nothing to compile', 'Create a file and imagine something first.');

  showPanel(true);
<<<<<<< HEAD
  if (!S.connection.connected) {
=======
  if (!providerReady()) {
>>>>>>> df90e14 (Changes)
    const ok = await connect({ quiet: false });
    if (!ok) return;
  }

  await saveAll();

  // explicit entry file — never guess which file is the program
  const paths = flatFiles().map((f) => f.path);
  let entry = S.settings.entry;
  if (!entry || !paths.includes(entry)) {
    if (paths.length === 1) entry = paths[0];
    else {
      entry = await pickEntry();
      if (!entry) { TERM.line('t-dim', 'build cancelled — no entry file chosen'); return; }
    }
    S.settings.entry = entry;
    saveSettings();
    renderTree();
  }

  setBuilding(true);
  TERM.line('t-dim', '');
<<<<<<< HEAD
  TERM.cmd(`run ${entry} --${S.settings.format}${opts.fresh ? ' --fresh' : ''}`);
=======
  TERM.cmd(`run ${entry} --${S.settings.format} --via ${S.settings.provider}${RULES.isActive() ? ` --spec ${RULES.ruleCount()}` : ''}${opts.fresh ? ' --fresh' : ''}`);
>>>>>>> df90e14 (Changes)

  try {
    const res = await fetch('/api/render', jsonBody({
      entry,
      format: S.settings.format,
<<<<<<< HEAD
      model: S.settings.model,
=======
      provider: S.settings.provider,
      model: curModel(),
>>>>>>> df90e14 (Changes)
      instructions: S.settings.notes,
      fresh: !!opts.fresh,
    }));
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const raw = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!raw) continue;
        try { handleBuildMsg(JSON.parse(raw)); } catch {}
      }
    }
    if (S.building) setBuilding(false); // stream ended without done/error
  } catch (err) {
    TERM.line('t-err', `✗ ${esc(err.message)}`);
    toast('err', 'Build failed', err.message);
    setBuilding(false);
  }
}

function handleBuildMsg(m) {
  switch (m.type) {
    case 'stage': TERM.line('t-stage', esc(m.text)); break;
    case 'delta': TERM.stream('delta', m.text); break;
    case 'think': TERM.stream('think', m.text); break;
<<<<<<< HEAD
=======
    // direct-API providers stream the whole page back as text — showing 60 KB of
    // markup would drown the log, so the fenced part arrives as a byte counter
    case 'code': {
      const size = m.chars < 1024 ? `${m.chars} characters` : `${(m.chars / 1024).toFixed(1)} KB`;
      if (!TERM.codeEl?.isConnected) TERM.codeEl = TERM.line('t-tool', '');
      TERM.codeEl.textContent = `◍ writing markup — ${size}`;
      TERM.scroll();
      break;
    }
>>>>>>> df90e14 (Changes)
    case 'tool': TERM.line('t-tool', `✎ ${esc(m.name)}${m.file ? ' → ' + esc(m.file) : ''}`); break;
    case 'summary':
      // the streamed deltas were a live preview of this same message — replace, don't duplicate
      if (TERM.para) { TERM.para.remove(); TERM.closeStream(); }
      if (m.text) TERM.line('t-summary', esc(m.text.trim()));
      break;
    case 'done': {
      const cost = m.costUsd == null ? '' : m.costUsd < 0.005 ? ' · <1¢' : ` · ~$${m.costUsd.toFixed(3)}`;
<<<<<<< HEAD
      TERM.line('t-ok', `✓ imagination compiled in ${m.seconds}s${cost}`);
=======
      const tok = m.tokens ? ` · ${fmtTok(m.tokens.in)} in / ${fmtTok(m.tokens.out)} out` : '';
      TERM.line('t-ok', `✓ imagination compiled in ${m.seconds}s${cost}${tok}`);
>>>>>>> df90e14 (Changes)
      TERM.line('t-dim', `  serving at ${location.origin}/preview/`);
      setBuilding(false);
      $('#sb-build').textContent = `✓ built in ${m.seconds}s`;
      openPreview(true);
      toast('ok', 'It exists now ✦', `Compiled in ${m.seconds}s. Your imagination is live in the preview.`);
      break;
    }
    case 'error':
      TERM.line('t-err', `✗ ${esc(m.message)}`);
      setBuilding(false);
      $('#sb-build').textContent = '✦ ready';
      if (/not logged in|\/login/i.test(m.message || '')) {
<<<<<<< HEAD
        applyConnection({ connected: false, error: m.message });
        loginHelp();
        toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in — steps are in the Imagine Terminal below.', 16000);
=======
        applyConnection({ provider: 'claude-code', connected: false, error: m.message });
        loginHelp();
        toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in — steps are in the Imagine Terminal below.', 16000);
      } else if (/no .* key yet|api key|401|invalid.*key|unauthor/i.test(m.message || '') && S.settings.provider !== 'claude-code') {
        keyHelp(S.settings.provider);
        toast('err', `${providerLabel()} rejected the build`, 'Check the key in Settings → Compiler Provider.', 14000);
>>>>>>> df90e14 (Changes)
      } else {
        toast('err', 'Build failed', m.message);
      }
      break;
  }
}
<<<<<<< HEAD
=======
const fmtTok = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));
>>>>>>> df90e14 (Changes)

function setBuilding(on) {
  S.building = on;
  document.getElementById('statusbar').classList.toggle('building', on);
  const btn = $('#btn-run');
  btn.classList.toggle('building', on);
  btn.querySelector('.run-label').textContent = on ? 'Stop' : 'Run';
  $('#term-stop').disabled = !on;
  $('#sb-build').textContent = on ? '✦ imagining…' : $('#sb-build').textContent;
  $('.pv-dot')?.classList.toggle('live', on);
  $('#preview-frame').classList.toggle('building', on);
  if (!on) TERM.closeStream();
}
async function stopBuild() {
  await api('/api/render/stop', { method: 'POST' }).catch(() => {});
}

/* ═══════════════ PREVIEW ═══════════════ */
function openPreview(reload) {
  S.previewOpen = true;
  $('#preview-col').classList.remove('hidden');
  $('#preview-resizer').classList.remove('hidden');
  $('#pv-url').textContent = `${location.host}/preview/`;
  if (reload) $('#preview-frame').src = `/preview/?t=${Date.now()}`;
}
function closePreview() {
  S.previewOpen = false;
  $('#preview-col').classList.add('hidden');
  $('#preview-resizer').classList.add('hidden');
}
function togglePreview() { S.previewOpen ? closePreview() : openPreview(true); }

/* ═══════════════ PANEL ═══════════════ */
function showPanel(show) {
  $('#panel').classList.toggle('hidden', !show);
  $('#panel-resizer').classList.toggle('hidden', !show);
}
function togglePanel() { showPanel($('#panel').classList.contains('hidden')); }

<<<<<<< HEAD
/* ═══════════════ SETTINGS PAGE ═══════════════ */
const MODEL_META = {
  'claude-sonnet-5': { badge: 'default · medium reasoning', desc: 'balanced + quick — the imagination workhorse' },
  'claude-opus-4-8': { badge: 'low reasoning', desc: 'deepest interpretation, for intricate dreams' },
  'claude-haiku-4-5': { badge: 'fast', desc: 'instant sketches, lightest touch' },
};
=======
/* ═══════════════ LANGUAGE RULES ═══════════════ */
//
// The dreamer's spec for the language they invented. The server owns both the
// storage and the rendering of it — this module edits a local draft, asks the
// server to render the draft for the preview, and saves. Nothing here duplicates
// the prompt text, so "what the compiler reads" can never drift from what it
// actually reads.

const RULES = (() => {
  const blank = () => ({ enabled: true, name: '', overview: '', rules: [], examples: [], updatedAt: null });

  let saved = blank();   // last thing the server confirmed
  let draft = blank();   // what's in the fields
  let limits = { name: 60, overview: 4000, syntax: 240, means: 700, exampleSource: 2400, exampleMeans: 900, rules: 200, examples: 40 };
  let compiled = { text: '', chars: 0, ruleCount: 0, exampleCount: 0, truncated: false };
  let built = false;
  let saving = false;
  let inferring = false;
  let proposal = null;   // an AI reading awaiting review
  let previewTimer = null;
  let saveTimer = null;

  const clone = (v) => JSON.parse(JSON.stringify(v));
  // Dirtiness compares MEANING, not bookkeeping. Ids are positional labels the
  // server reassigns on every save, and it drops rows that are empty on both
  // sides — comparing either of those would leave the page permanently
  // "unsaved" the moment it saved successfully.
  const canon = (o) => JSON.stringify({
    enabled: o.enabled !== false,
    name: (o.name || '').trim(),
    overview: (o.overview || '').trim(),
    rules: (o.rules || [])
      .map((r) => [(r.syntax || '').trim(), (r.means || '').trim(), r.on !== false])
      .filter(([s, m]) => s || m),
    examples: (o.examples || [])
      .map((e) => [(e.source || '').trim(), (e.means || '').trim(), e.on !== false])
      .filter(([s, m]) => s || m),
  });
  const dirty = () => canon(draft) !== canon(saved);
  // rows the compiler would actually act on
  const liveRules = () => draft.rules.filter((r) => r.on && (r.syntax.trim() || r.means.trim()));
  const liveExamples = () => draft.examples.filter((e) => e.on && (e.source.trim() || e.means.trim()));
  const active = () => draft.enabled && !!(draft.overview.trim() || liveRules().length || liveExamples().length);

  /* ── starter templates ───────────────────────────────────────────── */

  const TEMPLATES = {
    prose: {
      label: 'Sentences',
      hint: 'prose that reads like English',
      name: '',
      overview: 'This language is written as ordinary sentences. Each sentence describes one thing on the page, in the order it should appear. Indentation means containment — anything indented under a sentence lives inside the thing that sentence described. Quoted text is literal copy for the screen. A colon at the end of a line opens a section that the indented lines below it belong to.',
      rules: [
        { syntax: '"quoted text"', means: 'literal copy on the screen — reproduce it exactly, including punctuation and emoji' },
        { syntax: '[ label ]', means: 'a clickable button whose visible label is the text inside the brackets' },
        { syntax: 'the mood is: <words>', means: 'design direction for the whole page — translate the words into palette, spacing and typography, never onto the screen as text' },
        { syntax: 'when someone clicks X, <behaviour>', means: 'a real click handler on X that does exactly the named behaviour and nothing more' },
        { syntax: 'indented under a line', means: 'nested inside the element that line declared' },
      ],
    },
    braces: {
      label: 'Curly braces',
      hint: 'blocks, properties, arrows',
      name: '',
      overview: 'This language is written in blocks. A name followed by { } declares an element or a scene; the lines inside it are its properties and its children. Properties are written key = value, or key.subkey = value for anything nested. Arrows describe behaviour and flow rather than structure. Block names are identifiers I use to refer to things — they are never text on the screen.',
      rules: [
        { syntax: 'Name { … }', means: 'declare one element or scene called Name containing everything inside the braces — Name itself is never rendered as visible text' },
        { syntax: 'key = value', means: 'set the style or content property "key" to "value" on the enclosing block' },
        { syntax: 'key.subkey = value', means: 'set a nested property (border.color, text.size) precisely as written' },
        { syntax: 'x -> y', means: 'x causes y — a behaviour, transition or flow, not a layout relationship' },
        { syntax: 'x :: <styling>', means: 'apply the styling that follows to x, as an additional declaration on the same element' },
      ],
    },
    spells: {
      label: 'Invented verbs',
      hint: 'summon, bloom, dissolve…',
      name: '',
      overview: 'This language is written as commands in invented verbs. Each verb is an instruction to bring one thing into being, style it, or make it behave. The verb decides what kind of thing appears; the words after it are its content and its qualities. A verb with no content produces the element it names, empty but fully styled.',
      rules: [
        { syntax: 'summon <thing>', means: 'create that element and place it where this line appears in the flow' },
        { syntax: 'bloom <thing>', means: 'the element scales up smoothly (about 4%) and its shadow deepens on hover' },
        { syntax: 'dissolve <thing>', means: 'the element fades out over roughly 400ms rather than disappearing instantly' },
        { syntax: 'whisper "<text>"', means: 'that text rendered small, low-contrast and quiet' },
        { syntax: 'thunder "<text>"', means: 'that text rendered as large and loud as the layout allows' },
      ],
    },
  };

  /* ── wiring ──────────────────────────────────────────────────────── */

  function build() {
    if (built) return;
    built = true;

    $('#rules-enabled').onchange = (e) => { draft.enabled = e.target.checked; touched(); };
    bindField('#rules-name', 'name', limits.name);
    bindField('#rules-overview', 'overview', limits.overview);
    $('#rules-add').onclick = () => addRule();
    $('#examples-add').onclick = () => addExample();
    $('#rules-save').onclick = () => save();
    $('#rules-revert').onclick = () => revert();
    $('#rules-infer').onclick = () => infer();
    $('#set-rules-jump').onclick = () => open();
    $('#w-rules-band').onclick = () => open();
    $('#w-rules').onclick = () => open();
    $('#sb-rules').onclick = () => open();
    $('#ab-rules').onclick = () => open();

    const tpl = $('#rules-templates');
    tpl.innerHTML = Object.entries(TEMPLATES).map(([id, t]) =>
      `<button class="tpl" data-t="${esc(id)}"><span class="tpl-name">${esc(t.label)}</span><span class="tpl-hint">${esc(t.hint)}</span></button>`).join('');
    tpl.querySelectorAll('.tpl').forEach((b) => (b.onclick = () => applyTemplate(b.dataset.t)));
  }

  // text inputs write straight into the draft; the preview and the save button
  // catch up on a debounce so typing never waits on a round trip
  function bindField(sel, key, max) {
    const el = $(sel);
    el.maxLength = max;
    el.oninput = () => { draft[key] = el.value.slice(0, max); touched({ keepFocus: true }); };
  }

  function touched({ keepFocus } = {}) {
    if (!keepFocus) render();
    else { paintBar(); paintCounts(); }
    schedulePreview();
    scheduleAutosave();
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 260);
  }

  // Autosave, because a spec you typed and lost is worse than no spec. The
  // explicit Save button stays — it's the thing that tells you it landed.
  function scheduleAutosave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (dirty() && !saving) save({ quiet: true }); }, 2200);
  }

  async function refreshPreview() {
    try {
      const payload = await api('/api/rules/preview', jsonBody({ rules: draft }));
      compiled = payload.compiled;
      limits = payload.limits || limits;
      paintPreview();
    } catch { /* the preview is a convenience; a failed render must not block editing */ }
  }

  /* ── rows ────────────────────────────────────────────────────────── */

  // Ids only have to be unique within this page for the duration of the edit;
  // the server re-numbers them positionally on save.
  let seq = 0;
  const rowId = (p) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

  function addRule(fill = {}, { focus = true } = {}) {
    if (draft.rules.length >= limits.rules) return toast('info', 'That is a lot of rules', `The glossary holds ${limits.rules}. Consider folding some into "How your language works".`);
    draft.rules.push({ id: rowId('r'), syntax: '', means: '', on: true, ...fill });
    render();
    if (focus) $(`#rules-list .glossary-row:last-child .gr-syntax`)?.focus();
    schedulePreview();
    scheduleAutosave();
  }

  function addExample(fill = {}, { focus = true } = {}) {
    if (draft.examples.length >= limits.examples) return toast('info', 'Plenty of examples', `${limits.examples} is the ceiling — the compiler has more than enough to go on.`);
    draft.examples.push({ id: rowId('e'), source: '', means: '', on: true, ...fill });
    render();
    if (focus) $(`#examples-list .example-row:last-child .ex-source`)?.focus();
    schedulePreview();
    scheduleAutosave();
  }

  function renderRules() {
    const host = $('#rules-list');
    host.innerHTML = '';
    if (!draft.rules.length) {
      host.innerHTML = `<div class="glossary-empty">No rules yet. Add the constructs you invented — <code>~&gt;</code>, <code>bloom { }</code>, <code>vibe =</code> — and say what each one does.</div>`;
      return;
    }
    draft.rules.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'glossary-row' + (r.on ? '' : ' off');
      row.innerHTML = `
        <label class="gr-on" title="${r.on ? 'This rule is sent to the compiler' : 'Ignored for now — kept, but not sent'}">
          <input type="checkbox" ${r.on ? 'checked' : ''} aria-label="Use this rule">
        </label>
        <input class="gr-syntax" type="text" spellcheck="false" maxlength="${limits.syntax}" placeholder="x ~&gt; y" value="${esc(r.syntax)}">
        <span class="gr-arrow">→</span>
        <textarea class="gr-means" rows="1" spellcheck="false" maxlength="${limits.means}" placeholder="what the compiler must do with it">${esc(r.means)}</textarea>
        <div class="gr-actions">
          <button class="gr-btn up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="gr-btn down" title="Move down" ${i === draft.rules.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="gr-btn del" title="Delete this rule">${I.trash}</button>
        </div>`;

      row.querySelector('.gr-on input').onchange = (e) => { r.on = e.target.checked; render(); schedulePreview(); scheduleAutosave(); };
      const syn = row.querySelector('.gr-syntax');
      syn.oninput = () => { r.syntax = syn.value; paintBar(); paintCounts(); schedulePreview(); scheduleAutosave(); };
      const means = row.querySelector('.gr-means');
      const grow = () => { means.style.height = 'auto'; means.style.height = `${Math.min(180, means.scrollHeight)}px`; };
      means.oninput = () => { r.means = means.value; grow(); paintBar(); paintCounts(); schedulePreview(); scheduleAutosave(); };
      // Enter in a glossary row means "next rule", not a newline — this is a
      // table of one-liners, and reaching for the mouse after every row is worse
      // than losing multi-line means (which the textarea still allows on Shift).
      means.onkeydown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); i === draft.rules.length - 1 ? addRule() : $$('#rules-list .glossary-row')[i + 1]?.querySelector('.gr-syntax')?.focus(); }
      };
      syn.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); means.focus(); } };
      row.querySelector('.gr-btn.up').onclick = () => move(draft.rules, i, -1);
      row.querySelector('.gr-btn.down').onclick = () => move(draft.rules, i, 1);
      row.querySelector('.gr-btn.del').onclick = () => { draft.rules.splice(i, 1); render(); schedulePreview(); scheduleAutosave(); };
      host.appendChild(row);
      grow();
    });
  }

  function renderExamples() {
    const host = $('#examples-list');
    host.innerHTML = '';
    if (!draft.examples.length) {
      host.innerHTML = '<div class="glossary-empty">No examples yet. Paste a few lines of your language and say what they must produce.</div>';
      return;
    }
    draft.examples.forEach((x, i) => {
      const row = document.createElement('div');
      row.className = 'example-row' + (x.on ? '' : ' off');
      row.innerHTML = `
        <div class="ex-head">
          <label class="gr-on" title="${x.on ? 'Sent to the compiler' : 'Kept, but not sent'}">
            <input type="checkbox" ${x.on ? 'checked' : ''} aria-label="Use this example">
          </label>
          <span class="ex-n">example ${i + 1}</span>
          <div class="gr-actions">
            <button class="gr-btn up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="gr-btn down" title="Move down" ${i === draft.examples.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="gr-btn del" title="Delete this example">${I.trash}</button>
          </div>
        </div>
        <textarea class="ex-source" rows="3" spellcheck="false" maxlength="${limits.exampleSource}" placeholder="a few lines of your language, copied as you'd really write them">${esc(x.source)}</textarea>
        <textarea class="ex-means" rows="2" spellcheck="false" maxlength="${limits.exampleMeans}" placeholder="what this must compile to">${esc(x.means)}</textarea>`;

      row.querySelector('.gr-on input').onchange = (e) => { x.on = e.target.checked; render(); schedulePreview(); scheduleAutosave(); };
      const src = row.querySelector('.ex-source');
      src.oninput = () => { x.source = src.value; paintBar(); schedulePreview(); scheduleAutosave(); };
      const mean = row.querySelector('.ex-means');
      mean.oninput = () => { x.means = mean.value; paintBar(); schedulePreview(); scheduleAutosave(); };
      row.querySelector('.gr-btn.up').onclick = () => move(draft.examples, i, -1);
      row.querySelector('.gr-btn.down').onclick = () => move(draft.examples, i, 1);
      row.querySelector('.gr-btn.del').onclick = () => { draft.examples.splice(i, 1); render(); schedulePreview(); scheduleAutosave(); };
      host.appendChild(row);
    });
  }

  function move(list, i, d) {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    render();
    schedulePreview();
    scheduleAutosave();
  }

  /* ── painting ────────────────────────────────────────────────────── */

  function render() {
    if (!built) return;
    $('#rules-enabled').checked = draft.enabled;
    $('#rules-page').classList.toggle('spec-off', !draft.enabled);
    const name = $('#rules-name'), ov = $('#rules-overview');
    if (name.value !== draft.name) name.value = draft.name;
    if (ov.value !== draft.overview) ov.value = draft.overview;
    renderRules();
    renderExamples();
    paintProposal();
    paintCounts();
    paintPreview();
    paintBar();
  }

  function paintCounts() {
    const n = liveRules().length;
    $('#rules-count').textContent = draft.rules.length
      ? `${n} of ${draft.rules.length} sent to the compiler`
      : '';
    const used = draft.overview.length;
    $('#rules-overview-count').textContent = used > limits.overview * 0.72 ? `${used} / ${limits.overview}` : '';
  }

  function paintPreview() {
    const pre = $('#rules-preview');
    const foot = $('#rules-preview-foot');
    if (!compiled.text) {
      pre.textContent = 'Nothing yet — the compiler falls back to its own reading of your syntax.';
      pre.classList.add('empty');
      foot.textContent = draft.enabled ? '' : 'the spec is switched off';
      return;
    }
    pre.classList.remove('empty');
    pre.textContent = compiled.text;
    const kb = compiled.chars < 1024 ? `${compiled.chars} characters` : `${(compiled.chars / 1024).toFixed(1)} KB`;
    foot.textContent = `${kb} · prepended to every build${compiled.truncated ? ' · TRUNCATED — trim it' : ''}`;
    foot.classList.toggle('warn', !!compiled.truncated);
  }

  function paintBar() {
    const st = $('#rules-status');
    const save = $('#rules-save');
    const revert = $('#rules-revert');
    if (!st) return;
    const d = dirty();
    reportDirty();   // an unsaved spec is unsaved work the shell must know about
    save.disabled = saving || !d;
    revert.disabled = saving || !d;
    save.textContent = saving ? 'saving…' : d ? 'Save rules' : 'Saved';
    if (saving) st.textContent = 'saving…';
    else if (d) st.textContent = 'unsaved changes — they save themselves in a moment, or press Save';
    else if (!active()) st.textContent = 'no rules yet — the compiler is guessing at your syntax';
    else st.textContent = `${liveRules().length} rule${liveRules().length === 1 ? '' : 's'}${liveExamples().length ? ` · ${liveExamples().length} example${liveExamples().length === 1 ? '' : 's'}` : ''} active${saved.updatedAt ? ` · saved ${when(saved.updatedAt)}` : ''}`;
    st.classList.toggle('dirty', d);
    paintChips();
  }

  function when(iso) {
    const t = Date.parse(iso);
    if (!t) return '';
    const s = Math.max(0, (Date.now() - t) / 1000);
    if (s < 45) return 'just now';
    if (s < 5400) return `${Math.round(s / 60)} min ago`;
    if (s < 86400 * 1.5) return `${Math.round(s / 3600)} h ago`;
    return new Date(t).toLocaleDateString();
  }

  // the status-bar chip, the settings card and the welcome band all describe the
  // same fact, so they're painted from one place
  function paintChips() {
    const n = liveRules().length;
    const on = active();
    const chip = $('#sb-rules');
    if (chip) {
      chip.textContent = on ? `§ rules: ${n || '✓'}` : '§ rules: none';
      chip.title = on
        ? `Language rules — ${n} rule${n === 1 ? '' : 's'}${liveExamples().length ? `, ${liveExamples().length} example${liveExamples().length === 1 ? '' : 's'}` : ''} sent with every build. Click to edit`
        : 'No language rules yet — the compiler is guessing at your syntax. Click to define it';
      chip.classList.toggle('needs-setup', !on);
    }
    const ab = $('#ab-rules');
    if (ab) {
      ab.classList.toggle('has-rules', on);
      ab.title = on ? `Language Rules — ${n} rule${n === 1 ? '' : 's'} active` : 'Language Rules — teach the compiler your syntax (recommended)';
    }
    const title = $('#set-rules-title'), sub = $('#set-rules-sub');
    if (title) {
      title.textContent = on
        ? `${draft.name || 'Your language'} — ${n} rule${n === 1 ? '' : 's'}${liveExamples().length ? `, ${liveExamples().length} example${liveExamples().length === 1 ? '' : 's'}` : ''}`
        : draft.rules.length ? 'Language rules written but switched off' : 'No language rules yet';
      sub.textContent = on
        ? 'Sent to the compiler before your source on every build.'
        : 'Recommended — define your syntax once and every build gets it right.';
    }
    const band = $('#w-rules-band'), bandSub = $('#w-rules-sub');
    if (band) {
      band.classList.toggle('done', on);
      band.querySelector('.wrb-title').textContent = on
        ? `Your language is defined${draft.name ? ` — ${draft.name}` : ''}`
        : 'Recommended — teach the compiler your syntax';
      bandSub.textContent = on
        ? `${n} rule${n === 1 ? '' : 's'}${liveExamples().length ? ` and ${liveExamples().length} worked example${liveExamples().length === 1 ? '' : 's'}` : ''} go to the compiler with every build. Edit them any time.`
        : "Write down what your invented constructs mean and the compiler stops guessing. It's the single biggest jump in how accurately your language compiles.";
      band.querySelector('.wrb-go').textContent = on ? 'Edit rules →' : 'Open Language Rules →';
    }
    const wl = $('#w-rules');
    if (wl) wl.innerHTML = `<span class="wl-ico">§</span> ${esc(on ? 'Edit your language rules…' : 'Set your language rules…')}`;
  }

  /* ── templates + proposals ───────────────────────────────────────── */

  function applyTemplate(id) {
    const t = TEMPLATES[id];
    if (!t) return;
    const hasWork = draft.overview.trim() || draft.rules.some((r) => r.syntax.trim() || r.means.trim());
    if (hasWork && !confirm(`Start from the "${t.label}" template?\n\nIt replaces what you've written here. Your files are untouched.`)) return;
    draft.name = draft.name || t.name || '';
    draft.overview = t.overview;
    draft.rules = t.rules.map((r) => ({ id: rowId('r'), on: true, ...r }));
    draft.enabled = true;
    render();
    schedulePreview();
    scheduleAutosave();
    toast('info', `${t.label} template loaded`, 'Now make it yours — every line is editable, and nothing is saved until you say so.');
  }

  async function infer() {
    if (inferring) return;
    if (!providerReady()) {
      toast('info', `${providerLabel()} isn't ready`, 'Connect a compiler provider first — the reading is done by the same model that compiles.');
      return connect({ quiet: false });
    }
    if (!flatFiles().length) return toast('info', 'Nothing to read', 'Write some of your language first, then ask for a reading.');
    inferring = true;
    const btn = $('#rules-infer');
    btn.disabled = true;
    btn.textContent = '✦ reading your language…';
    setState(`asking ${providerLabel()} to read ${S.settings.entry || flatFiles()[0].path}…`, '');
    try {
      const res = await api('/api/rules/infer', jsonBody({
        provider: S.settings.provider,
        model: curModel(),
        entry: S.settings.entry,
      }));
      proposal = res.proposal;
      setState('', '');
      render();
      $('#rules-proposal')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      toast('ok', 'Your language, as the compiler reads it', `${proposal.rules.length} rule${proposal.rules.length === 1 ? '' : 's'} proposed. Review them — nothing is saved until you accept.`, 9000);
    } catch (err) {
      setState('', err.message);
      toast('err', 'The reading failed', err.message);
    } finally {
      inferring = false;
      btn.disabled = false;
      btn.textContent = '✦ Propose rules from my files';
    }
  }

  function setState(text, err) {
    const el = $('#rules-infer-state');
    if (!el) return;
    el.textContent = err || text || '';
    el.classList.toggle('err', !!err);
  }

  // A proposal is a suggestion, shown beside what you already have, with three
  // honest choices — never an overwrite you have to discover afterwards.
  function paintProposal() {
    const host = $('#rules-list');
    document.getElementById('rules-proposal')?.remove();
    if (!proposal) return;
    const box = document.createElement('div');
    box.id = 'rules-proposal';
    box.className = 'proposal';
    const hasOwn = draft.rules.some((r) => r.syntax.trim() || r.means.trim()) || draft.overview.trim();
    box.innerHTML = `
      <div class="pr-head">
        <span class="pr-mark">✦</span>
        <div>
          <div class="pr-title">A reading of your language${proposal.name ? ` — “${esc(proposal.name)}”` : ''}</div>
          <div class="pr-sub">Proposed by ${esc(providerLabel())}. Nothing is saved until you choose.</div>
        </div>
        <button class="gr-btn del" id="pr-dismiss" title="Discard this reading">${I.trash}</button>
      </div>
      ${proposal.overview ? `<div class="pr-overview">${esc(proposal.overview)}</div>` : ''}
      <div class="pr-rules">${proposal.rules.map((r) => `
        <div class="pr-rule"><code>${esc(r.syntax || '—')}</code><span>→</span><em>${esc(r.means)}</em></div>`).join('')}</div>
      ${proposal.examples.length ? `<div class="pr-note">${proposal.examples.length} worked example${proposal.examples.length === 1 ? '' : 's'} included.</div>` : ''}
      <div class="pr-actions">
        <button class="prov-btn" id="pr-accept">${hasOwn ? 'Add to my rules' : 'Use these rules'}</button>
        ${hasOwn ? '<button class="prov-btn ghost" id="pr-replace">Replace mine</button>' : ''}
        <button class="prov-btn ghost" id="pr-discard">Discard</button>
      </div>`;
    host.parentNode.insertBefore(box, host);

    const take = (replace) => {
      const p = proposal;
      proposal = null;
      draft.enabled = true;
      draft.name = replace ? (p.name || draft.name) : (draft.name || p.name);
      draft.overview = replace || !draft.overview.trim() ? p.overview || draft.overview : draft.overview;
      const incoming = p.rules.map((r) => ({ id: rowId('r'), syntax: r.syntax, means: r.means, on: true }));
      if (replace) draft.rules = incoming;
      else {
        // don't stack a second definition of a construct the dreamer already defined
        const seen = new Set(draft.rules.map((r) => r.syntax.trim().toLowerCase()).filter(Boolean));
        draft.rules = draft.rules.concat(incoming.filter((r) => !seen.has(r.syntax.trim().toLowerCase())));
      }
      const exIn = p.examples.map((x) => ({ id: rowId('e'), source: x.source, means: x.means, on: true }));
      draft.examples = replace ? exIn : draft.examples.concat(exIn.filter((x) => !draft.examples.some((y) => y.source.trim() === x.source.trim())));
      render();
      refreshPreview();
      save();
    };
    box.querySelector('#pr-accept').onclick = () => take(false);
    box.querySelector('#pr-replace')?.addEventListener('click', () => take(true));
    const drop = () => { proposal = null; render(); };
    box.querySelector('#pr-discard').onclick = drop;
    box.querySelector('#pr-dismiss').onclick = drop;
  }

  /* ── load / save ─────────────────────────────────────────────────── */

  function adopt(payload) {
    saved = payload.rules;
    limits = payload.limits || limits;
    compiled = payload.compiled;
    return payload;
  }

  async function load() {
    try {
      const payload = await api('/api/rules');
      adopt(payload);
      draft = clone(saved);
      build();
      render();
    } catch {
      build();
      render();
    }
  }

  async function save({ quiet } = {}) {
    if (saving) return;
    clearTimeout(saveTimer);
    if (!dirty()) { paintBar(); return true; }
    saving = true;
    paintBar();
    try {
      const payload = await api('/api/rules', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: draft }) });
      adopt(payload);
      saving = false;
      // Deliberately NOT re-rendering the rows. Autosave fires 2.2s after a
      // keystroke, which is well inside the pause of someone still composing a
      // sentence — rebuilding the rows here would rip the focused textarea out
      // of the DOM mid-thought and drop every keystroke after it. The draft is
      // already what the user typed, and `saved` is now what the server holds,
      // so repainting the bar is the whole of the work.
      paintBar();
      if (!quiet) {
        toast('ok', 'Language rules saved', active()
          ? `${liveRules().length} rule${liveRules().length === 1 ? '' : 's'} go to the compiler from the next build on.`
          : 'Nothing active yet — add a rule or two and the compiler will follow them.');
      }
      // seeing the rules land is the moment the nudge has served its purpose
      markSeen();
      return true;
    } catch (err) {
      saving = false;
      paintBar();
      toast('err', 'Could not save the language rules', err.message);
      return false;
    }
  }

  function revert() {
    if (dirty() && !confirm('Throw away the unsaved changes to your language rules?')) return;
    clearTimeout(saveTimer);
    draft = clone(saved);
    proposal = null;
    render();
    refreshPreview();
  }

  /* ── the first-run recommendation ────────────────────────────────── */

  let seenNudge = false;

  function markSeen() {
    if (seenNudge) return;
    seenNudge = true;
    fetch('/api/prefs', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rulesNudged: true, rulesNudgedAt: new Date().toISOString() }),
    }).catch(() => {});
  }

  // Shown once, after the introduction has had its turn, and never when there
  // are already rules — a recommendation that repeats is just noise.
  function nudge(prefs) {
    if (prefs?.rulesNudged) { seenNudge = true; return; }
    if (active()) { markSeen(); return; }
    setTimeout(() => {
      if (ONBOARDING.isOpen()) return nudge(prefs);   // wait for the tour to finish
      if (active()) return markSeen();
      // recommending a page the user is already reading is noise, not guidance —
      // getting there IS what the nudge was for
      if (S.tabs.find((t) => t.id === S.active)?.kind === 'rules') return markSeen();
      toastAction(
        'Recommended: teach the compiler your syntax',
        'Write down what your invented constructs mean, and the compiler follows your definitions instead of guessing. Takes a minute; changes every build after it.',
        'Open Language Rules',
        () => { open(); markSeen(); },
      );
      // dismissing it without opening still counts — it was offered
      markSeen();
    }, ONBOARDING.isOpen() ? 1400 : 2600);
  }

  function open() {
    build();
    openSpecial('rules');
    render();
    refreshPreview();
    markSeen();
  }

  return {
    load, open, save, nudge,
    isDirty: dirty,
    isActive: active,
    ruleCount: () => liveRules().length,
    paintChips,
  };
})();

// onboarding.js is loaded before this file and needs to reach the rules page
// from its own slide CTA
window.RULES = RULES;

/* ═══════════════ SETTINGS PAGE ═══════════════ */
>>>>>>> df90e14 (Changes)
function buildSettingsPage() {
  $$('input[name="fmt"]').forEach((r) => {
    r.checked = r.value === S.settings.format;
    r.onchange = () => { S.settings.format = r.value; saveSettings(); };
  });
<<<<<<< HEAD
  const host = $('#model-list');
  host.innerHTML = '';
  const ids = Object.keys(S.catalog).length ? Object.keys(S.catalog) : Object.keys(MODEL_META);
  for (const id of ids) {
    const meta = MODEL_META[id] || { badge: '', desc: '' };
    const label = S.catalog[id]?.label || id;
    const row = document.createElement('div');
    row.className = 'model-row' + (S.settings.model === id ? ' checked' : '');
    row.innerHTML = `<span class="model-radio"></span><span class="model-name">${esc(label)}</span>
      ${meta.badge ? `<span class="model-badge">${esc(meta.badge)}</span>` : ''}
      <span class="model-desc">${esc(meta.desc)}</span>`;
    row.onclick = () => { S.settings.model = id; saveSettings(); buildSettingsPage(); };
    host.appendChild(row);
  }
=======
  buildProviderList();
  buildModelList();

>>>>>>> df90e14 (Changes)
  const notes = $('#set-notes');
  notes.value = S.settings.notes || '';
  notes.oninput = () => { S.settings.notes = notes.value; saveSettings(); };

  const sel = $('#set-entry');
  if (sel) {
    const paths = flatFiles().map((f) => f.path);
    sel.innerHTML = '<option value="">— choose the entry file —</option>'
      + paths.map((p) => `<option value="${esc(p)}" ${p === S.settings.entry ? 'selected' : ''}>${esc(p)}</option>`).join('');
    sel.onchange = () => { S.settings.entry = sel.value; saveSettings(); renderTree(); };
  }
}
<<<<<<< HEAD
function updateStatusChips() {
  $('#sb-format').innerHTML = S.settings.format === 'react' ? '⚛ React' : '&lt;/&gt; HTML';
  const label = S.catalog[S.settings.model]?.label || S.settings.model.replace('claude-', '');
  const eff = S.settings.model === 'claude-sonnet-5' ? ' · medium' : S.settings.model === 'claude-opus-4-8' ? ' · low' : '';
  $('#sb-model').textContent = `✦ ${label}${eff}`;
  const entryEl = $('#sb-entry');
  if (entryEl) entryEl.textContent = `▶ entry: ${S.settings.entry ? S.settings.entry.split('/').pop() : 'choose…'}`;
=======

function providerState(p) {
  if (p.connection?.connected) return { cls: 'ok', text: `connected · ${p.connection.version || 'ready'}` };
  if (!p.needsKey) return { cls: 'idle', text: 'not verified yet' };
  if (!p.hasKey) return { cls: 'warn', text: 'no key yet' };
  return { cls: 'idle', text: p.keySource === 'env' ? `key from ${p.envVar}` : `key saved · ${p.keyMask || '••••'}` };
}

function buildProviderList() {
  const host = $('#provider-list');
  if (!host) return;
  host.innerHTML = '';
  const ids = Object.keys(S.providers);
  if (!ids.length) { host.innerHTML = '<div class="prov-empty">…asking the server which compilers it can reach</div>'; return; }

  for (const id of ids) {
    const p = S.providers[id];
    const st = providerState(p);
    const on = S.settings.provider === id;
    const card = document.createElement('div');
    card.className = 'provider-card' + (on ? ' checked' : '');
    card.innerHTML = `
      <div class="prov-head">
        <span class="model-radio"></span>
        <span class="prov-name">${esc(p.label)}</span>
        <span class="prov-state ${st.cls}">${esc(st.text)}</span>
      </div>
      <div class="prov-desc">${esc(p.blurb || `Your own ${p.label.replace(/ API$/, '')} key — ${Object.keys(p.models || {}).length} models available.`)}</div>
      ${p.needsKey ? `
      <div class="prov-key">
        <input type="password" class="prov-input" placeholder="${esc(p.hasKey ? p.keyMask || '••••••••' : p.keyHint || 'paste your API key')}" spellcheck="false" autocomplete="off">
        <button class="prov-btn save">${p.hasKey ? 'Replace' : 'Save key'}</button>
        ${p.hasKey && p.keySource === 'saved' ? '<button class="prov-btn ghost clear">Remove</button>' : ''}
        ${p.hasKey ? '<button class="prov-btn ghost refresh" title="Re-fetch this account\'s model list">↻ models</button>' : ''}
        ${p.keyUrl ? `<a class="prov-link" href="${esc(p.keyUrl)}" target="_blank" rel="noreferrer">get a key ↗</a>` : ''}
      </div>
      <div class="prov-note">${p.keySource === 'env'
        ? `Loaded from the <code>${esc(p.envVar)}</code> environment variable. Saving a key here overrides it.`
        : `Stored server-side in <code>.imaginecode-keys.json</code> (gitignored, owner-only) — never in the browser${p.envVar ? `. <code>${esc(p.envVar)}</code> works too.` : '.'}`}</div>
      ${p.modelsError ? `<div class="prov-err">model list unavailable — ${esc(p.modelsError)}</div>` : ''}
      ` : `<div class="prov-note">Uses the Claude Code login already on this machine — no key to paste. ${p.connection?.connected ? '' : 'Press ⚡ in the status bar to verify it.'}</div>`}`;

    // clicking the card picks the provider — but not when you're using the controls inside it
    card.onclick = (e) => {
      if (e.target.closest('.prov-key')) return;
      if (S.settings.provider === id) return;
      S.settings.provider = id;
      saveSettings();
      buildSettingsPage();
      updateConnChip();
    };

    const input = card.querySelector('.prov-input');
    const saveKey = async () => {
      const value = input.value.trim();
      if (!value) { input.focus(); return toast('info', 'Nothing to save', `Paste your ${p.label} key first.`); }
      const btn = card.querySelector('.prov-btn.save');
      btn.disabled = true; btn.textContent = 'saving…';
      try {
        const next = await api('/api/provider/key', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: id, key: value }) });
        input.value = '';
        S.settings.provider = id;
        applyProviderPayload(next);
        toast('ok', `${p.label} key saved`, `Stored on this machine only. ${Object.keys(next.models || {}).length} models available.`);
        connect({ quiet: true });
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Save key';
        toast('err', 'Could not save the key', err.message);
      }
    };
    if (input) {
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); saveKey(); } };
      card.querySelector('.prov-btn.save').onclick = saveKey;
    }
    card.querySelector('.prov-btn.clear')?.addEventListener('click', async () => {
      try {
        const next = await api(`/api/provider/key?provider=${encodeURIComponent(id)}`, { method: 'DELETE' });
        applyProviderPayload(next);
        toast('info', `${p.label} key removed`, 'It\'s gone from this machine.');
      } catch (err) { toast('err', 'Could not remove the key', err.message); }
    });
    card.querySelector('.prov-btn.refresh')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = '↻ …';
      try {
        const next = await api('/api/provider/models/refresh', jsonBody({ provider: id }));
        applyProviderPayload(next);
        toast('ok', `${p.label} models refreshed`, `${Object.keys(next.models || {}).length} models available on your account.`);
      } catch (err) { btn.disabled = false; btn.textContent = '↻ models'; toast('err', 'Refresh failed', err.message); }
    });

    host.appendChild(card);
  }
}

function buildModelList() {
  const host = $('#model-list');
  if (!host) return;
  const p = prov();
  const models = p?.models || {};
  const ids = Object.keys(models);
  const desc = $('#model-desc');
  if (desc) desc.textContent = p
    ? `Which ${p.label} model does the imagining-to-existence work.`
    : 'Which model does the imagining-to-existence work.';

  host.innerHTML = '';
  if (!ids.length) { host.innerHTML = '<div class="prov-empty">no models yet — add a key above</div>'; return; }
  const picked = curModel();
  for (const id of ids) {
    const m = models[id];
    const row = document.createElement('div');
    row.className = 'model-row' + (picked === id ? ' checked' : '') + (m.available === false ? ' dim' : '');
    const price = m.price ? `$${m.price.in}/$${m.price.out} per 1M` : '';
    row.innerHTML = `<span class="model-radio"></span><span class="model-name">${esc(m.label || id)}</span>
      ${m.badge ? `<span class="model-badge">${esc(m.badge)}</span>` : ''}
      <span class="model-desc">${esc(m.desc || id)}</span>
      ${price ? `<span class="model-price">${esc(price)}</span>` : ''}`;
    row.title = id;
    row.onclick = () => { setModel(id); buildSettingsPage(); };
    host.appendChild(row);
  }
}

function updateStatusChips() {
  $('#sb-format').innerHTML = S.settings.format === 'react' ? '⚛ React' : '&lt;/&gt; HTML';
  const id = curModel();
  const meta = prov()?.models?.[id] || {};
  const eff = meta.supportsEffort && meta.effortDefault ? ` · ${meta.effortDefault}` : '';
  $('#sb-model').textContent = `✦ ${meta.label || String(id).replace(/^claude-/, '')}${eff}`;
  $('#sb-model').title = `Compiler model — ${id} · click to change`;
  const pv = $('#sb-provider');
  if (pv) {
    pv.textContent = `⚡ ${providerLabel()}`;
    pv.title = `Compiler provider — ${providerReady() ? 'ready' : 'needs setup'} · click to change`;
    pv.classList.toggle('needs-setup', !providerReady());
  }
  const entryEl = $('#sb-entry');
  if (entryEl) entryEl.textContent = `▶ entry: ${S.settings.entry ? S.settings.entry.split('/').pop() : 'choose…'}`;
  RULES.paintChips();
>>>>>>> df90e14 (Changes)
}

/* ═══════════════ WELCOME ═══════════════ */
function renderRecents() {
  const host = $('#w-recent');
  if (!host) return;
  const existing = new Set(flatFiles().map((f) => f.path));
  const items = S.recents.filter((p) => existing.has(p));
  host.innerHTML = items.length
    ? items.map((p) => `<div class="w-recent-item" data-p="${esc(p)}">${chipHTML(p.split('/').pop())}<span>${esc(p)}</span></div>`).join('')
    : '<div class="w-recent-empty">nothing yet — every universe starts empty</div>';
  host.querySelectorAll('.w-recent-item').forEach((el) => (el.onclick = () => openFile(el.dataset.p)));
}

/* ═══════════════ SEARCH ═══════════════ */
let searchTimer = null;
function bindSearch() {
  const input = $('#search-input');
  input.oninput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const q = input.value.trim();
      const host = $('#search-results');
      if (!q) { host.innerHTML = ''; return; }
      const { results } = await api(`/api/search?q=${encodeURIComponent(q)}`);
      if (!results.length) { host.innerHTML = '<div class="search-empty">no results — not even imagined yet</div>'; return; }
      const byFile = {};
      for (const r of results) (byFile[r.path] ??= []).push(r);
      host.innerHTML = Object.entries(byFile).map(([p, rs]) => `
        <div class="search-file">${chipHTML(p.split('/').pop())}<span>${esc(p.split('/').pop())}</span><span class="count">${rs.length}</span></div>
        ${rs.map((r) => `<div class="search-line" data-p="${esc(p)}" data-l="${r.line}">${esc(r.text).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), (m) => `<mark>${m}</mark>`)}</div>`).join('')}
      `).join('');
      host.querySelectorAll('.search-line').forEach((el) => (el.onclick = () => openFile(el.dataset.p, { line: Number(el.dataset.l) })));
    }, 220);
  };
}

function switchSideView(view) {
  $('#sidebar').classList.remove('collapsed');
  $$('.ab-item[data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  $$('.side-view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  if (view === 'search') $('#search-input').focus();
}

/* ═══════════════ COMMAND PALETTE ═══════════════ */
const COMMANDS = [
  { id: 'run', label: 'Imagine: Run Imagination', keys: 'Ctrl+Enter', ico: '▶', run: () => run() },
  { id: 'rebuild', label: 'Imagine: Rebuild from Scratch', ico: '⟲', run: () => run({ fresh: true }) },
  { id: 'stop', label: 'Imagine: Stop Build', keys: 'Shift+F5', ico: '■', run: () => stopBuild() },
<<<<<<< HEAD
  { id: 'connect', label: 'Imagine: Connect Claude Code', ico: '⚡', run: () => connect() },
=======
  { id: 'connect', label: 'Imagine: Connect Compiler Provider', ico: '⚡', run: () => connect() },
  { id: 'rules', label: 'Language: Edit Language Rules', keys: 'Ctrl+Shift+L', ico: '§', run: () => RULES.open() },
  { id: 'rules-infer', label: 'Language: Propose Rules From My Files', ico: '✦', run: () => { RULES.open(); $('#rules-infer')?.click(); } },
  { id: 'rules-save', label: 'Language: Save Language Rules', ico: '✓', run: () => RULES.save() },
  { id: 'keys', label: 'Settings: Compiler Provider & API Keys', ico: '🔑', run: () => openSpecial('settings') },
>>>>>>> df90e14 (Changes)
  { id: 'newfile', label: 'File: New Imagination File', ico: '✦', run: () => newFileFlow() },
  { id: 'newfolder', label: 'File: New Folder', ico: '▸', run: () => newFolderFlow() },
  { id: 'save', label: 'File: Save', keys: 'Ctrl+S', ico: '✓', run: () => saveActive() },
  { id: 'saveall', label: 'File: Save All', ico: '✓', run: () => saveAll().then(() => flashStatus('✦ all saved')) },
  { id: 'fmt-html', label: 'Settings: Output Format → HTML', ico: '‹/›', run: () => { S.settings.format = 'html'; saveSettings(); buildSettingsPage(); } },
  { id: 'fmt-react', label: 'Settings: Output Format → React', ico: '⚛', run: () => { S.settings.format = 'react'; saveSettings(); buildSettingsPage(); } },
  { id: 'settings', label: 'View: Open Settings', ico: '⚙', run: () => openSpecial('settings') },
  { id: 'welcome', label: 'View: Welcome', ico: '✦', run: () => openSpecial('welcome') },
<<<<<<< HEAD
=======
  { id: 'intro', label: 'Help: Show Introduction', ico: '✦', run: () => ONBOARDING.open() },
>>>>>>> df90e14 (Changes)
  { id: 'panel', label: 'View: Toggle Imagine Terminal', keys: 'Ctrl+`', ico: '❯', run: () => togglePanel() },
  { id: 'preview', label: 'View: Toggle Preview', ico: '◫', run: () => togglePreview() },
  { id: 'sidebar', label: 'View: Toggle Sidebar', keys: 'Ctrl+B', ico: '◧', run: () => $('#sidebar').classList.toggle('collapsed') },
  { id: 'browser', label: 'Preview: Open in Browser', ico: '↗', run: () => window.open('/preview/', '_blank') },
  { id: 'clearterm', label: 'Terminal: Clear', ico: '⌀', run: () => TERM.clear() },
  { id: 'search', label: 'Search: Find in Imagination', ico: '🔍', run: () => switchSideView('search') },
];

<<<<<<< HEAD
=======
// provider + model entries depend on what the server reports, so they're built fresh
function allCommands() {
  const dyn = [];
  for (const [id, p] of Object.entries(S.providers)) {
    dyn.push({
      id: `prov-${id}`, ico: '⚡',
      label: `Settings: Compiler Provider → ${p.label}`,
      keys: id === S.settings.provider ? 'current' : (p.needsKey && !p.hasKey ? 'needs a key' : ''),
      run: () => { S.settings.provider = id; saveSettings(); buildSettingsPage(); updateConnChip(); openSpecial('settings'); },
    });
  }
  for (const [id, m] of Object.entries(prov()?.models || {})) {
    dyn.push({
      id: `model-${id}`, ico: '✦',
      label: `Settings: Compiler Model → ${m.label || id}`,
      keys: id === curModel() ? 'current' : '',
      run: () => { setModel(id); buildSettingsPage(); },
    });
  }
  return COMMANDS.concat(dyn);
}

>>>>>>> df90e14 (Changes)
const palette = { open: false, mode: '>', items: [], sel: 0, onPick: null };
function openPalette(prefix) {
  palette.open = true;
  $('#palette').classList.remove('hidden');
  const input = $('#palette-input');
  input.value = prefix;
  input.placeholder = palette.onPick
    ? 'Choose the ENTRY file — the program the compiler starts from…'
    : 'Type a command… ( > for commands, or a file name )';
  input.focus();
  renderPalette();
}
function closePalette() {
  palette.open = false;
  const input = $('#palette-input');
  const hadFocus = document.activeElement === input;
  $('#palette').classList.add('hidden');
  if (palette.onPick) { const cb = palette.onPick; palette.onPick = null; cb(null); } // Esc / backdrop = cancel
  if (hadFocus) editor?.focus();
}
function pickEntry() {
  return new Promise((resolve) => {
    palette.onPick = (p) => resolve(p);
    openPalette('');
  });
}
function renderPalette() {
  const q = $('#palette-input').value;
  const isCmd = !palette.onPick && q.startsWith('>');
  const needle = (isCmd ? q.slice(1) : q).trim().toLowerCase();
  let items;
  if (isCmd) {
<<<<<<< HEAD
    items = COMMANDS.filter((c) => c.label.toLowerCase().includes(needle))
=======
    items = allCommands().filter((c) => c.label.toLowerCase().includes(needle))
>>>>>>> df90e14 (Changes)
      .map((c) => ({ ico: c.ico, label: c.label, keys: c.keys, run: c.run }));
  } else {
    items = flatFiles().filter((f) => f.path.toLowerCase().includes(needle))
      .map((f) => ({
        chip: f.name,
        label: f.name,
        detail: (f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : '') + (palette.onPick && f.path === S.settings.entry ? ' · current entry' : ''),
        run: () => {
          if (palette.onPick) { const cb = palette.onPick; palette.onPick = null; cb(f.path); }
          else openFile(f.path);
        },
      }));
  }
  palette.items = items.slice(0, 40);
  palette.sel = Math.min(palette.sel, Math.max(0, palette.items.length - 1));
  const host = $('#palette-list');
  host.innerHTML = palette.items.length
    ? palette.items.map((it, i) => `
      <div class="palette-item ${i === palette.sel ? 'selected' : ''}" data-i="${i}">
        ${it.chip ? chipHTML(it.chip) : `<span class="p-ico">${it.ico || ''}</span>`}
        <span class="p-label">${esc(it.label)}</span>
        ${it.detail ? `<span class="p-detail">${esc(it.detail)}</span>` : ''}
        ${it.keys ? `<span class="p-keys">${esc(it.keys)}</span>` : ''}
      </div>`).join('')
    : '<div class="palette-empty">nothing matches — maybe it hasn\'t been imagined yet</div>';
  host.querySelectorAll('.palette-item').forEach((el) => {
    // run BEFORE closing — closePalette treats a still-pending pick as a cancel
    el.onclick = () => { const it = palette.items[Number(el.dataset.i)]; it.run(); closePalette(); };
    el.onmousemove = () => { palette.sel = Number(el.dataset.i); host.querySelectorAll('.palette-item').forEach((x) => x.classList.toggle('selected', x === el)); };
  });
}

/* ═══════════════ MENUS ═══════════════ */
const MENUS = {
  file: [
    { label: 'New Imagination File', keys: 'from Explorer', run: newFileFlow },
    { label: 'New Folder', run: newFolderFlow },
    'sep',
<<<<<<< HEAD
=======
    { label: 'Language Rules…', keys: 'Ctrl+Shift+L', run: () => RULES.open() },
    'sep',
>>>>>>> df90e14 (Changes)
    { label: 'Save', keys: 'Ctrl+S', run: () => saveActive() },
    { label: 'Save All', run: () => saveAll().then(() => flashStatus('✦ all saved')) },
    'sep',
    { label: 'Run Imagination', keys: 'Ctrl+Enter', run: () => run() },
  ],
  edit: [
    { label: 'Undo', keys: 'Ctrl+Z', run: () => editor?.trigger('menu', 'undo') },
    { label: 'Redo', keys: 'Ctrl+Y', run: () => editor?.trigger('menu', 'redo') },
    'sep',
    { label: 'Find', keys: 'Ctrl+F', run: () => editor?.getAction('actions.find')?.run() },
    { label: 'Replace', keys: 'Ctrl+H', run: () => editor?.getAction('editor.action.startFindReplaceAction')?.run() },
    'sep',
    { label: 'Toggle Line Comment', keys: 'Ctrl+/', run: () => editor?.getAction('editor.action.commentLine')?.run() },
  ],
  view: [
    { label: 'Command Palette…', keys: 'Ctrl+Shift+P', run: () => openPalette('>') },
    { label: 'Quick Open File…', keys: 'Ctrl+P', run: () => openPalette('') },
    'sep',
    { label: 'Welcome', run: () => openSpecial('welcome') },
<<<<<<< HEAD
=======
    { label: 'Language Rules', keys: 'Ctrl+Shift+L', run: () => RULES.open() },
>>>>>>> df90e14 (Changes)
    { label: 'Settings', run: () => openSpecial('settings') },
    'sep',
    { label: 'Toggle Sidebar', keys: 'Ctrl+B', run: () => $('#sidebar').classList.toggle('collapsed') },
    { label: 'Toggle Imagine Terminal', keys: 'Ctrl+`', run: () => togglePanel() },
    { label: 'Toggle Preview', run: () => togglePreview() },
  ],
  run: [
    { label: '▶ Run Imagination', keys: 'Ctrl+Enter', run: () => run() },
    { label: '⟲ Rebuild from Scratch', run: () => run({ fresh: true }) },
    { label: '■ Stop Build', keys: 'Shift+F5', run: () => stopBuild() },
    'sep',
<<<<<<< HEAD
    { label: 'Open Preview in Browser', run: () => window.open('/preview/', '_blank') },
    { label: 'Connect Claude Code', run: () => connect() },
  ],
  help: [
    { label: 'Welcome', run: () => openSpecial('welcome') },
    { label: 'About ImagineCode', run: () => toast('info', 'ImagineCode v1.0', 'The IDE for programming languages that don\'t exist yet. Imagination in, websites out — compiled by Claude Code. ✦') },
=======
    { label: '§ Language Rules…', keys: 'Ctrl+Shift+L', run: () => RULES.open() },
    { label: 'Open Preview in Browser', run: () => window.open('/preview/', '_blank') },
    { label: 'Connect Compiler Provider', keys: '⚡', run: () => connect() },
    { label: 'Choose Provider / API Keys…', run: () => openSpecial('settings') },
  ],
  help: [
    { label: '✦ Show Introduction', run: () => ONBOARDING.open() },
    { label: '§ Language Rules — teach the compiler your syntax', run: () => RULES.open() },
    { label: 'Welcome', run: () => openSpecial('welcome') },
    'sep',
    { label: 'About ImagineCode', run: () => toast('info', `ImagineCode${ENV.version ? ' v' + ENV.version : ''}`, 'The IDE for programming languages that don\'t exist yet. Imagination in, websites out — compiled by Claude Code, or by your own Anthropic, OpenAI or DeepSeek key. ✦') },
>>>>>>> df90e14 (Changes)
  ],
};

let openMenu = null;
function showMenuDropdown(name) {
  const menuEl = $(`.menu[data-menu="${name}"]`);
  const dd = $('#menu-dropdown');
  $$('.menu').forEach((m) => m.classList.toggle('open', m === menuEl));
  const rect = menuEl.getBoundingClientRect();
  dd.style.left = `${rect.left}px`;
  dd.style.top = `${rect.bottom + 2}px`;
  dd.innerHTML = MENUS[name].map((it) => it === 'sep'
    ? '<div class="ctx-sep"></div>'
    : `<div class="ctx-item" data-l="${esc(it.label)}">${esc(it.label)}${it.keys ? `<span class="ctx-keys">${esc(it.keys)}</span>` : ''}</div>`).join('');
  dd.classList.remove('hidden');
  openMenu = name;
  dd.querySelectorAll('.ctx-item').forEach((el) => {
    el.onclick = () => { const item = MENUS[name].find((i) => i !== 'sep' && i.label === el.dataset.l); hideMenus(); item?.run(); };
  });
}
function hideMenus() {
  $('#menu-dropdown').classList.add('hidden');
  $$('.menu').forEach((m) => m.classList.remove('open'));
  openMenu = null;
}

/* ═══════════════ CONTEXT MENU ═══════════════ */
function showCtx(e, items) {
  const ctx = $('#ctx-menu');
  ctx.innerHTML = items.map((it) => it === 'sep'
    ? '<div class="ctx-sep"></div>'
    : `<div class="ctx-item" data-l="${esc(it.label)}">${esc(it.label)}${it.keys ? `<span class="ctx-keys">${esc(it.keys)}</span>` : ''}</div>`).join('');
  ctx.classList.remove('hidden');
  const w = ctx.offsetWidth, h = ctx.offsetHeight;
  ctx.style.left = `${Math.min(e.clientX, innerWidth - w - 6)}px`;
  ctx.style.top = `${Math.min(e.clientY, innerHeight - h - 6)}px`;
  ctx.querySelectorAll('.ctx-item').forEach((el) => {
    el.onclick = () => { const item = items.find((i) => i !== 'sep' && i.label === el.dataset.l); hideCtx(); item?.run(); };
  });
}
function hideCtx() { $('#ctx-menu').classList.add('hidden'); }

/* ═══════════════ TOASTS ═══════════════ */
function toast(kind, title, msg, ms = 6000) {
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  const ico = kind === 'ok' ? '✓' : kind === 'err' ? '✕' : '✦';
  el.innerHTML = `<span class="toast-ico">${ico}</span><div class="toast-body"><div class="toast-title">${esc(title)}</div><div class="toast-msg">${esc(msg)}</div></div><button class="toast-close">✕</button>`;
  el.querySelector('.toast-close').onclick = () => el.remove();
  host.appendChild(el);
  if (ms) setTimeout(() => el.remove(), ms);
}

<<<<<<< HEAD
=======
// A recommendation the user can act on in one click. Deliberately sticky: it is
// shown once in the app's life, so timing it out would mean losing it for good.
function toastAction(title, msg, actionLabel, onAction) {
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast info toast-wide';
  el.innerHTML = `<span class="toast-ico">§</span>
    <div class="toast-body">
      <div class="toast-title">${esc(title)}</div>
      <div class="toast-msg">${esc(msg)}</div>
      <button class="toast-action">${esc(actionLabel)}</button>
    </div>
    <button class="toast-close">✕</button>`;
  el.querySelector('.toast-close').onclick = () => el.remove();
  el.querySelector('.toast-action').onclick = () => { el.remove(); onAction(); };
  host.appendChild(el);
}

>>>>>>> df90e14 (Changes)
/* ═══════════════ CHROME BINDING ═══════════════ */
function bindChrome() {
  // icons
  $('.ab-item[data-view="explorer"]').innerHTML = I.files;
  $('.ab-item[data-view="search"]').innerHTML = I.search;
<<<<<<< HEAD
=======
  $('#ab-rules').innerHTML = I.rules;
>>>>>>> df90e14 (Changes)
  $('.ab-item[data-view="run-view"]').innerHTML = I.play;
  $('#ab-claude').innerHTML = I.zap + '<span class="ab-dot"></span>';
  $('#ab-settings').innerHTML = I.gear;
  $('#btn-new-file').innerHTML = I.newFile;
  $('#btn-new-folder').innerHTML = I.newFolder;
  $('#btn-refresh').innerHTML = I.refresh;
  $('#btn-collapse').innerHTML = I.collapse;
  $('#btn-split-preview').innerHTML = I.split;
  $('#pv-refresh').innerHTML = I.refresh;
  $('#pv-external').innerHTML = I.external;
  $('#pv-close').innerHTML = I.close;
  $('#term-stop').innerHTML = I.stop;
  $('#term-clear').innerHTML = I.clear;
  $('#term-close').innerHTML = I.close;
  $('#term-stop').disabled = true;

  // activity bar
  $$('.ab-item[data-view]').forEach((b) => {
    b.onclick = () => {
      if (b.dataset.view === 'run-view') return run();
      const view = b.dataset.view;
      const already = b.classList.contains('active') && !$('#sidebar').classList.contains('collapsed');
      if (already) $('#sidebar').classList.add('collapsed');
      else switchSideView(view);
    };
  });
  $('#ab-claude').onclick = () => connect();
  $('#ab-settings').onclick = () => openSpecial('settings');

  // explorer actions
  $('#btn-new-file').onclick = newFileFlow;
  $('#btn-new-folder').onclick = newFolderFlow;
  $('#btn-refresh').onclick = refreshTree;
  $('#btn-collapse').onclick = () => { S.expanded.clear(); renderTree(); };
  $('#ws-header').onclick = () => {
    const chev = $('#ws-header .chev');
    chev.classList.toggle('down');
    $('#file-tree').style.display = chev.classList.contains('down') ? '' : 'none';
  };
  $('#file-tree').oncontextmenu = (e) => {
    if (e.target.closest('.tree-row')) return;
    e.preventDefault();
    showCtx(e, [
      { label: 'New Imagination File', run: newFileFlow },
      { label: 'New Folder', run: newFolderFlow },
      'sep',
      { label: 'Refresh', run: refreshTree },
    ]);
  };

  // run + preview + panel
  $('#btn-run').onclick = () => run();
  $('#btn-split-preview').onclick = togglePreview;
  $('#pv-refresh').onclick = () => openPreview(true);
  $('#pv-external').onclick = () => window.open('/preview/', '_blank');
  $('#pv-close').onclick = closePreview;
  $('#term-clear').onclick = () => TERM.clear();
  $('#term-close').onclick = () => showPanel(false);
  $('#term-stop').onclick = () => stopBuild();
  $('#preview-frame').onload = () => $('#preview-frame').classList.remove('building');

  // welcome
  $('#w-connect').onclick = () => connect();
<<<<<<< HEAD
  $('#w-new').onclick = newFileFlow;
  $('#w-run').onclick = () => run();
=======
  $('#w-keys').onclick = () => openSpecial('settings');
  $('#w-new').onclick = newFileFlow;
  $('#w-run').onclick = () => run();
  $('#w-intro').onclick = () => ONBOARDING.open();

  bindDesktop();
>>>>>>> df90e14 (Changes)

  // status bar
  $('#sb-claude').onclick = () => connect();
  $('#sb-format').onclick = () => openSpecial('settings');
  $('#sb-model').onclick = () => openSpecial('settings');
<<<<<<< HEAD
=======
  $('#sb-provider').onclick = () => openSpecial('settings');
>>>>>>> df90e14 (Changes)
  $('#sb-entry').onclick = async () => {
    const p = await pickEntry();
    if (p) {
      S.settings.entry = p;
      saveSettings(); renderTree(); buildSettingsPage();
      toast('info', 'Entry file set', `The compiler now starts from ${p}.`);
    }
  };

  // menus
  $$('.menu').forEach((m) => {
    m.querySelector('.menu-title').onclick = (e) => {
      e.stopPropagation();
      openMenu === m.dataset.menu ? hideMenus() : showMenuDropdown(m.dataset.menu);
    };
    m.onmouseenter = () => { if (openMenu && openMenu !== m.dataset.menu) showMenuDropdown(m.dataset.menu); };
  });

  // palette
  $('#palette').onclick = (e) => { if (e.target.id === 'palette') closePalette(); };
  $('#palette-input').oninput = () => { palette.sel = 0; renderPalette(); };
  $('#palette-input').onkeydown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palette.sel = Math.min(palette.sel + 1, palette.items.length - 1); renderPalette(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palette.sel = Math.max(palette.sel - 1, 0); renderPalette(); }
    else if (e.key === 'Enter') { const it = palette.items[palette.sel]; if (it) { it.run(); closePalette(); } }
    else if (e.key === 'Escape') closePalette();
  };

  // global dismissal
  window.addEventListener('mousedown', (e) => {
    if (!e.target.closest('#ctx-menu')) hideCtx();
    if (!e.target.closest('#menu-dropdown') && !e.target.closest('.menu')) hideMenus();
  });
  window.addEventListener('blur', () => { hideCtx(); hideMenus(); });

  // keybindings
  window.addEventListener('keydown', (e) => {
<<<<<<< HEAD
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); openPalette('>'); return; }
=======
    // The introduction owns the keyboard while it is up — this listener is
    // registered first, so without this line Ctrl+Enter during the tutorial
    // would quietly kick off a build behind the overlay.
    if (ONBOARDING.isOpen()) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); openPalette('>'); return; }
    if (mod && e.shiftKey && e.code === 'KeyL') { e.preventDefault(); RULES.open(); return; }
>>>>>>> df90e14 (Changes)
    if (e.key === 'F1') { e.preventDefault(); openPalette('>'); return; }
    if (mod && !e.shiftKey && e.code === 'KeyP') { e.preventDefault(); openPalette(''); return; }
    if (mod && e.code === 'KeyS') { e.preventDefault(); saveActive(); return; }
    if (mod && e.key === 'Enter') { e.preventDefault(); run(); return; }
    if (e.key === 'F5' && !e.shiftKey) { e.preventDefault(); run(); return; }
    if (e.key === 'F5' && e.shiftKey) { e.preventDefault(); stopBuild(); return; }
    if (mod && e.key === '`') { e.preventDefault(); togglePanel(); return; }
    if (mod && e.code === 'KeyB') { e.preventDefault(); $('#sidebar').classList.toggle('collapsed'); return; }
    if (e.key === 'F2' && S.selectedPath && document.activeElement.tagName !== 'INPUT' && !editor?.hasTextFocus()) { e.preventDefault(); renameFlow(S.selectedPath); return; }
    if (e.key === 'Escape') { hideCtx(); hideMenus(); if (palette.open) closePalette(); }
  }, true);

<<<<<<< HEAD
  window.addEventListener('beforeunload', (e) => {
    if (S.dirty.size) { e.preventDefault(); e.returnValue = ''; }
  });
=======
  // In the desktop shell the close guard is a native dialog driven from main —
  // beforeunload there would cancel the close with no explanation at all.
  if (!window.imagine) {
    window.addEventListener('beforeunload', (e) => {
      if (S.dirty.size || RULES.isDirty()) { e.preventDefault(); e.returnValue = ''; }
    });
  }
>>>>>>> df90e14 (Changes)

  bindSearch();
  bindResizers();
}

<<<<<<< HEAD
=======
/* ═══════════════ DESKTOP SHELL ═══════════════ */
// Everything in here is a no-op in a plain browser tab: window.imagine only
// exists when the page is being served into the Electron window.
function bindDesktop() {
  const D = window.imagine;
  if (!D) return;
  document.body.classList.add('is-desktop');

  const ctl = $('#winctl');
  ctl.classList.remove('hidden');
  ctl.querySelector('[data-wc="min"]').onclick = () => D.minimize();
  ctl.querySelector('[data-wc="max"]').onclick = () => D.toggleMaximize();
  ctl.querySelector('[data-wc="close"]').onclick = () => D.close();
  D.onMaximizeChange?.((maximized) => ctl.classList.toggle('maximized', !!maximized));

  // the shell warns before closing on unsaved imagination, so it needs to
  // know how much there is — reportDirty() keeps that number current
  reportDirty();
  D.onSaveAll(async () => {
    // report the truth: on failure the shell keeps the window open rather than
    // closing it over files that never reached disk
    try {
      await saveAll();
      D.savedAll({ ok: true });
    } catch (err) {
      D.savedAll({ ok: false, error: String(err?.message || err) });
    }
  });

  // double-clicking the drag region maximizes, like every other Windows app
  $('#titlebar').ondblclick = (e) => { if (!e.target.closest('button, .menu, #winctl')) D.toggleMaximize(); };
}

>>>>>>> df90e14 (Changes)
/* ═══════════════ RESIZERS ═══════════════ */
function bindResizers() {
  const drag = (el, onMove) => {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.classList.add('dragging');
      el.setPointerCapture(e.pointerId);
      const move = (ev) => onMove(ev);
      const up = () => {
        el.classList.remove('dragging');
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  };
  drag($('#sidebar-resizer'), (e) => {
    const w = Math.min(520, Math.max(170, e.clientX - 48));
    document.documentElement.style.setProperty('--sidebar-w', `${w}px`);
  });
  drag($('#preview-resizer'), (e) => {
    const region = $('#editor-region').getBoundingClientRect();
    const w = Math.min(region.width - 240, Math.max(220, region.right - e.clientX));
    document.documentElement.style.setProperty('--preview-w', `${w}px`);
  });
  drag($('#panel-resizer'), (e) => {
    const h = Math.min(innerHeight * 0.7, Math.max(80, innerHeight - 22 - e.clientY));
    document.documentElement.style.setProperty('--panel-h', `${h}px`);
  });
}
