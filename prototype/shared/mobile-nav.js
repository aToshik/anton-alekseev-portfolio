/* Mobile nav (≤760px): a Menu button + page list built from the page's own .nav-links,
   theme toggle and contact link, so the desktop nav stays the single source of truth.
   The top bar hides on scroll down and returns on scroll up (html.mnav-up). */
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var navLinks = nav && Array.prototype.slice.call(nav.querySelectorAll('.nav-links a'));
  if (!nav || !navLinks.length) return;
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeBtn');
  var contact = nav.querySelector('.btn-contact');
  var mq = window.matchMedia('(max-width: 760px)');

  function svg(cls, paths, w) { return '<svg class="lu ' + cls + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'; }
  var I = {
    menu: svg('lu-menu', '<path d="M4 9h16M4 15h16"/>', 1.8),
    x: svg('lu-x', '<path d="M18 6 6 18M6 6l12 12"/>', 1.8),
    arrow: svg('lu-arrow-ur', '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>', 1.8),
    moon: svg('icon-moon lu-moon', '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'),
    sun: svg('icon-sun lu-sun', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>')
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function label(a) { return a.textContent.replace(/\s+/g, ' ').trim(); }
  function attrs(a) {
    return 'href="' + a.getAttribute('href') + '"' + (a.hasAttribute('aria-current') ? ' aria-current="page"' : '') + (a.hasAttribute('data-note') ? ' data-note="' + a.getAttribute('data-note') + '"' : '');
  }
  var mailHref = contact ? contact.getAttribute('href') : 'mailto:aa.nooker@gmail.com';

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
  if (mbarBtn) mbarBtn.addEventListener('click', function () { if (open) setOpen(false); setUp(false); });
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

  /* ---------- hide on scroll down, return on scroll up ---------- */
  var lastY = window.scrollY, up = false;
  function setUp(v) { if (v !== up) { up = v; root.classList.toggle('mnav-up', v); } }
  window.addEventListener('scroll', function () {
    var y = window.scrollY, dy = y - lastY;
    if (!mq.matches || open || document.querySelector('.mbar-panel.show') || y < nav.offsetHeight) { setUp(false); lastY = y; return; }
    if (Math.abs(dy) < 8) return; /* ignore jitter */
    setUp(dy > 0); lastY = y;
  }, { passive: true });
  /* keyboard users tabbing into the hidden bar get it back */
  nav.addEventListener('focusin', function () { setUp(false); });
  mq.addEventListener('change', function () { if (!mq.matches) { setUp(false); if (open) setOpen(false); } });
})();
