/* Review only: switch hero compositions with ?hero=a…e. Each variant moves the copy (hero-variants.css) and the orbit system. */
(function () {
  'use strict';
  var V = {
    a: { name: 'A · Current', cx: .665, cy: .47, rw: .058, rh: .105, minx: .44 },
    b: { name: 'B · Stage', cx: .5, cy: .47, rw: .062, rh: .11, minx: .02, maxx: .98 },
    c: { name: 'C · Mirrored', cx: .3, cy: .47, rw: .058, rh: .105, minx: .02, maxx: .58 },
    d: { name: 'D · Poster', cx: .6, cy: .42, rw: .056, rh: .1, minx: .3, maxx: .98 },
    e: { name: 'E · Column', cx: .69, cy: .48, rw: .06, rh: .11, minx: .46, maxx: .98 }
  };
  var hero = document.getElementById('hero');
  var q = new URLSearchParams(location.search).get('hero');
  if (!hero || !q) return;
  var bar = document.createElement('div'); bar.className = 'hv-bar'; bar.innerHTML = '<small>Hero</small>';
  Object.keys(V).forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = V[k].name; b.dataset.k = k;
    b.addEventListener('click', function () { set(k); }); bar.appendChild(b);
  });
  document.body.appendChild(bar);
  function set(k) {
    if (!V[k]) k = 'a';
    var v = V[k];
    if (k === 'a') delete hero.dataset.v; else hero.dataset.v = k;
    ['cx', 'cy', 'rw', 'rh', 'minx', 'maxx'].forEach(function (p) { if (v[p] != null) hero.dataset[p] = v[p]; else delete hero.dataset[p]; });
    bar.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k); });
    history.replaceState(null, '', '?hero=' + k + location.hash);
    requestAnimationFrame(function () { hero.dispatchEvent(new Event('po:layout')); });
  }
  set(q);
})();
