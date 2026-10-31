/* Inbox case: drives the Key decisions scene in inbox-scene.css.
   Each alert leaves its module and lands as a card in its customer's thread.
   Runs only while the scene is on screen; with reduced motion it shows the final state. */
(function () {
  'use strict';
  var scene = document.querySelector('.ib-scene');
  if (!scene) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var alerts = Array.prototype.slice.call(scene.querySelectorAll('.ib-n[data-to]'));

  var visible = false, waiting = null;
  function gate() { return visible ? Promise.resolve() : new Promise(function (r) { waiting = r; }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && waiting) { waiting(); waiting = null; }
    }, { threshold: 0.35 }).observe(scene);
  } else visible = true;

  function badge(mod, delta) {
    var b = mod.querySelector('.ib-badge'); if (!b) return;
    var n = Math.max(0, (parseInt(b.textContent, 10) || 0) + delta);
    b.textContent = n; b.classList.toggle('zero', n === 0);
  }
  function slotFor(a) { return scene.querySelector('.ib-card[data-id="' + a.getAttribute('data-to') + '"]'); }

  function reset() {
    alerts.forEach(function (a) { a.classList.remove('gone'); var s = slotFor(a); s.classList.remove('in'); s.classList.add('slot'); });
    scene.querySelectorAll('.ib-mod').forEach(function (m) {
      var b = m.querySelector('.ib-badge'); if (!b) return;
      var n = m.querySelectorAll('.ib-n[data-to]').length; b.textContent = n; b.classList.toggle('zero', n === 0);
    });
  }
  function land(a) {
    var s = slotFor(a);
    a.classList.add('gone'); badge(a.closest('.ib-mod'), -1);
    s.classList.remove('slot'); s.classList.add('in');
  }
  function finalState() { reset(); alerts.forEach(land); }

  function fly(a) {
    var s = slotFor(a), box = scene.getBoundingClientRect();
    var from = a.getBoundingClientRect(), to = s.getBoundingClientRect();
    var g = s.cloneNode(true);
    g.classList.remove('slot', 'in'); g.classList.add('ib-ghost'); g.setAttribute('aria-hidden', 'true');
    g.style.left = (from.left - box.left) + 'px'; g.style.top = (from.top - box.top) + 'px';
    g.style.width = to.width + 'px';
    scene.appendChild(g);
    a.classList.add('gone'); badge(a.closest('.ib-mod'), -1);
    g.getBoundingClientRect();
    g.style.transform = 'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px)';
    return sleep(640).then(function () {
      g.remove(); s.classList.remove('slot'); s.classList.add('in');
      });
  }

  if (reduce) { finalState(); return; }
  reset();
  (async function loop() {
    for (;;) {
      await gate(); await sleep(700);
      for (var i = 0; i < alerts.length; i++) { await gate(); await fly(alerts[i]); await sleep(360); }
      await sleep(3600); await gate();
      reset(); await sleep(500);
    }
  })();
})();
