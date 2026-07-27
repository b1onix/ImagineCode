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
  settings: { format: 'html', model: 'claude-sonnet-5', notes: '', entry: '' },
  catalog: {},
  connection: { connected: false },
  building: false,
  previewOpen: false,
  recents: [],
};
let editor = null;
let tabSeq = 0;

/* ─────────────── settings persistence ─────────────── */
function loadLocal() {
  try { Object.assign(S.settings, JSON.parse(localStorage.getItem('imaginecode.settings') || '{}')); } catch {}
  try { S.recents = JSON.parse(localStorage.getItem('imaginecode.recents') || '[]'); } catch {}
}
function saveSettings() { localStorage.setItem('imaginecode.settings', JSON.stringify(S.settings)); updateStatusChips(); }
function pushRecent(p) {
  S.recents = [p, ...S.recents.filter((r) => r !== p)].slice(0, 6);
  localStorage.setItem('imaginecode.recents', JSON.stringify(S.recents));
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
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' } });
require(['vs/editor/editor.main'], () => {
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
});

function langFor(path) {
  const ext = path.split('.').pop().toLowerCase();
  return ({ html: 'html', htm: 'html', css: 'css', js: 'javascript', jsx: 'javascript', ts: 'typescript', json: 'json', md: 'markdown' })[ext] || 'imagine';
}

/* ═══════════════ INIT ═══════════════ */
async function init() {
  loadLocal();
  bindChrome();
  updateStatusChips();
  termBoot();

  const [status] = await Promise.all([api('/api/status').catch(() => null), refreshTree()]);
  if (status) {
    S.catalog = status.models || {};
    if (status.connected) applyConnection(status);
    if (!S.catalog[S.settings.model]) S.settings.model = status.defaultModel || 'claude-sonnet-5';
  }
  buildSettingsPage();
  updateStatusChips();

  openSpecial('welcome');
  const first = flatFiles().find((f) => f.path.endsWith('.imagine')) || flatFiles()[0];
  if (first) await openFile(first.path, { keepFocus: true });
  activateTab(S.tabs.find((t) => t.kind === 'welcome')?.id);
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
  el: null, para: null, think: null,
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
    if (!this[key]) {
      const d = document.createElement('div');
      d.className = `t-line ${kind === 'think' ? 't-think' : 't-delta'}`;
      this.el.appendChild(d);
      this[key] = d;
    }
    this[key].textContent += text;
    this.scroll();
  },
  closeStream() { this.para = null; this.think = null; },
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
  TERM.line('t-dim', 'using a third-party Claude provider instead? no /login needed — put its config in');
  TERM.line('t-dim', '~/.claude/settings.json under "env" (ANTHROPIC_BASE_URL + ANTHROPIC_API_KEY) — ImagineCode loads it automatically.');
  TERM.line('t-dim', '(this Imagine Terminal is just the build log — it can\'t run /login for you)');
}

