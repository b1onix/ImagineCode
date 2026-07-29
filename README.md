# ✦ ImagineCode

**The IDE for programming languages that don't exist yet.**

You invent a programming language — any syntax, any file extension, any rules you can dream up.
<<<<<<< HEAD
When you press **▶ Run**, Claude Code reads your imagination like a compiler reads source code and
builds a **real, working website** from it, served live in the built-in preview.
=======
When you press **▶ Run**, a language model reads your imagination like a compiler reads source code
and builds a **real, working website** from it, served live in the built-in preview.

Bring **Claude Code** (the login you already have) or your own **Anthropic**, **OpenAI** or
**DeepSeek** API key — whichever you pick does the compiling.
>>>>>>> df90e14 (Changes)

> *"there are no syntax errors in imagination." — the compiler*

## How it works

```
<<<<<<< HEAD
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
=======
 you                          ImagineCode                       the compiler
──────         ─────────────────────────────────────────      ─────────────
 write   ───▶   VS Code-style IDE (Monaco, explorer,     ───▶  Claude Code, or your
 .dream         tabs, imagine terminal, live preview)          own Anthropic / OpenAI
 files                                                         / DeepSeek API key —
   +                   ◀── streams build log live ──◀          writes real HTML or React
 rules                 ◀──── serves /preview/ ─────◀
```

