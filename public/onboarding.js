/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — the introduction
   ───────────────────────────────────────────────────────────────────
   A seven-slide carousel shown once on a fresh install, and any time
   afterwards from Help → Show Introduction. Arrow keys, the dots, the
   buttons and a drag of the mouse all move it.

   "Have you seen this?" is stored server-side rather than in
   localStorage: the desktop app can come up on a different port than
   last time, and a new origin would quietly forget.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

const ONBOARDING = (() => {
  const SPARK = 'M100 46 Q106 91.6 138 100 Q106 108.4 100 154 Q94 108.4 62 100 Q94 91.6 100 46 Z';

  /* ── the slides ──────────────────────────────────────────────────── */

  const SLIDES = [
    {
      kicker: 'the premise',
      title: 'There are no syntax&nbsp;errors in <em>imagination</em>.',
      body: [
        'ImagineCode is an IDE for programming languages that <strong>don\'t exist yet</strong>. You invent the language — any syntax, any rules, any file extension you feel like typing.',
        'When you press Run, a language model reads your invention the way a compiler reads source code, and builds a real, working website out of it.',
      ],
      note: 'Nothing you write here can be wrong. That is the entire point.',
      art: () => `
        <div class="sc-spark">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="introSpark" x1="0.24" y1="0" x2="0.78" y2="1">
                <stop offset="0" stop-color="#f6ffdd"/><stop offset="0.32" stop-color="#dcff77"/>
                <stop offset="0.7" stop-color="#c6f24e"/><stop offset="1" stop-color="#9bd016"/>
              </linearGradient>
            </defs>
            <circle class="ring r1" cx="100" cy="100" r="88"/>
            <circle class="ring r2" cx="100" cy="100" r="70"/>
            <path class="halo" d="${SPARK}"/>
            <path class="star" d="${SPARK}"/>
          </svg>
          <div class="sc-pulse"></div>
        </div>
        ${dust([[14, 22], [82, 18], [88, 70], [10, 74], [50, 6], [66, 90], [30, 88]])}`,
    },
    {
      kicker: 'write',
      title: 'Invent a language. Any language.',
      body: [
        'Make a new file and call it whatever you like — <code>app.dream</code>, <code>site.magic</code>, <code>me.pizza</code>. The extension is yours to invent too.',
        'Indentation means structure. "Quoted text" means words on the screen. Arrows mean things happening. If it reads like it means something, it compiles like it means something.',
      ],
      note: 'The editor never underlines anything in red. It cannot.',
      art: () => `
        <div class="sc-win">
          <div class="sc-win-bar">
            <span class="sc-chip"></span>
            <span class="sc-name">
              <span>bean-there.imagine</span><span>synthwave.dreamjs</span><span>me.pizza</span>
            </span>
          </div>
          <div class="sc-code">
            <div class="ln"><span class="sc-c"># a language of sentences</span></div>
            <div class="ln"><span class="sc-k">imagine</span> <span class="sc-p">a page</span> {</div>
            <div class="ln">&nbsp;&nbsp;<span class="sc-p">title</span> = <span class="sc-s">"we open at six."</span></div>
            <div class="ln">&nbsp;&nbsp;[ <span class="sc-s">see the menu</span> ] <span class="sc-a">-&gt;</span> glide down</div>
            <div class="ln">&nbsp;&nbsp;<span class="sc-p">mood</span> = warm, unhurried<span class="sc-caret"></span></div>
          </div>
        </div>`,
    },
    {
      kicker: 'define',
      title: 'Then tell it what your syntax <em>means</em>.',
      body: [
        'This is the recommended step, and the one that changes the most. In <strong>Language Rules</strong> you write your own glossary — <code>~&gt;</code> means this, <code>bloom { }</code> means that — and the compiler follows your definitions instead of guessing at them.',
        'It reads your spec before it reads a line of your source, and your meaning outranks whatever it would have assumed. Add a worked example or two and it treats them as test cases it has to match.',
      ],
      note: 'Optional, technically. But this is what turns a guess into a compiler.',
      cta: 'Open Language Rules ✦',
      ctaAct: 'rules',
      art: () => `
        <div class="sc-spec">
          <div class="sc-spec-head"><span class="sc-spec-mark">§</span><span>your language, defined</span></div>
          <div class="sc-spec-rows">
            <div class="sc-spec-row"><code>x ~&gt; y</code><i>→</i><em>x fades into y over 2s</em></div>
            <div class="sc-spec-row"><code>bloom { }</code><i>→</i><em>a card that lifts on hover</em></div>
            <div class="sc-spec-row"><code>whisper "…"</code><i>→</i><em>small, quiet, low-contrast text</em></div>
            <div class="sc-spec-row"><code>vibe = …</code><i>→</i><em>design direction, never on screen</em></div>
          </div>
          <div class="sc-spec-foot"><span class="sc-spec-dot"></span>read before every build</div>
        </div>`,
    },
    {
      kicker: 'compile',
      title: 'Press Run and watch it think.',
      body: [
        '<strong>Ctrl</strong>+<strong>Enter</strong>, or the green Run button. The Imagine Terminal at the bottom streams the compiler\'s reasoning live as it reads your file and decides what you meant.',
        'Run it again after an edit and the build is <strong>incremental</strong> — only what changed in your source gets changed in the site.',
      ],
      note: 'A first build takes a moment. It is reading, not fetching.',
      art: () => `
        <div class="sc-pipe">
          <div class="sc-flow">
            <div class="sc-src"><i></i><i></i><i></i><i></i></div>
            <div class="sc-core"><span>✦</span></div>
            <div class="sc-out"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="sc-term">
            <div>imagine ✦ run bean-there.imagine --html</div>
            <div>◆ reading imagination… 1 file, 48 lines</div>
            <div>✎ Write → index.html</div>
            <div>✓ imagination compiled in 21.4s</div>
          </div>
        </div>`,
    },
    {
      kicker: 'exists',
      title: 'And then it simply exists.',
      body: [
        'The finished site opens in the preview panel beside your code, served live from the app itself. Open it in a real browser any time from <strong>Run → Open Preview in Browser</strong>.',
        'Choose plain <strong>HTML</strong> for one self-contained page, or <strong>React</strong> for real components with hooks — the setting is in Settings → Output Format.',
      ],
      note: 'Your imagination now has a URL.',
      art: () => `
        <div class="sc-win">
          <div class="sc-win-bar">
            <span class="sc-chip sc-live"></span>
            <span class="sc-url">localhost/preview/</span>
          </div>
          <div class="sc-page">
            <div class="hd"></div>
            <div class="hero"></div>
            <div class="row"><i></i><i></i><i></i></div>
            <div class="ft"></div>
          </div>
        </div>`,
    },
    {
      kicker: 'the compiler',
      title: 'Bring whichever brain you already have.',
      body: [
        'ImagineCode needs exactly one compiler provider. <strong>Claude Code</strong> uses the login already on this machine — nothing to paste, and it edits builds surgically.',
        'Or paste your own <strong>Anthropic</strong>, <strong>OpenAI</strong> or <strong>DeepSeek</strong> key in Settings → Compiler Provider. Keys are stored on this computer only, never in the page.',
      ],
      note: 'The ⚡ chip in the status bar tells you where you stand.',
      art: () => `
        <div class="sc-provs">
          <div class="sc-prov"><span class="dot"></span>Claude Code<span class="tail">no key needed</span></div>
          <div class="sc-prov"><span class="dot"></span>Anthropic API<span class="tail">sk-ant-…</span></div>
          <div class="sc-prov"><span class="dot"></span>OpenAI API<span class="tail">sk-…</span></div>
          <div class="sc-prov"><span class="dot"></span>DeepSeek API<span class="tail">sk-…</span></div>
        </div>`,
    },
    {
      kicker: 'go',
      title: 'That\'s everything. Go imagine.',
      body: [
        'Two example imaginations are already waiting in the explorer. Open one, press Run, and change a line to see what happens.',
        'And when you invent syntax of your own, write it down in <strong>Language Rules</strong> — the compiler will follow you instead of guessing.',
      ],
      note: '“there are no syntax errors in imagination.” — the compiler',
      cta: 'Start imagining ✦',
      art: () => `
        <div class="sc-keys">
          ${key(['Ctrl', 'Enter'], 'run imagination')}
          ${key(['Shift', 'F5'], 'stop the build')}
          ${key(['Ctrl', 'P'], 'open a file')}
          ${key(['Ctrl', 'Shift', 'L'], 'language rules')}
          ${key(['Ctrl', 'Shift', 'P'], 'all commands')}
          ${key(['Ctrl', '`'], 'imagine terminal')}
        </div>`,
    },
  ];

  const key = (caps, what) =>
    `<div class="sc-key"><div class="caps">${caps
      .map((c) => `<kbd>${c}</kbd>`)
      .join('<span class="plus">+</span>')}</div><div class="what">${what}</div></div>`;

  const dust = (spots) =>
    spots
      .map(([x, y], i) => `<span class="sc-dust" style="left:${x}%;top:${y}%;animation-delay:${(i * 0.47).toFixed(2)}s"></span>`)
      .join('');

  /* ── state ───────────────────────────────────────────────────────── */

  let root = null;
  let track = null;
  let index = 0;
  let built = false;

  function build() {
    if (built) return;
    built = true;

    root = document.createElement('div');
    root.id = 'intro';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'ImagineCode introduction');
    root.innerHTML = `
      <div class="intro-veil"></div>
      <div class="intro-shell">
        <div class="intro-rail"><i></i></div>
        <div class="intro-viewport">
          <div class="intro-track">
            ${SLIDES.map((s, i) => `
              <section class="intro-slide" data-i="${i}">
                <div class="slide-art">${s.art()}</div>
                <div class="slide-copy">
                  <div class="slide-kicker"><b>${String(i + 1).padStart(2, '0')}</b> ${s.kicker}</div>
                  <h2>${s.title}</h2>
                  ${s.body.map((p) => `<p>${p}</p>`).join('')}
                  <div class="slide-note">${s.note}</div>
                  ${s.cta ? `<button class="slide-cta${s.ctaAct ? ' mid' : ''}" data-act="${s.ctaAct ? 'go-' + s.ctaAct : 'finish'}">${s.cta}</button>` : ''}
                </div>
              </section>`).join('')}
          </div>
        </div>
        <div class="intro-nav">
          <div class="intro-dots">
            ${SLIDES.map((s, i) => `<button class="intro-dot" data-go="${i}" aria-label="Slide ${i + 1}: ${s.kicker}"></button>`).join('')}
          </div>
          <span class="intro-count"></span>
          <span class="intro-spacer"></span>
          <button class="intro-btn ghost" data-act="skip">Skip</button>
          <button class="intro-btn" data-act="prev">Back</button>
          <button class="intro-btn primary" data-act="next">Next</button>
        </div>
      </div>`;
    document.body.appendChild(root);
    track = root.querySelector('.intro-track');

    root.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => go(Number(b.dataset.go))));
    root.querySelector('[data-act="prev"]').onclick = () => go(index - 1);
    root.querySelector('[data-act="next"]').onclick = () => (index === SLIDES.length - 1 ? finish() : go(index + 1));
    root.querySelectorAll('[data-act="skip"], [data-act="finish"]').forEach((b) => {
      b.onclick = () => (b.dataset.act === 'finish' ? finish() : finish({ skipped: true }));
    });
    // A call to action inside a slide is a shortcut out of the tour, not a way
    // to skip it: the introduction counts as seen, then the IDE lands where the
    // button promised. Anything else and the overlay would still be up, holding
    // the keyboard, over the page the user just asked for.
    root.querySelectorAll('[data-act^="go-"]').forEach((b) => {
      b.onclick = () => {
        const where = b.dataset.act.slice(3);
        finish();
        setTimeout(() => {
          if (where === 'rules') window.RULES?.open();
        }, 380);
      };
    });
    root.querySelector('.intro-veil').onclick = () => finish({ skipped: true });

    bindDrag();
  }

  /* ── movement ────────────────────────────────────────────────────── */

  function go(next) {
    index = Math.max(0, Math.min(SLIDES.length - 1, next));
    track.classList.remove('dragging');
    track.style.transform = `translateX(${-index * 100}%)`;
    paint();
  }

  function paint() {
    const last = index === SLIDES.length - 1;
    root.querySelectorAll('.intro-slide').forEach((s, i) => {
      const on = i === index;
      s.classList.toggle('is-active', on);
      // Off-screen slides must leave the tab order entirely. Otherwise Tab
      // reaches a button the user cannot see, and the browser scrolls the
      // overflow:hidden viewport to it — permanently knocking the carousel out
      // of alignment with its own transform.
      s.inert = !on;
      s.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    root.querySelector('.intro-viewport').scrollLeft = 0;
    root.querySelectorAll('.intro-dot').forEach((d, i) => d.classList.toggle('on', i === index));
    root.querySelector('.intro-rail i').style.width = `${((index + 1) / SLIDES.length) * 100}%`;
    root.querySelector('.intro-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(SLIDES.length).padStart(2, '0')}`;
    root.querySelector('[data-act="prev"]').disabled = index === 0;
    root.querySelector('[data-act="next"]').textContent = last ? 'Start imagining' : 'Next';
  }

  // pointer drag — the slides follow the cursor and snap on release
  function bindDrag() {
    let startX = 0;
    let dx = 0;
    let dragging = false;
    let width = 1;

    const down = (e) => {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest('button, a, kbd, .slide-copy')) return;
      dragging = true;
      dx = 0;
      startX = e.clientX;
      width = track.getBoundingClientRect().width || 1;
      track.classList.add('dragging');
      track.setPointerCapture?.(e.pointerId);
    };
    const move = (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      // resist dragging past either end
      if ((index === 0 && dx > 0) || (index === SLIDES.length - 1 && dx < 0)) dx *= 0.32;
      track.style.transform = `translateX(calc(${-index * 100}% + ${dx}px))`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const threshold = Math.min(120, width * 0.16);
      if (dx <= -threshold) go(index + 1);
      else if (dx >= threshold) go(index - 1);
      else go(index);
    };

    track.addEventListener('pointerdown', down);
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    track.addEventListener('dragstart', (e) => e.preventDefault());
  }

  function onKey(e) {
    if (!isOpen()) return;
    const k = e.key;
    // Enter on a focused control belongs to that control — hijacking it here
    // would make Skip and the dots unusable from the keyboard
    const onOwnButton = k === 'Enter' && document.activeElement?.closest?.('#intro button');
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); e.stopPropagation(); go(index + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); e.stopPropagation(); go(index - 1); }
    else if (k === 'Enter' && !onOwnButton) { e.preventDefault(); e.stopPropagation(); index === SLIDES.length - 1 ? finish() : go(index + 1); }
    else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); finish({ skipped: true }); }
  }

  /* ── open / close ────────────────────────────────────────────────── */

  const isOpen = () => !!root && root.classList.contains('open');

  let restoreFocusTo = null;

  // A real modal has to own the tab order, not just cover the screen. Marking
  // every sibling inert takes the whole IDE out of the tab sequence and out of
  // the accessibility tree for as long as the introduction is up — so Tab
  // cycles inside the dialog instead of wandering into the editor behind it.
  function sealBackground(sealed) {
    for (const el of document.body.children) {
      if (el === root) continue;
      el.inert = sealed;
    }
  }

  function open(at = 0) {
    build();
    if (!isOpen()) restoreFocusTo = document.activeElement;
    index = at;
    root.hidden = false;
    root.removeAttribute('aria-hidden');
    track.style.transition = 'none';
    go(index);
    void track.offsetWidth;
    track.style.transition = '';
    root.classList.remove('closing');
    sealBackground(true);
    // a frame's delay so the entrance transition has something to run from
    requestAnimationFrame(() => {
      root.classList.add('open');
      // pull focus in, or the keyboard is still driving the editor underneath
      root.querySelector('[data-act="next"]')?.focus({ preventScroll: true });
    });
    // capture phase, so the IDE's own Escape / arrow bindings stay out of it
    window.addEventListener('keydown', onKey, true);
  }

  function finish({ skipped = false } = {}) {
    if (!isOpen()) return;
    window.removeEventListener('keydown', onKey, true);
    sealBackground(false);
    root.classList.add('closing');
    root.classList.remove('open');
    // Taken out of the document entirely once the exit has played: left merely
    // transparent it would keep ten buttons in the tab order, keep an
    // aria-modal dialog exposed to screen readers, and keep a full-viewport
    // backdrop-filter compositing for the rest of the session.
    setTimeout(() => {
      if (!root || isOpen()) return;
      root.classList.remove('closing');
      root.hidden = true;
      root.setAttribute('aria-hidden', 'true');
    }, 420);

    try { restoreFocusTo?.focus?.({ preventScroll: true }); } catch {}
    restoreFocusTo = null;

    remember(skipped);
  }

  // If this never lands, the introduction replays on every launch — annoying
  // enough to be worth one retry and an honest note in the terminal.
  async function remember(skipped) {
    const body = JSON.stringify({ introSeen: true, introSeenAt: new Date().toISOString(), introSkipped: !!skipped });
    const put = () => fetch('/api/prefs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await put();
        if (res.ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    console.warn('ImagineCode: could not record that the introduction was seen — it will show again next launch.');
  }

  // first run only — and never at the cost of the IDE booting
  async function boot() {
    try {
      const res = await fetch('/api/prefs');
      if (!res.ok) return;
      const prefs = await res.json();
      if (prefs.introSeen) return;
      setTimeout(() => open(0), 420);
    } catch {}
  }

  return { boot, open, close: () => finish({ skipped: true }), isOpen };
})();
