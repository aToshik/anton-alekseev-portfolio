/* Arrow-key navigation, shared by Home, Work and case pages.
   ↑ / ↓  sections from #sideNav (not cyclic). "Smart": while the current section's far edge is
          still off-screen the key scrolls natively, so long sections stay readable; once it is in
          view the next press jumps to the neighbouring section via its nav link (keeps scroll-spy pins).
   ← / →  pages: data-prev / data-next on this <script> tag (hrefs; empty = no-op).
   Ignored with modifiers, while typing, on media/slider controls, and when the lightbox is open
   (lightbox.js stops arrow keys in its capture handler). */
(function () {
  var me = document.currentScript;
  var prev = me && me.getAttribute('data-prev');
  var next = me && me.getAttribute('data-next');
  var links = Array.prototype.slice.call(document.querySelectorAll('#sideNav a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });

  function topLine() {
    /* where a jumped-to section lands: scroll-padding + its scroll-margin, plus a little slack */
    var pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 96;
    var margin = sections[0] ? parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0 : 0;
    return pad + margin + 24;
  }
  function currentIndex() {
    var line = topLine(), idx = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) idx = i; });
    return idx;
  }
  function go(i) { links[i].click(); }

  function onVertical(e, dir) {
    if (!links.length) return;
    var i = currentIndex(), s = sections[i];
    if (!s) return;
    var r = s.getBoundingClientRect(), vh = window.innerHeight;
    if (dir > 0) {
      if (r.bottom > vh + 4) return;            /* section not finished yet: native scroll */
      if (i + 1 >= links.length) return;         /* last section: no wrap */
      e.preventDefault(); go(i + 1);
    } else {
      if (r.top < topLine() - 48) return;        /* section start not in view yet: native scroll */
      if (i === 0) return;                       /* first section: no wrap */
      e.preventDefault(); go(i - 1);
    }
  }

  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var t = e.target || {}, tag = t.tagName || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'VIDEO' || tag === 'AUDIO' || t.isContentEditable) return;
    if (t.getAttribute && /slider|tab|listbox|menu/.test(t.getAttribute('role') || '')) return;
    switch (e.key) {
      case 'ArrowDown': onVertical(e, 1); break;
      case 'ArrowUp': onVertical(e, -1); break;
      case 'ArrowLeft': if (prev) { e.preventDefault(); location.href = prev; } break;
      case 'ArrowRight': if (next) { e.preventDefault(); location.href = next; } break;
    }
  });
})();