Tell it what your syntax *means* in **[Language Rules](#language-rules--teach-the-compiler-your-syntax)**
and it stops guessing — your definitions are sent ahead of your source on every build.

## Get it

**Windows — the app.** Download `ImagineCode-Setup-1.0.0.exe` and run it. It installs per-user (no
administrator prompt), puts ImagineCode on your Start menu and desktop, and needs nothing else installed —
not even Node. First launch plays a short introduction; you can replay it any time from **Help → Show
Introduction**.

**Anywhere — the browser version.** `npm install && npm run web`, then open http://localhost:3333.

## Requirements

- **Node.js 18+** — only for the browser version and for building the app yourself. The installer bundles
  its own runtime.
- **One compiler provider.** Pick whichever you already have — you need exactly one:

  | Provider | What it needs | How it compiles |
  |---|---|---|
  | **Claude Code** | Your existing Claude Code setup — no key to paste | Agentic: reads and edits `output/` directly, so rebuilds are surgical |
  | **Anthropic API** | An `sk-ant-…` key | One streamed pass that returns the whole page |
  | **OpenAI API** | An `sk-…` key | One streamed pass (Chat Completions) |
  | **DeepSeek API** | An `sk-…` key | One streamed pass (OpenAI-compatible endpoint) |

  For Claude Code, any of these count as "configured":
>>>>>>> df90e14 (Changes)
  - a normal login (`claude` in a terminal → `/login`),
  - an `ANTHROPIC_API_KEY` environment variable,
  - **a third-party provider configured in `~/.claude/settings.json`** — the `env` block
    (`ANTHROPIC_BASE_URL` + `ANTHROPIC_API_KEY`) is loaded automatically, exactly like the real CLI does.

<<<<<<< HEAD
  The **⚡ Connect Claude Code** button verifies whichever one you use with a real round-trip.
- Internet access (Monaco editor + React CDN are loaded from jsDelivr).

## Run it

```bash
npm install
npm start
```

Open **http://localhost:3333** — the IDE loads with two example imaginations:
=======
  The **⚡ Connect** button in the status bar verifies whichever provider is selected with a real round-trip.
- Internet access (Monaco editor + React CDN are loaded from jsDelivr).

## Run it from source

```bash
npm install
npm start        # the desktop app
npm run web      # the same IDE in your browser, on http://localhost:3333
```

Either way the IDE loads with two example imaginations:
>>>>>>> df90e14 (Changes)

- `bean-there.imagine` — a cozy coffee shop, written in prose-style imagination
- `synthwave.dreamjs` — an invented curly-brace language for a neon playlist site

<<<<<<< HEAD
Click **⚡ Connect Claude Code** (status bar turns from purple to VS Code blue), open an example,
press **▶ Run** (or `Ctrl+Enter` / `F5`), and watch the Imagine Terminal stream the compiler's
thoughts until your site appears in the preview pane.
=======
Click **⚡ Connect Claude Code** (status bar turns from purple to VS Code blue) — or **🔑 Use your own
API key instead…** to paste an Anthropic, OpenAI or DeepSeek key. Then open an example, press **▶ Run**
(or `Ctrl+Enter` / `F5`), and watch the Imagine Terminal stream the compiler's thoughts until your site
appears in the preview pane.

## Bring your own key

Open **Settings → Compiler Provider** (gear icon in the activity bar, or the provider chip at the far
right of the status bar), pick a provider, paste the key, press **Save**. The card shows a masked
version of what's stored, plus **Replace**, **Remove**, and **↻ models** to pull the live model list
from your account.

Keys are held **server-side only** — never in `localStorage`, never in the page:

```
.imaginecode-keys.json     file mode 0600 · already in .gitignore

  desktop app   %APPDATA%\ImagineCode\.imaginecode-keys.json
  from source   next to server.js
```

If you'd rather not store anything on disk, set an environment variable instead and ImagineCode picks
it up automatically:

| Provider | Environment variable |
|---|---|
| Anthropic API | `ANTHROPIC_API_KEY` |
| OpenAI API | `OPENAI_API_KEY` |
| DeepSeek API | `DEEPSEEK_API_KEY` |

Direct-API builds report the tokens they used in the Imagine Terminal, plus an estimated cost where
the price is known (Anthropic and DeepSeek).

## Language Rules — teach the compiler your syntax

**The recommended step, and the one that changes the output most.** You invented the language, so
only you know that `~>` means "fades in over two seconds" rather than "flows into". Write that down
once and the compiler follows your definitions instead of guessing at them.

Open it with `Ctrl+Shift+L`, the **§** icon in the activity bar, the `§ rules:` chip in the status
bar, or **File → Language Rules…**. A spec has four parts, all optional:

| Part | What it's for |
|---|---|
| **Language name** | What you call it. Makes the spec read like a spec. |
| **How your language works** | Prose: what indentation does, how structure is expressed, what a program describes. |
| **Syntax glossary** | The heart of it — one row per construct: `x ~> y` → *x fades into y over two seconds*. Each row toggles on and off. |
| **Worked examples** | A snippet of your language plus what it must compile to. The compiler treats each as a test case to match. |

The spec is sent **ahead of your source** on every build, and it outranks the compiler's own reading
heuristics — but not the fidelity law: it defines what your constructs *mean*, it never adds anything
to the page that your source didn't write. Edit a rule and the next build is an incremental pass that
re-checks the existing site against the new meaning, even if no source file changed.

Two shortcuts if you're staring at an empty page:

- **Templates** — three starting shapes (sentences, curly braces, invented verbs) that fill the fields for you to edit.
- **✦ Propose rules from my files** — the compiler reads your workspace and proposes a glossary. Nothing is saved until you accept it, and you can merge it with what you already wrote or replace it.

The panel on the right shows the exact text your spec adds to every build prompt, rendered by the
same code that builds the prompt — so there is nothing hidden. The master switch turns the whole
spec off without deleting it.

```
.imaginecode-rules.json    your language spec · gitignored

  desktop app   %APPDATA%\ImagineCode\.imaginecode-rules.json
  from source   next to server.js
```
>>>>>>> df90e14 (Changes)

## Settings (gear icon or status-bar chips)

| Setting | Options |
|---|---|
<<<<<<< HEAD
| **Output format** | `HTML` (one self-contained page, default) or `React` (function components + hooks via CDN, no build step) |
| **Compiler model** | `Sonnet 5 · medium reasoning` (default) · `Opus 4.8 · low reasoning` · `Haiku 4.5 · fast` |
| **Standing build notes** | Instructions whispered to the compiler on every build ("always dark mode", "everything slightly magical") |
=======
| **Entry file** | The program the compiler starts from; every other file is a module |
| **Output format** | `HTML` (one self-contained page, default) or `React` (function components + hooks via CDN, no build step) |
| **Language rules** | Your syntax → meaning spec (above). Lives on its own page — `Ctrl+Shift+L` |
| **Compiler provider** | `Claude Code` (default) · `Anthropic API` · `OpenAI API` · `DeepSeek API` |
| **Compiler model** | Depends on the provider — each remembers its own pick:<br>· **Claude Code** — `Sonnet 5 · medium` · `Opus 4.8 · low` · `Haiku 4.5 · fast`<br>· **Anthropic** — `Opus 5` · `Sonnet 5` · `Fable 5` · `Opus 4.8` · `Opus 4.6` · `Sonnet 4.6` · `Haiku 4.5`<br>· **OpenAI** — `GPT-5.6 Terra` · `GPT-5.6 Sol` · `GPT-5.6 Luna`<br>· **DeepSeek** — `DeepSeek V4 Pro` · `DeepSeek V4 Flash` |
| **Standing build notes** | Instructions whispered to the compiler on every build ("always dark mode", "everything slightly magical"). Taste, not meaning — for what your *syntax* means, use Language Rules |

The model lists above are a floor, not a ceiling — once a key is saved, **↻ models** merges your
account's own `/v1/models` response on top, so anything released after this README still shows up.
>>>>>>> df90e14 (Changes)

## Keyboard

| Keys | Action |
|---|---|
| `Ctrl+Enter` / `F5` | Run imagination |
| `Shift+F5` | Stop build |
<<<<<<< HEAD
=======
| `Ctrl+Shift+L` | Language rules |
>>>>>>> df90e14 (Changes)
| `Ctrl+S` | Save |
| `Ctrl+Shift+P` / `F1` | Command palette |
| `Ctrl+P` | Quick-open file |
| `` Ctrl+` `` | Toggle Imagine Terminal |
| `Ctrl+B` | Toggle sidebar |

<<<<<<< HEAD
## Project layout

```
server.js          Express + Claude Agent SDK "compiler" backend
public/            the IDE (Monaco, VS Code Dark+ chrome)
workspace/         your imagination files (any extension you invent)
output/            the compiled website, served at /preview/
=======
## Building the Windows app yourself

```bash
npm install
npm run icons     # rasterise build/icon.svg → build/icon.ico + icon.png (uses Electron, no native deps)
npm run dist      # → dist/ImagineCode-Setup-<version>.exe   (~156 MB)
npm run pack      # unpacked build only, for quick testing → dist/win-unpacked/
```

The installer is fat because it carries three self-contained things: Electron (~180 MB), the Claude Agent
SDK's native `claude.exe` (~260 MB, so the Claude Code provider works with **no CLI installed**), and Monaco
(~14 MB, so the editor works **offline**). To trade the first of those away, delete
`node_modules/@anthropic-ai/claude-agent-sdk-win32-x64` before `npm run dist` — the app still builds and
still compiles through any API key, it just can't drive a local Claude Code.

`asar` is deliberately off: the native CLI has to be spawned from disk, `server.js` is loaded as ESM in a
forked process, and the seed workspace is copied with `fs.cp` — all three are simpler as plain files.

## Where the desktop app keeps things

The installed program directory is read-only, so everything you create lives under
`%APPDATA%\ImagineCode\`:

```
workspace\                 your imagination files
output\                    the compiled website, served at /preview/
.imaginecode-keys.json     your saved API keys (mode 0600)
.imaginecode-rules.json    your language spec — the rules of the syntax you invented
.imaginecode-prefs.json    small local prefs — e.g. whether you've seen the introduction
window-state.json          window size, position and maximised state
```

Uninstalling leaves that folder alone, so reinstalling finds your work where you left it. Delete it by hand
if you want a truly clean slate — removing `.imaginecode-prefs.json` alone replays the introduction.

## Project layout

```
electron/                 the desktop shell — main process, preload bridges, animated splash
  main.cjs                forks server.js, holds the splash up, opens the frameless window
  splash.html             the boot screen (its progress bar reports real stages, not a timer)
public/                   the IDE (Monaco, VS Code Dark+ chrome)
  onboarding.js/.css      the seven-slide introduction shown on first run
server.js                 Express "compiler" backend — Claude Agent SDK + direct Anthropic/OpenAI/DeepSeek
build/icon.svg            the app mark; icon-small.svg is the ≤48px variant
scripts/make-icons.cjs    renders both SVGs with Chromium and packs build/icon.ico
resources/seed-workspace/ the two examples a fresh install starts with
workspace/ · output/      your files and your builds (from source; see above for the app)
>>>>>>> df90e14 (Changes)
```
