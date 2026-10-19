/* Glowing borders (styles: glow.css): sections and interactive cards light up on the side nearest the cursor. */
(function () {
  'use strict';
  var SEL = '.nav, .sidebar, .main .card:not(.hero):not(.contact), .case-card, .tool-card, .role-card, .tiles, .phase';
  var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
  if (!els.length) return;
  els.forEach(function (el) { el.classList.add('gl'); });
  var REACH = 180; // px outside the box where the glow starts
  var px = -1e4, py = -1e4, raf = 0, seen = new Set(els);
  if ('IntersectionObserver' in window) {
    seen = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else { seen.delete(e.target); e.target.style.setProperty('--glow', 0); } });
    });
    els.forEach(function (el) { io.observe(el); });
  }
  function update() {
    raf = 0;
    seen.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var dx = Math.max(r.left - px, 0, px - r.right), dy = Math.max(r.top - py, 0, py - r.bottom);
      var g = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
      el.style.setProperty('--mx', (px - r.left).toFixed(1) + 'px');
      el.style.setProperty('--my', (py - r.top).toFixed(1) + 'px');
      el.style.setProperty('--glow', g.toFixed(3));
    });
  }
  function queue() { if (!raf) raf = requestAnimationFrame(update); }
  addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('pointerdown', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
  addEventListener('scroll', queue, { passive: true });
  document.addEventListener('pointerleave', function () { px = py = -1e4; queue(); });
})();
