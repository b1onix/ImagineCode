/* ═══════════════════════════════════════════════════════════════════
   ImagineCode — landing page behaviour
   Everything degrades: with JS off the page is still readable, and
   with prefers-reduced-motion every loop below is skipped.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const CALM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════ preloader ═══════════ */
  const boot     = $('#boot');
  const bootBar  = $('.boot-bar i');
  const bootTxt  = $('.boot-label');
  const stages   = ['warming the compiler', 'loading monaco', 'reading imagination', 'ready'];

  function finishBoot() {
    if (!boot || boot.classList.contains('gone')) return;
    boot.classList.add('gone');
    document.body.classList.remove('locked');
    setTimeout(startHero, 220);
  }

  if (boot) {
    document.body.classList.add('locked');

    if (CALM) {
      finishBoot();
    } else {
      let p = 0, i = 0;
      const tick = setInterval(() => {
        p = Math.min(100, p + 14 + Math.random() * 16);
        if (bootBar) bootBar.style.width = p + '%';
        const s = Math.min(stages.length - 1, Math.floor(p / 26));
        if (s !== i) { i = s; if (bootTxt) bootTxt.textContent = stages[s]; }
        if (p >= 100) { clearInterval(tick); setTimeout(finishBoot, 320); }
      }, 190);
      // never let the loader trap the page
      setTimeout(finishBoot, 4200);
    }
  }
  window.addEventListener('load', () => setTimeout(finishBoot, 900));


  /* ═══════════════════════════════════════════════════════════════
     platform
     Both builds stay in the DOM whatever this decides — detection only
     reorders them and moves the solid fill. Getting it wrong costs the
     visitor one glance, never a missing download.
     ═══════════════════════════════════════════════════════════════ */
  const PLATFORM = (navigator.userAgentData && navigator.userAgentData.platform) ||
                   navigator.platform || navigator.userAgent || '';
  const OS = /mac|iphone|ipad|ipod/i.test(PLATFORM) ? 'mac' : 'win';
  document.documentElement.setAttribute('data-os', OS);

  $$('.hero-actions [data-dl]').forEach(a => {
    const mine = a.getAttribute('data-dl') === OS;
    a.classList.toggle('btn-solid', mine);
    a.classList.toggle('btn-line', !mine);
    a.style.order = mine ? '-1' : '';
  });

  const navDl = $('[data-dl-auto]');
  if (navDl) {
    const href = navDl.getAttribute('data-href-' + OS);
    if (href) navDl.setAttribute('href', href);
    const name = $('.os-name', navDl);
    if (name) name.textContent = OS === 'mac' ? 'macOS' : 'Windows';
  }


  /* ═══════════ nav ═══════════ */
  const nav = $('#nav');
  const burger = $('#burger');

  function onScrollNav() {
    if (nav) nav.classList.toggle('stuck', window.scrollY > 24);
    const rail = $('.scroll-rail i');
    if (rail) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }


  /* ═══════════ pointer spotlight ═══════════ */
  if (!CALM && window.matchMedia('(pointer:fine)').matches) {
    let raf = 0, mx = 50, my = 40;
    window.addEventListener('pointermove', e => {
      mx = (e.clientX / window.innerWidth) * 100;
      my = (e.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(() => {
        document.body.style.setProperty('--mx', mx + '%');
        document.body.style.setProperty('--my', my + '%');
        raf = 0;
      });
      document.body.classList.add('pointer');
    }, { passive: true });
  }


  /* ═══════════ split headlines into words ═══════════ */
  $$('[data-split]').forEach(el => {
    const walk = node => {
      Array.prototype.slice.call(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.nodeValue.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('i');
            inner.textContent = tok;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    walk(el);
    // stagger each word
    $$('.w > i', el).forEach((i, n) => {
      i.style.transitionDelay = (n * 0.038) + 's';
    });
  });


  /* ═══════════ scroll reveal ═══════════ */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          io.unobserve(en.target);
          if (en.target.hasAttribute('data-count')) countUp(en.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    : null;

  const revealables = $$('.reveal, .split, [data-count]');
  if (io) revealables.forEach(el => io.observe(el));
  else revealables.forEach(el => el.classList.add('in'));


  /* ═══════════ counters ═══════════ */
  function countUp(el) {
    const suffix = el.getAttribute('data-suffix');
    if (suffix) { el.innerHTML = suffix; return; }
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (CALM || target === 0) { el.textContent = String(target); return; }
    const dur = 900;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }


  /* ═══════════ magnetic buttons ═══════════ */
  if (!CALM && window.matchMedia('(pointer:fine)').matches) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = 'translate(' + (x * 9).toFixed(2) + 'px,' + (y * 7).toFixed(2) + 'px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // card hover glow follows the cursor
    $$('.card').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--cx', ((e.clientX - r.left) / r.width) * 100 + '%');
        c.style.setProperty('--cy', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }


  /* ═══════════ parallax ═══════════ */
  if (!CALM) {
    const layers = $$('[data-parallax]');
    if (layers.length) {
      let ticking = false;
      const run = () => {
        const vh = window.innerHeight;
        layers.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const k = parseFloat(el.getAttribute('data-parallax')) || 0.05;
          const centre = r.top + r.height / 2 - vh / 2;
          el.style.transform = 'translate3d(0,' + (-centre * k).toFixed(2) + 'px,0)';
        });
        ticking = false;
      };
      window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(run); }
      }, { passive: true });
      run();
    }
  }


  /* ═══════════════════════════════════════════════════════════════
     the hero IDE — types synthwave.dreamjs, then streams a build
     ═══════════════════════════════════════════════════════════════ */

  // [indent, tokens] — token = [class, text]. `sw` renders a colour swatch.
  const SRC = [
    [['com', '// synthwave.dreamjs']],
    [['com', '// no compiler on earth accepts']],
    [['com', '// this. this one does.']],
    [],
    [['key', 'universe'], ['', ' '], ['name', 'SYNTHWAVE'], ['', ' '], ['pun', '{']],
    [['', '  '], ['word', 'vibe'], ['', '    '], ['op', '->'], ['', ' '], ['str', 'neon, night-drive, 1984']],
    [['', '  '], ['word', 'palette'], ['', ' '], ['op', '->'], ['', ' '],
      ['sw', '#05010f'], ['sw', '#ff2e97'], ['sw', '#00e5ff'], ['sw', '#ffe66d']],
    [['pun', '}']],
    [],
    [['key', 'scene'], ['', ' '], ['name', 'Sky'], ['', ' '], ['pun', '{']],
    [['', '  '], ['word', 'horizon'], ['', ' '], ['op', '='], ['', ' '], ['str', '1px of #ff2e97, glowing']],
    [['', '  '], ['word', 'grid'], ['', '    '], ['op', '->'], ['', ' '], ['str', 'scroll toward viewer']],
    [['', '  '], ['word', 'sun'], ['', '     '], ['op', '->'], ['', ' '], ['str', 'sliced, floating']],
    [['pun', '}']]
  ];

  const TERM = [
    { d: 260,  html: '<span class="t-mark">&#10022;</span><span class="t-txt">reading <span class="t-dim">synthwave.dreamjs</span> &middot; 1 file</span>' },
    { d: 900,  html: '<span class="t-mark">&#10022;</span><span class="t-txt">interpreting <span class="t-stage">universe</span> &middot; page shell</span>' },
    { d: 820,  html: '<span class="t-mark">&#10022;</span><span class="t-txt">interpreting <span class="t-stage">scene Sky</span> &middot; grid, sun, horizon</span>' },
    { d: 780,  html: '<span class="t-mark">&#10022;</span><span class="t-txt">interpreting <span class="t-stage">deck</span> &middot; 6 tracks</span>' },
    { d: 900,  html: '<span class="t-ok">&#10003;</span><span class="t-txt">built &middot; <span class="t-dim">214 lines &middot; 12.4s &middot; serving</span></span>' }
  ];

  const codeEl = $('#heroCode');
  const termEl = $('#heroTerm');
  const winEl  = $('#ideWindow');
  const pvEl   = $('#heroPv');

  function tokenHTML(t) {
    const cls = t[0], txt = t[1];
    if (cls === 'sw') return '<span class="sw-chip" style="color:' + txt + ';background:' + txt + '"></span>';
    if (!cls) return esc(txt);
    return '<span class="c-' + cls + '">' + esc(txt) + '</span>';
  }
  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function lineHTML(tokens) {
    return tokens.map(tokenHTML).join('') || ' ';
  }

  // instant render, used for reduced motion and as the end state
  function renderAll() {
    if (!codeEl) return;
    codeEl.innerHTML = SRC.map((tk, i) =>
      '<div class="ln' + (i === SRC.length - 2 ? ' cur' : '') + '">' +
        '<span class="n">' + (i + 1) + '</span>' +
        '<span class="t">' + lineHTML(tk) + '</span>' +
      '</div>'
    ).join('');
  }

  function renderTermAll() {
    if (!termEl) return;
    termEl.innerHTML = TERM.map(t => '<div class="tline" style="opacity:1;transform:none">' + t.html + '</div>').join('');
  }

  let heroStarted = false;

  function startHero() {
    if (heroStarted) return;
    heroStarted = true;

    if (winEl) winEl.classList.add('in');

    if (CALM || !codeEl) { renderAll(); renderTermAll(); return; }

    // ── type the source, token by token ──
    let li = 0, ti = 0;
    codeEl.innerHTML = '';

    const rows = SRC.map((tk, i) => {
      const row = document.createElement('div');
      row.className = 'ln';
      row.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="t"></span>';
      return row;
    });

    function typeStep() {
      if (li >= SRC.length) { setTimeout(runBuild, 520); return; }

      const tokens = SRC[li];
      const row = rows[li];
      if (!row.parentNode) {
        codeEl.appendChild(row);
        rows.forEach(r => r.classList.remove('cur'));
        row.classList.add('cur');
      }

      const target = $('.t', row);

      if (ti >= tokens.length) {
        target.innerHTML = lineHTML(tokens);
        li++; ti = 0;
        setTimeout(typeStep, tokens.length ? 62 : 26);
        return;
      }

      target.innerHTML = tokens.slice(0, ti + 1).map(tokenHTML).join('') +
                         '<span class="caret"></span>';
      ti++;
      setTimeout(typeStep, 34 + Math.random() * 46);
    }

    // ── then stream the build log ──
    function runBuild() {
      rows.forEach(r => r.classList.remove('cur'));
      rows[SRC.length - 2].classList.add('cur');
      const last = $('.t', rows[SRC.length - 2]);
      if (last) last.innerHTML = lineHTML(SRC[SRC.length - 2]) + '<span class="caret"></span>';

      if (pvEl) pvEl.style.opacity = '.28';

      let n = 0;
      (function next() {
        if (n >= TERM.length) {
          // settled: the build is done and the page stays in its finished
          // state. Ambient motion (grid, sun, scanline) carries it from here.
          if (pvEl) { pvEl.style.transition = 'opacity .8s ease'; pvEl.style.opacity = '1'; }
          return;
        }
        const item = TERM[n++];
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = 'tline';
          div.innerHTML = item.html;
          termEl.appendChild(div);
          while (termEl.children.length > 4) termEl.removeChild(termEl.firstChild);
          if (n === TERM.length && pvEl) {
            pvEl.style.transition = 'opacity .9s ease';
            pvEl.style.opacity = '1';
          }
          next();
        }, item.d);
      })();
    }

    termEl.innerHTML = '';
    if (pvEl) pvEl.style.opacity = '.28';
    setTimeout(typeStep, 260);
  }

  // if the loader never runs (e.g. cached + reduced motion), still boot the hero
  setTimeout(startHero, 5000);


  /* ═══════════ demo tabs ═══════════ */
  const META = {
    synth: { src: 'excerpt &middot; dreamjs', out: '12.4s' },
    bean:  { src: 'excerpt &middot; imagine', out: '9.8s' }
  };

  $$('.dtab').forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-tab');

      $$('.dtab').forEach(t => {
        const on = t === tab;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', String(on));
      });
      $$('.src').forEach(p => p.classList.toggle('on', p.getAttribute('data-pane') === key));
      $$('.out-pane').forEach(p => p.classList.toggle('on', p.getAttribute('data-pane') === key));

      const sm = $('#srcMeta'), om = $('#outMeta');
      if (sm && META[key]) sm.innerHTML = META[key].src;
      if (om && META[key]) om.innerHTML = META[key].out;
    });
  });


  /* ═══════════ copy buttons ═══════════ */
  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  $$('.copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy') || '';
      const label = $('span', btn);
      let ok = false;

      // the async API rejects when the document isn't focused — embedded
      // previews, background tabs, some in-app browsers. Its presence is not
      // a guarantee, so treat it as an attempt and fall through on failure.
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { ok = false; }
      }
      if (!ok) ok = legacyCopy(text);

      btn.classList.toggle('done', ok);
      if (label) label.textContent = ok ? 'copied' : 'press ctrl+c';

      setTimeout(() => {
        btn.classList.remove('done');
        if (label) label.textContent = 'copy';
      }, 1800);
    });
  });


  /* ═══════════ glossary toggles ═══════════ */
  function syncRuleCount() {
    const foot = $('.rp-foot .accent');
    if (foot) foot.textContent = $$('.gl-row .tg.on').length + ' active';
  }

  $$('.gl-row').forEach(row => {
    const tg = $('.tg', row);
    if (!tg) return;
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const on = tg.classList.toggle('on');
      row.classList.toggle('off', !on);
      syncRuleCount();
    });
  });
  syncRuleCount();   // the markup must never disagree with the toggles

  /* master switch */
  const master = $('.rp-switch');
  if (master) {
    master.style.cursor = 'pointer';
    master.addEventListener('click', () => {
      const on = master.classList.toggle('on');
      const gloss = $('.rp-glossary');
      if (gloss) { gloss.style.transition = 'opacity .4s ease'; gloss.style.opacity = on ? '1' : '.3'; }
    });
  }


  /* ═══════════ active nav link ═══════════ */
  const secs = $$('main section[id]');
  if (secs.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        $$('.nav-links a').forEach(a => {
          a.style.color = a.getAttribute('href') === '#' + id ? 'var(--bone)' : '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(s => spy.observe(s));
  }

})();
