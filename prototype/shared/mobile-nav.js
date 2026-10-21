/* Mobile nav: primary navigation for ≤760px, built from the page's own .nav-links,
   theme toggle and contact link, so the desktop nav stays the single source of truth.
   Review: ?mnav=a|b|c picks a variant (remembered for the session) and shows a switcher. */
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var navLinks = nav && Array.prototype.slice.call(nav.querySelectorAll('.nav-links a'));
  if (!nav || !navLinks.length) return;
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var contact = nav.querySelector('.btn-contact');
  var mq = window.matchMedia('(max-width: 760px)');

  var V = { a: 'Menu', b: 'Tabs', c: 'Dock' };
  var q = new URLSearchParams(location.search).get('mnav');
  var saved = null;
  try { if (q && V[q]) sessionStorage.setItem('mnav', q); saved = sessionStorage.getItem('mnav'); } catch (e) {}
  var cur = V[q] ? q : (V[saved] ? saved : 'a');
  if (q || saved) root.setAttribute('data-mnav-review', '');

  function svg(cls, paths, w) { return '<svg class="lu ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'; }
  var I = {
    menu: svg('lu-menu', '<path d="M4 9h16M4 15h16"/>', 1.8),
    x: svg('lu-x', '<path d="M18 6 6 18M6 6l12 12"/>', 1.8),
    arrow: svg('lu-arrow-ur', '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>', 1.8),
    moon: svg('icon-moon lu-moon', '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    sun: svg('icon-sun lu-sun', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'),
    mail: svg('lu-mail', '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
    home: svg('lu-house', '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
    work: svg('lu-layout-grid', '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'),
    profile: svg('lu-user-round', '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>')
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function label(a) { return a.textContent.replace(/\s+/g, ' ').trim(); }
  function attrs(a) {
    return 'href="' + a.getAttribute('href') + '"' + (a.hasAttribute('aria-current') ? ' aria-current="page"' : '') + (a.hasAttribute('data-note') ? ' data-note="' + a.getAttribute('data-note') + '"' : '');
  }
  var mailHref = contact ? contact.getAttribute('href') : 'mailto:aa.nooker@gmail.com';

  /* ---------- A · Menu ---------- */
  var toggle = document.createElement('button');
  toggle.className = 'mnav-toggle'; toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', 'mnavPanel');
  toggle.innerHTML = I.menu + I.x + '<span>Menu</span>';
  nav.querySelector('.nav-right').insertBefore(toggle, contact || null);

  var scrim = document.createElement('div');
  scrim.className = 'mnav-scrim'; scrim.setAttribute('aria-hidden', 'true');
  var panel = document.createElement('div');
  panel.className = 'mnav-panel'; panel.id = 'mnavPanel'; panel.setAttribute('aria-label', 'Menu');
  panel.innerHTML = '<nav class="mnav-list" aria-label="Pages">' + navLinks.map(function (a, k) {
      return '<a ' + attrs(a) + '><span class="n">' + pad(k + 1) + '</span><span class="t">' + label(a) + '</span>' + (a.hasAttribute('data-note') ? '<span class="soon">Soon</span>' : '') + '</a>';
    }).join('') + '</nav>' +
    '<div class="mnav-foot"><span class="mnav-status"><i></i>Open to work</span>' +
    (themeBtn ? '<button class="mnav-theme" type="button">' + I.moon + I.sun + '<span></span></button>' : '') + '</div>' +
    '<a class="mnav-cta" href="' + mailHref + '"><span>Contact now</span>' + I.arrow + '</a>';
  document.body.appendChild(scrim); document.body.appendChild(panel);

  var open = false;
  function setOpen(v, restoreFocus) {
    open = v;
    toggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    toggle.querySelector('span').textContent = v ? 'Close' : 'Menu';
    panel.classList.toggle('show', v); scrim.classList.toggle('show', v);
    if (v) {
      var ms = document.querySelector('.mbar-scrim.show'); if (ms) ms.click(); /* one panel at a time */
      var f = panel.querySelector('[aria-current]') || panel.querySelector('a'); if (f) f.focus({ preventScroll: true });
    } else if (restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', function () { setOpen(!open); });
  scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false, true); });
  var mbarBtn = document.querySelector('.mbar-btn');
  if (mbarBtn) mbarBtn.addEventListener('click', function () { if (open) setOpen(false); });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('.mnav-theme')) { themeBtn.click(); return; }
    var a = e.target.closest('a');
    if (!a) return;
    if (a.getAttribute('href') === '#') { e.preventDefault(); return; } /* placeholder page */
    setOpen(false);
  });
  var themeLabel = panel.querySelector('.mnav-theme span');
  function syncTheme() { if (themeLabel) themeLabel.textContent = root.getAttribute('data-theme') === 'light' ? 'Dark mode' : 'Light mode'; }
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  syncTheme();

  /* ---------- C · Dock ---------- */
  var dock = document.createElement('nav');
  dock.className = 'mnav-dock'; dock.setAttribute('aria-label', 'Primary');
  dock.innerHTML = navLinks.map(function (a) {
    var t = label(a);
    return '<a ' + attrs(a) + '>' + (I[t.toLowerCase()] || '') + '<span>' + t + '</span></a>';
  }).join('') + '<a class="mnav-mail" href="' + mailHref + '" aria-label="Contact now">' + I.mail + '<span>Mail</span></a>';
  document.body.appendChild(dock);
  dock.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (a && a.getAttribute('href') === '#') e.preventDefault();
  });

  /* ---------- variant + review switcher ---------- */
  function set(k) {
    cur = k;
    if (open) setOpen(false);
    root.setAttribute('data-mnav', k);
    try { if (root.hasAttribute('data-mnav-review')) sessionStorage.setItem('mnav', k); } catch (e) {}
    if (sw) sw.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); });
  }
  var sw = null;
  if (root.hasAttribute('data-mnav-review')) {
    sw = document.createElement('div'); sw.className = 'mnav-switch'; sw.innerHTML = '<small>Nav</small>';
    Object.keys(V).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = k.toUpperCase() + ' · ' + V[k];
      b.addEventListener('click', function () { set(k); }); sw.appendChild(b);
    });
    document.body.appendChild(sw);
  }
  set(cur);
  mq.addEventListener('change', function () { if (!mq.matches && open) setOpen(false); });
})();