function reportConnectFailure(errText, quiet) {
  const needsLogin = /not logged in|\/login/i.test(errText || '');
  if (needsLogin) {
    loginHelp();
    if (!quiet) toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in. Open Windows cmd → run "claude" → type /login. Exact steps are in the Imagine Terminal below.', 16000);
  } else {
    TERM.line('t-err', `✗ connection failed — ${esc(errText || 'unknown')}`);
    if (!quiet) toast('err', 'Could not connect', errText || 'Is Claude Code installed and logged in?');
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

function openSpecial(kind) {
  let tab = S.tabs.find((t) => t.kind === kind);
  if (!tab) {
    tab = { id: ++tabSeq, kind, name: kind === 'welcome' ? 'Welcome' : 'Settings' };
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

function renderTabs() {
  const host = $('#tabbar');
  host.innerHTML = '';
  for (const t of S.tabs) {
    const el = document.createElement('div');
    el.className = 'tab' + (t.id === S.active ? ' active' : '') + (t.kind === 'file' && S.dirty.has(t.path) ? ' dirty' : '');
    const icon = t.kind === 'file' ? chipHTML(t.name) : `<span class="tab-ico">${t.kind === 'welcome' ? '✦' : '⚙'}</span>`;
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
}
async function saveAll() { for (const p of [...S.dirty]) await saveFile(p); }

function flashStatus(text, ms = 2400) {
  const el = $('#sb-build');
  const prev = el.textContent;
  el.textContent = text;
  clearTimeout(el._t);
  el._t = setTimeout(() => { if (!S.building) el.textContent = prev.startsWith('✦') ? prev : '✦ ready'; }, ms);
}

/* ═══════════════ CONNECT ═══════════════ */
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
}

let connecting = null;
async function connect({ quiet } = {}) {
  if (connecting) return connecting;
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
      } else {
        reportConnectFailure(c.error, quiet);
      }
      return c.connected;
    } catch (err) {
      applyConnection({ connected: false, error: err.message });
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
  if (!S.connection.connected) {
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
  TERM.cmd(`run ${entry} --${S.settings.format}${opts.fresh ? ' --fresh' : ''}`);

  try {
    const res = await fetch('/api/render', jsonBody({
      entry,
      format: S.settings.format,
      model: S.settings.model,
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
    case 'tool': TERM.line('t-tool', `✎ ${esc(m.name)}${m.file ? ' → ' + esc(m.file) : ''}`); break;
    case 'summary':
      // the streamed deltas were a live preview of this same message — replace, don't duplicate
      if (TERM.para) { TERM.para.remove(); TERM.closeStream(); }
      if (m.text) TERM.line('t-summary', esc(m.text.trim()));
      break;
    case 'done': {
      const cost = m.costUsd == null ? '' : m.costUsd < 0.005 ? ' · <1¢' : ` · ~$${m.costUsd.toFixed(3)}`;
      TERM.line('t-ok', `✓ imagination compiled in ${m.seconds}s${cost}`);
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
        applyConnection({ connected: false, error: m.message });
        loginHelp();
        toast('err', 'One-time setup needed', 'Claude Code isn\'t logged in — steps are in the Imagine Terminal below.', 16000);
      } else {
        toast('err', 'Build failed', m.message);
      }
      break;
  }
}

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

/* ═══════════════ SETTINGS PAGE ═══════════════ */
const MODEL_META = {
  'claude-sonnet-5': { badge: 'default · medium reasoning', desc: 'balanced + quick — the imagination workhorse' },
  'claude-opus-4-8': { badge: 'low reasoning', desc: 'deepest interpretation, for intricate dreams' },
  'claude-haiku-4-5': { badge: 'fast', desc: 'instant sketches, lightest touch' },
};
function buildSettingsPage() {
  $$('input[name="fmt"]').forEach((r) => {
    r.checked = r.value === S.settings.format;
    r.onchange = () => { S.settings.format = r.value; saveSettings(); };
  });
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
function updateStatusChips() {
  $('#sb-format').innerHTML = S.settings.format === 'react' ? '⚛ React' : '&lt;/&gt; HTML';
  const label = S.catalog[S.settings.model]?.label || S.settings.model.replace('claude-', '');
  const eff = S.settings.model === 'claude-sonnet-5' ? ' · medium' : S.settings.model === 'claude-opus-4-8' ? ' · low' : '';
  $('#sb-model').textContent = `✦ ${label}${eff}`;
  const entryEl = $('#sb-entry');
  if (entryEl) entryEl.textContent = `▶ entry: ${S.settings.entry ? S.settings.entry.split('/').pop() : 'choose…'}`;
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
  { id: 'connect', label: 'Imagine: Connect Claude Code', ico: '⚡', run: () => connect() },
  { id: 'newfile', label: 'File: New Imagination File', ico: '✦', run: () => newFileFlow() },
  { id: 'newfolder', label: 'File: New Folder', ico: '▸', run: () => newFolderFlow() },
  { id: 'save', label: 'File: Save', keys: 'Ctrl+S', ico: '✓', run: () => saveActive() },
  { id: 'saveall', label: 'File: Save All', ico: '✓', run: () => saveAll().then(() => flashStatus('✦ all saved')) },
  { id: 'fmt-html', label: 'Settings: Output Format → HTML', ico: '‹/›', run: () => { S.settings.format = 'html'; saveSettings(); buildSettingsPage(); } },
  { id: 'fmt-react', label: 'Settings: Output Format → React', ico: '⚛', run: () => { S.settings.format = 'react'; saveSettings(); buildSettingsPage(); } },
  { id: 'settings', label: 'View: Open Settings', ico: '⚙', run: () => openSpecial('settings') },
  { id: 'welcome', label: 'View: Welcome', ico: '✦', run: () => openSpecial('welcome') },
  { id: 'panel', label: 'View: Toggle Imagine Terminal', keys: 'Ctrl+`', ico: '❯', run: () => togglePanel() },
  { id: 'preview', label: 'View: Toggle Preview', ico: '◫', run: () => togglePreview() },
  { id: 'sidebar', label: 'View: Toggle Sidebar', keys: 'Ctrl+B', ico: '◧', run: () => $('#sidebar').classList.toggle('collapsed') },
  { id: 'browser', label: 'Preview: Open in Browser', ico: '↗', run: () => window.open('/preview/', '_blank') },
  { id: 'clearterm', label: 'Terminal: Clear', ico: '⌀', run: () => TERM.clear() },
  { id: 'search', label: 'Search: Find in Imagination', ico: '🔍', run: () => switchSideView('search') },
];

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
    items = COMMANDS.filter((c) => c.label.toLowerCase().includes(needle))
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
    { label: 'Open Preview in Browser', run: () => window.open('/preview/', '_blank') },
    { label: 'Connect Claude Code', run: () => connect() },
  ],
  help: [
    { label: 'Welcome', run: () => openSpecial('welcome') },
    { label: 'About ImagineCode', run: () => toast('info', 'ImagineCode v1.0', 'The IDE for programming languages that don\'t exist yet. Imagination in, websites out — compiled by Claude Code. ✦') },
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

/* ═══════════════ CHROME BINDING ═══════════════ */
function bindChrome() {
  // icons
  $('.ab-item[data-view="explorer"]').innerHTML = I.files;
  $('.ab-item[data-view="search"]').innerHTML = I.search;
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
  $('#w-new').onclick = newFileFlow;
  $('#w-run').onclick = () => run();

  // status bar
  $('#sb-claude').onclick = () => connect();
  $('#sb-format').onclick = () => openSpecial('settings');
  $('#sb-model').onclick = () => openSpecial('settings');
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
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); openPalette('>'); return; }
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

  window.addEventListener('beforeunload', (e) => {
    if (S.dirty.size) { e.preventDefault(); e.returnValue = ''; }
  });

  bindSearch();
  bindResizers();
}

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
