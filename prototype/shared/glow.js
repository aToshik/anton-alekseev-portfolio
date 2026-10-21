/* Glowing borders (styles: glow.css): sections and interactive cards light up on the side nearest the cursor. */
(function () {
  'use strict';
  var SEL = '.nav, .sidebar, .main .card:not(.hero):not(.contact), .case-card, .tool-card, .role-card, .tiles, .phase, .pager a';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!els.length) return;
  els.forEach(function (el) { el.classList.add('gl'); });
  var REACH = 180; // px outside the box where the glow starts
  var px = -1e4, py = -1e4, raf = 0, seen = new Set(els);
  if ('IntersectionObserver' in window) {
    seen = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else { seen.delete(e.target); e.target.style.setProperty('--glow', 0); last.delete(e.target); } });
    });
    els.forEach(function (el) { io.observe(el); });
  }
  // read every rect first, then write, and only touch properties whose value changed:
  // interleaved reads/writes forced a layout per element, and each custom-property write restyles the whole subtree
  var last = new WeakMap();
  function update() {
    raf = 0;
    var jobs = [];
    seen.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
      var g = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
      jobs.push([el, g, px - r.left, py - r.top]);
    });
    jobs.forEach(function (j) {
      var el = j[0], g = j[1].toFixed(3), prev = last.get(el);
      if (g === '0.000' && prev && prev.g === '0.000') return; // dark and staying dark: nothing to move
      var mx = j[2].toFixed(1) + 'px', my = j[3].toFixed(1) + 'px';
      if (!prev) last.set(el, prev = {});
      if (prev.mx !== mx) el.style.setProperty('--mx', prev.mx = mx);
      if (prev.my !== my) el.style.setProperty('--my', prev.my = my);
      if (prev.g !== g) el.style.setProperty('--glow', prev.g = g);
    });
  }
  function queue() { if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('pointerdown', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('scroll', queue, { passive: true });
  document.addEventListener('pointerleave', function () { px = py = -1e4; queue(); });
})();
