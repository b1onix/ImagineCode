# ✦ ImagineCode

**The IDE for programming languages that don't exist yet.**

You invent a programming language — any syntax, any file extension, any rules you can dream up.
When you press **▶ Run**, Claude Code reads your imagination like a compiler reads source code and
builds a **real, working website** from it, served live in the built-in preview.

> *"there are no syntax errors in imagination." — the compiler*

## How it works

```
 you                          ImagineCode                       Claude Code
──────         ─────────────────────────────────────────      ─────────────
 write   ───▶   VS Code-style IDE (Monaco, explorer,     ───▶  reads your invented
 .dream         tabs, imagine terminal, live preview)          language, interprets
 files                                                         intent, writes real
                       ◀── streams build log live ──◀          HTML or React
                       ◀──── serves /preview/ ─────◀
```

## Requirements

- **Node.js 18+**
- **Claude Code** installed and configured. ImagineCode reuses your existing Claude Code setup — any of these work:
  - a normal login (`claude` in a terminal → `/login`),
  - an `ANTHROPIC_API_KEY` environment variable,
  - **a third-party provider configured in `~/.claude/settings.json`** — the `env` block
    (`ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY`) is loaded automatically, exactly like the real CLI does.

  The **⚡ Connect Claude Code** button verifies whichever one you use with a real round-trip.
- Internet access (Monaco editor + React CDN are loaded from jsDelivr).

## Run it

```bash
npm install
npm start
```

Open **http://localhost:3333** — the IDE loads with two example imaginations:

- `bean-there.imagine` — a cozy coffee shop, written in prose-style imagination
- `synthwave.dreamjs` — an invented curly-brace language for a neon playlist site

Click **⚡ Connect Claude Code** (status bar turns from purple to VS Code blue), open an example,
press **▶ Run** (or `Ctrl+Enter` / `F5`), and watch the Imagine Terminal stream the compiler's
thoughts until your site appears in the preview pane.

## Settings (gear icon or status-bar chips)

| Setting | Options |
|---|---|
| **Output format** | `HTML` (one self-contained page, default) or `React` (function components + hooks via CDN, no build step) |
| **Compiler model** | `Sonnet 5 · medium reasoning` (default) · `Opus 4.8 · low reasoning` · `Haiku 4.5 · fast` |
| **Standing build notes** | Instructions whispered to the compiler on every build ("always dark mode", "everything slightly magical") |

## Keyboard

| Keys | Action |
|---|---|
| `Ctrl+Enter` / `F5` | Run imagination |
| `Shift+F5` | Stop build |
| `Ctrl+S` | Save |
| `Ctrl+Shift+P` / `F1` | Command palette |
| `Ctrl+P` | Quick-open file |
| `` Ctrl+` `` | Toggle Imagine Terminal |
| `Ctrl+B` | Toggle sidebar |

## Project layout

```
server.js          Express + Claude Agent SDK "compiler" backend
public/            the IDE (Monaco, VS Code Dark+ chrome)
workspace/         your imagination files (any extension you invent)
output/            the compiled website, served at /preview/
```
