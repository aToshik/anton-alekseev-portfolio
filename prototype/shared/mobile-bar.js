/* Mobile bar: a sticky strip under the floating nav for ≤1000px.
   It reads the page's own sidebar and mirrors it, so the desktop sidebar,
   its scroll-spy and its filters stay the single source of truth.
   - #sideNav present        → sections mode (current section + list)
   - .sidebar .filter-group  → filters mode (active filters + panel)        */
(function () {
  'use strict';
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  var sideNav = document.getElementById('sideNav');
  var groups = Array.prototype.slice.call(sidebar.querySelectorAll('.filter-group'));
  var mode = sideNav ? 'sections' : (groups.length ? 'filters' : null);
  if (!mode) return;

  var mq = window.matchMedia('(max-width: 1000px)');
  var chev = '<svg class="mbar-chev lu lu-chevron-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  var bar = document.createElement('div');
  bar.className = 'mbar';
  bar.innerHTML = '<button class="mbar-btn" type="button" aria-expanded="false" aria-controls="mbarPanel">' +
    '<span class="mbar-idx"></span><span class="mbar-label"></span><span class="mbar-meta"></span>' + chev +
    '<span class="mbar-progress" aria-hidden="true"></span></button>';
  var panel = document.createElement('div');
  panel.className = 'mbar-panel'; panel.id = 'mbarPanel';
  panel.setAttribute('aria-label', mode === 'sections' ? 'Sections' : 'Filter cases');
  var scrim = document.createElement('div');
  scrim.className = 'mbar-scrim'; scrim.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrim); document.body.appendChild(bar); document.body.appendChild(panel);

  var btn = bar.querySelector('.mbar-btn');
  var idxEl = bar.querySelector('.mbar-idx'), labelEl = bar.querySelector('.mbar-label'), metaEl = bar.querySelector('.mbar-meta');
  var progEl = bar.querySelector('.mbar-progress');
  var open = false;

  function setOpen(v, restoreFocus) {
    open = v;
    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    panel.classList.toggle('show', v); scrim.classList.toggle('show', v);
    if (v) { render(); var f = panel.querySelector('.active, [aria-pressed="true"], a, button'); if (f) f.focus({ preventScroll: true }); }
    else if (restoreFocus) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', function () { setOpen(!open); });
  scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false, true); });

  /* ---------- sections mode ---------- */
  var links = sideNav ? Array.prototype.slice.call(sideNav.querySelectorAll(':scope > a')) : [];
  var near = sidebar.querySelector('.side-near');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function labelOf(a) { return a.textContent.replace(/\s+/g, ' ').trim(); }

  function renderSections() {
    var i = -1;
    links.forEach(function (a, k) { if (a.classList.contains('active')) i = k; });
    if (i < 0) i = 0;
    idxEl.innerHTML = pad(i + 1) + '<span class="of">/' + pad(links.length) + '</span>';
    /* a section with phase steps (Decisions) also names the phase being read */
    var sub = links[i].nextElementSibling && links[i].nextElementSibling.classList.contains('side-sub') ? links[i].nextElementSibling : null;
    var cur = sub && sub.querySelector('.ss-step.cur');
    labelEl.textContent = labelOf(links[i]);
    metaEl.textContent = cur ? cur.querySelector('.ss-num').textContent + '/' + pad(sub.querySelectorAll('.ss-step').length) : '';
    btn.setAttribute('aria-label', 'Section ' + (i + 1) + ' of ' + links.length + ': ' + labelOf(links[i]) + '. Show all sections');
    if (!open) return;
    var html = '<nav class="mbar-list">';
    links.forEach(function (a, k) {
      html += '<a href="' + a.getAttribute('href') + '" data-k="' + k + '"' + (k === i ? ' class="active" aria-current="true"' : '') + '><span class="n">' + pad(k + 1) + '</span>' + labelOf(a) + '</a>';
      var ss = a.nextElementSibling && a.nextElementSibling.classList.contains('side-sub') ? a.nextElementSibling : null;
      if (ss) Array.prototype.forEach.call(ss.querySelectorAll('.ss-step'), function (st) {
        html += '<a class="mbar-sub' + (k === i && st.classList.contains('cur') ? ' active' : '') + '" href="' + st.getAttribute('href') + '"><span class="n">' + st.querySelector('.ss-num').textContent + '</span>' + st.querySelector('.ss-name').textContent + '</a>';
      });
    });
    html += '</nav>';
    if (near) html += '<div class="mbar-near">' + near.innerHTML + '</div>';
    panel.innerHTML = html;
  }
  panel.addEventListener('click', function (e) {
    var a = e.target.closest('.mbar-list a');
    if (!a) return;
    if (a.classList.contains('mbar-sub')) { setOpen(false); return; } /* plain anchor to the phase */
    e.preventDefault();
    setOpen(false);
    links[+a.getAttribute('data-k')].click(); /* reuse the page's own scroll + scroll-spy pin */
  });

  /* ---------- filters mode ---------- */
  var origBtns = Array.prototype.slice.call(sidebar.querySelectorAll('.filter-btn'));
  var headCount = document.getElementById('headCount');
  var clearBtn = document.getElementById('clearBtn');

  function renderFilters() {
    var active = origBtns.filter(function (b) { return b.dataset.tag && b.getAttribute('aria-pressed') === 'true'; })
      .map(function (b) { return b.dataset.tag; });
    idxEl.textContent = 'Filter';
    labelEl.textContent = active.length ? active.join(', ') : 'All cases';
    metaEl.textContent = headCount ? headCount.textContent.trim() : '';
    btn.setAttribute('aria-label', 'Filters: ' + labelEl.textContent + ', ' + metaEl.textContent + '. Change filters');
    if (!open) return;
    var focusedK = document.activeElement && panel.contains(document.activeElement) ? document.activeElement.getAttribute('data-k') : null;
    panel.innerHTML = '';
    groups.forEach(function (g) {
      var c = g.cloneNode(true);
      c.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
      c.querySelectorAll('.filter-btn').forEach(function (b, j) {
        var orig = g.querySelectorAll('.filter-btn')[j];
        b.setAttribute('data-k', origBtns.indexOf(orig));
      });
      panel.appendChild(c);
    });
    var foot = document.createElement('div');
    foot.className = 'mbar-foot';
    foot.innerHTML = '<span class="mbar-meta">' + metaEl.textContent + '</span>' +
      (active.length ? '<button class="mbar-clear" type="button">Clear</button>' : '') +
      '<button class="mbar-done" type="button"' + (active.length ? '' : ' style="margin-left:auto"') + '>Show</button>';
    panel.appendChild(foot);
    if (focusedK !== null) { var f = panel.querySelector('[data-k="' + focusedK + '"]'); if (f) f.focus({ preventScroll: true }); }
  }
  if (mode === 'filters') {
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('.filter-btn');
      if (b) { origBtns[+b.getAttribute('data-k')].click(); return; }
      if (e.target.closest('.mbar-clear') && clearBtn) { clearBtn.click(); return; }
      if (e.target.closest('.mbar-done')) {
        setOpen(false, true);
        var cards = document.getElementById('cards') || document.getElementById('main');
        if (cards && cards.getBoundingClientRect().top < 0) cards.scrollIntoView({ block: 'start' });
      }
    });
  }

  function render() { if (mode === 'sections') renderSections(); else renderFilters(); }

  /* the page's own scripts flip .active / aria-pressed / counts; mirror them */
  var raf = 0;
  new MutationObserver(function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; render(); }); })
    .observe(mode === 'sections' ? sideNav : sidebar, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-pressed'] });
  if (headCount) new MutationObserver(render).observe(headCount, { childList: true, characterData: true, subtree: true });

  /* on mobile the bar is always shown (the sidebar is hidden); progress = page read */
  function onScroll() {
    if (!mq.matches) { bar.classList.remove('show'); if (open) setOpen(false); return; }
    bar.classList.add('show');
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  render(); onScroll();
})();
