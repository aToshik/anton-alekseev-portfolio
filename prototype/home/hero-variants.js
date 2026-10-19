/* Review only: switch hero compositions with ?hero=a, b, b2, b3, d, d2, d3. Each variant moves the copy (hero-variants.css) and the orbit system. */
(function () {
  'use strict';
  var V = {
    a: { name: 'Current', cx: .665, cy: .47, rw: .058, rh: .105, minx: .44 },
    b: { name: 'Stage 1', cx: .5, cy: .47, rw: .062, rh: .11, minx: .02, maxx: .98 },
    b2: { name: 'Stage 2', cx: .5, cy: .4, rw: .058, rh: .1, minx: .02, maxx: .98 },
    b3: { name: 'Stage 3', cx: .5, cy: .5, rw: .052, rh: .1, minx: .3, maxx: .72 },
    d: { name: 'Poster 1', cx: .6, cy: .42, rw: .056, rh: .1, minx: .3, maxx: .98 },
    d2: { name: 'Poster 2', cx: .56, cy: .62, rw: .046, rh: .082, minx: .3, maxx: .98 },
    d3: { name: 'Poster 3', cx: .55, cy: .5, rw: .064, rh: .12, minx: .02, maxx: .98 }
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
