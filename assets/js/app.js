/* Maths Brahmastra — Class X · site behaviour (no dependencies except KaTeX) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var SITE = window.MBX || { chapters: [] };
  var $ = function (s, el) { return (el || doc).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); };

  /* ---------- storage (safe) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };
  var KEY = 'mbx:v1:';

  /* ---------- theme ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  $$('.theme-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t);
      try { localStorage.setItem(KEY + 'theme', t); } catch (e) { }
    });
  });

  /* ---------- maths (KaTeX, rendered lazily) ---------- */
  var KOPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '\\(', right: '\\)', display: false }
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'svg'],
    ignoredClasses: ['mlazy'],
    throwOnError: false, strict: false,
    macros: { '\\dg': '^{\\circ}', '\\rs': '\\text{₹}' }
  };
  var LAZY = '.sol-body, .proof-body, .quick-body';
  function typeset(el) {
    if (!el || !window.renderMathInElement) return;
    $$(LAZY, el).forEach(function (b) {
      var d = b.closest('details');
      if (d && !d.open && !b.dataset.done) b.classList.add('mlazy');
    });
    try { window.renderMathInElement(el, KOPTS); } catch (e) { if (window.console) console.warn(e); }
    glue(el);
    figHints(el);
  }
  /* wide figures scroll sideways on phones — say so, but only when they really are cut off */
  function figHints(el) {
    $$('.fig-scroll', el).forEach(function (s) {
      if (!s.clientWidth) return;
      var f = s.closest('figure') || s.parentNode;
      f.classList.toggle('has-scroll', s.scrollWidth > s.clientWidth + 8);
    });
  }
  var fhT; window.addEventListener('resize', function () { clearTimeout(fhT); fhT = setTimeout(function () { figHints(doc); }, 200); });
  /* keep a comma / full stop that follows inline maths on the same line as the maths —
     without switching off KaTeX's own line-break points inside long formulas */
  function glue(el) {
    var narrow = window.innerWidth < 760, wide = [];
    $$('.katex', el).forEach(function (k) {
      if (k.parentNode.classList && k.parentNode.classList.contains('katex-display')) return;
      var n = k.nextSibling;
      if (n && n.nodeType === 3 && !k.dataset.glued) {
        var m = /^[,.;:!?)\]’”]+/.exec(n.nodeValue);
        if (m) {
          var bases = k.querySelectorAll('.katex-html > .base'), last = bases[bases.length - 1];
          if (last) {
            var g = doc.createElement('span'); g.className = 'mglue'; g.textContent = m[0];
            last.appendChild(g); n.nodeValue = n.nodeValue.slice(m[0].length); k.dataset.glued = '1';
          }
        }
      }
      if (narrow) wide.push(k);
    });
    /* phones: a formula that still cannot fit gets its own sideways scroll instead of stretching the page */
    wide.forEach(function (k) {
      var box = k.parentNode; while (box && getComputedStyle(box).display === 'inline') box = box.parentNode;
      if (box && k.getBoundingClientRect().width > box.clientWidth + 1) k.classList.add('katex-wide');
    });
  }
  function typesetLazy(body) {
    if (!body || body.dataset.done) return;
    body.classList.remove('mlazy');
    body.dataset.done = '1';
    typeset(body);
  }
  doc.addEventListener('toggle', function (ev) {
    var d = ev.target;
    if (d && d.tagName === 'DETAILS' && d.open) {
      $$(LAZY, d).forEach(function (b) { if (b.closest('details') === d) typesetLazy(b); });
      figHints(d);
    }
  }, true);

  /* ---------- tabs ---------- */
  var tabs = $$('.tab[data-panel]');
  var panels = $$('.panel');
  var rendered = {};
  function activate(id, opts) {
    opts = opts || {};
    var panel = doc.getElementById(id);
    if (!panel || !panel.classList.contains('panel')) return false;
    panels.forEach(function (p) { p.classList.toggle('active', p === panel); });
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-panel') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && t.scrollIntoView && opts.user) { try { t.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { } }
    });
    if (!rendered[id]) { rendered[id] = 1; typeset(panel); }
    if (opts.user) {
      try { history.replaceState(null, '', '#' + id); } catch (e) { }
      var bar = $('.tabs');
      if (bar) {
        var y = bar.getBoundingClientRect().top + window.pageYOffset - (parseInt(getComputedStyle(root).getPropertyValue('--topbar-h')) || 58);
        if (window.pageYOffset > y) window.scrollTo(0, y);
      }
    }
    doc.dispatchEvent(new CustomEvent('mbx:panel', { detail: id }));
    return true;
  }
  function goHash() {
    var id = decodeURIComponent((location.hash || '').slice(1));
    if (!id) return false;
    if (activate(id)) return true;
    var el = doc.getElementById(id);
    if (!el) return false;
    var p = el.closest('.panel');
    if (p) activate(p.id);
    var d = el.closest('details');
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details'); }
    setTimeout(function () { try { el.scrollIntoView({ block: 'start' }); } catch (e) { } }, 60);
    return true;
  }
  if (panels.length) {
    root.classList.add('js');
    tabs.forEach(function (t) {
      t.addEventListener('click', function (ev) { ev.preventDefault(); activate(t.getAttribute('data-panel'), { user: true }); });
      t.addEventListener('keydown', function (ev) {
        var i = tabs.indexOf(t), n = null;
        if (ev.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (ev.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { ev.preventDefault(); n.focus(); n.click(); }
      });
    });
    if (!goHash()) activate(panels[0].id);
    window.addEventListener('hashchange', goHash);
    // in-page links that point into other panels
    doc.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!a || a.classList.contains('tab')) return;
      var id = a.getAttribute('href').slice(1);
      if (!id) return;
      var el = doc.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      try { history.pushState(null, '', '#' + id); } catch (e) { location.hash = id; }
      goHash();
    });
  } else {
    root.classList.add('js');
    typeset(doc.body);
  }
  // hero + anything outside panels
  $$('.hero, .site-foot').forEach(typeset);

  /* ---------- table of contents (Learn) ---------- */
  var toc = $('.toc ol');
  if (toc) {
    var heads = $$('#learn .topic > h2');
    heads.forEach(function (h) {
      var sec = h.parentElement;
      if (!sec.id) return;
      var li = doc.createElement('li'), a = doc.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = h.textContent.replace(/\s+/g, ' ').trim();
      li.appendChild(a); toc.appendChild(li);
    });
    if ('IntersectionObserver' in window) {
      var links = $$('a', toc);
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) {
            links.forEach(function (l) { l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id); });
          }
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      heads.forEach(function (h) { if (h.parentElement.id) io.observe(h.parentElement); });
    }
  }

  /* ---------- progress ---------- */
  var slug = doc.body.getAttribute('data-slug');
  var state = slug ? store.get(KEY + slug, { done: {}, star: {}, chk: {} }) : null;
  if (state) { state.done = state.done || {}; state.star = state.star || {}; state.chk = state.chk || {}; }
  function save() { if (slug) store.set(KEY + slug, state); }
  function refreshMeters() {
    $$('[data-meter]').forEach(function (m) {
      var scope = doc.getElementById(m.getAttribute('data-meter'));
      if (!scope) return;
      var qs = $$('.q, .pq', scope), n = qs.length, d = qs.filter(function (q) { return state.done[q.id]; }).length;
      var bar = $('.meter-bar i', m), txt = $('.meter-txt', m);
      if (bar) bar.style.width = (n ? Math.round(100 * d / n) : 0) + '%';
      if (txt) txt.textContent = d + ' / ' + n + ' done';
    });
  }
  if (state) {
    $$('.q, .pq').forEach(function (q) {
      if (!q.id) return;
      var star = $('.q-act.star', q), done = $('.q-act.done', q);
      function paint() {
        q.classList.toggle('is-done', !!state.done[q.id]);
        q.classList.toggle('is-star', !!state.star[q.id]);
        if (star) star.setAttribute('aria-pressed', state.star[q.id] ? 'true' : 'false');
        if (done) done.setAttribute('aria-pressed', state.done[q.id] ? 'true' : 'false');
      }
      paint();
      if (star) star.addEventListener('click', function () { if (state.star[q.id]) delete state.star[q.id]; else state.star[q.id] = 1; save(); paint(); applyFilter(); });
      if (done) done.addEventListener('click', function () { if (state.done[q.id]) delete state.done[q.id]; else state.done[q.id] = 1; save(); paint(); refreshMeters(); });
    });
    refreshMeters();
    $$('.checklist input[type=checkbox]').forEach(function (c, i) {
      var id = c.id || ('chk-' + i);
      c.checked = !!state.chk[id];
      c.addEventListener('change', function () { if (c.checked) state.chk[id] = 1; else delete state.chk[id]; save(); });
    });
  }

  /* ---------- MCQ / assertion–reason options ---------- */
  $$('ol.opts[data-ans]').forEach(function (ol) {
    var ans = (ol.getAttribute('data-ans') || '').trim().toLowerCase();
    var items = $$(':scope > li', ol);
    items.forEach(function (li, i) {
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      function pick() {
        if (ol.classList.contains('locked')) return;
        ol.classList.add('locked');
        var letter = 'abcd'.charAt(i);
        if (letter === ans) li.classList.add('right');
        else { li.classList.add('wrong'); var r = items['abcd'.indexOf(ans)]; if (r) r.classList.add('right'); }
        var q = ol.closest('.pq, .q');
        if (q && state && q.id && letter === ans) { state.done[q.id] = 1; save(); q.classList.add('is-done'); var db = $('.q-act.done', q); if (db) db.setAttribute('aria-pressed', 'true'); refreshMeters(); }
      }
      li.addEventListener('click', pick);
      li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
    });
  });

  /* ---------- toolbars: expand/collapse, filters, exercise jump ---------- */
  $$('[data-expand]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = doc.getElementById(btn.getAttribute('data-expand'));
      if (!scope) return;
      var open = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', open ? 'true' : 'false');
      btn.firstChild.nodeValue = open ? 'Hide all solutions' : 'Show all solutions';
      $$('details.sol', scope).forEach(function (d) { if (!d.closest('[hidden]')) d.open = open; });
    });
  });
  var filterType = 'all';
  function applyFilter() {
    var scope = doc.getElementById('practise');
    if (!scope) return;
    var shown = 0;
    $$('.pq', scope).forEach(function (q) {
      var t = q.getAttribute('data-type');
      var ok = filterType === 'all' || filterType === t ||
        (filterType === 'star' && state && state.star[q.id]) ||
        (filterType === 'todo' && state && !state.done[q.id]);
      q.hidden = !ok; if (ok) shown++;
    });
    $$('.pq-group', scope).forEach(function (g) {
      var t = g.getAttribute('data-type');
      g.hidden = !(filterType === 'all' || filterType === t || filterType === 'star' || filterType === 'todo');
      if (!g.hidden && (filterType === 'star' || filterType === 'todo')) {
        var any = false, el = g.nextElementSibling;
        while (el && !el.classList.contains('pq-group')) { if (el.classList.contains('pq') && !el.hidden) { any = true; break; } el = el.nextElementSibling; }
        g.hidden = !any;
      }
    });
    var e = $('#pq-empty'); if (e) e.hidden = shown > 0;
  }
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filterType = b.getAttribute('data-filter');
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      applyFilter();
    });
  });

  /* ---------- videos: click to load ---------- */
  $$('.video-play').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.parentElement, id = f.getAttribute('data-yt'), list = f.getAttribute('data-list');
      var src = list && !id ? 'https://www.youtube-nocookie.com/embed/videoseries?list=' + encodeURIComponent(list) + '&autoplay=1'
        : 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0' + (list ? '&list=' + encodeURIComponent(list) : '');
      var fr = doc.createElement('iframe');
      fr.src = src; fr.title = f.getAttribute('data-title') || 'Video lesson';
      fr.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      fr.allowFullscreen = true; fr.referrerPolicy = 'strict-origin-when-cross-origin';
      f.innerHTML = ''; f.appendChild(fr);
    });
  });

  /* ---------- chapters drawer ---------- */
  var drawer = $('.drawer');
  if (drawer) {
    var lastFocus = null;
    function pct(sl) {
      var ch = SITE.chapters.filter(function (c) { return c.slug === sl; })[0];
      var st = store.get(KEY + sl, null);
      if (!ch || !st || !st.done) return 0;
      var total = (ch.ncert || 0) + (ch.pq || 0);
      return total ? Math.min(100, Math.round(100 * Object.keys(st.done).length / total)) : 0;
    }
    function openDrawer() {
      lastFocus = doc.activeElement;
      $$('.drawer-list a[data-slug]', drawer).forEach(function (a) { var p = pct(a.getAttribute('data-slug')); var s = $('.pct', a); if (s) s.textContent = p ? p + '%' : ''; });
      drawer.classList.add('open'); var c = $('.drawer-close', drawer); if (c) c.focus();
      doc.body.style.overflow = 'hidden';
    }
    function closeDrawer() { drawer.classList.remove('open'); doc.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
    $$('[data-drawer]').forEach(function (b) { b.addEventListener('click', openDrawer); });
    $$('.drawer-scrim, .drawer-close', drawer).forEach(function (b) { b.addEventListener('click', closeDrawer); });
    doc.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
  }

  /* ---------- home: progress on chapter cards ---------- */
  $$('.ch-card[data-slug]').forEach(function (card) {
    var sl = card.getAttribute('data-slug');
    var ch = SITE.chapters.filter(function (c) { return c.slug === sl; })[0];
    var st = store.get(KEY + sl, null);
    var total = ch ? (ch.ncert || 0) + (ch.pq || 0) : 0;
    var d = st && st.done ? Object.keys(st.done).length : 0;
    var bar = $('.meter-bar i', card), txt = $('.meter-txt', card);
    if (bar) bar.style.width = (total ? Math.min(100, Math.round(100 * d / total)) : 0) + '%';
    if (txt) txt.textContent = total ? (d + ' / ' + total) : '';
  });
  var overall = $('[data-overall]');
  if (overall) {
    var T = 0, D = 0;
    SITE.chapters.forEach(function (c) { T += (c.ncert || 0) + (c.pq || 0); var st = store.get(KEY + c.slug, null); if (st && st.done) D += Object.keys(st.done).length; });
    overall.textContent = D ? ('You have completed ' + D + ' of ' + T + ' questions (' + Math.round(100 * D / T) + '%). Keep going.') : (T + ' solved questions are waiting. Tick them off as you go — your progress is saved on this device.');
  }

  /* ---------- print: question paper only, or everything ---------- */
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () {
      var paperOnly = b.getAttribute('data-print') === 'paper';
      doc.body.classList.toggle('print-noans', paperOnly);
      window.print();
      setTimeout(function () { doc.body.classList.remove('print-noans'); }, 800);
    });
  });
  window.addEventListener('beforeprint', function () {
    if (doc.body.classList.contains('print-noans')) { typeset(doc.body); return; }
    panels.forEach(function (p) { if (!rendered[p.id]) { rendered[p.id] = 1; typeset(p); } });
    $$('details').forEach(function (d) { d.open = true; });
  });
})();
