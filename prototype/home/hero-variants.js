/* Review only: switch hero compositions with ?hero=s1…s5. Each variant moves the copy (hero-variants.css) and the orbit system. */
(function () {
  'use strict';
  var V = {
    a: { name: 'Current', cx: .665, cy: .47, rw: .058, rh: .105, minx: .44 },
    s1: { name: 'Stage 2', cx: .5, cy: .4, rw: .058, rh: .1, minx: .02, maxx: .98 },
    s2: { name: 'Axis', cx: .5, cy: .37, rw: .054, rh: .092, minx: .02, maxx: .98 },
    s2f: { name: 'Axis · 100vh', cx: .5, cy: .38, rw: .058, rh: .1, minx: .02, maxx: .98 },
    f: { name: 'Axis · Figma', cx: .5, cy: .4, rw: .058, rh: .1, minx: .02, maxx: .98 },
    s3: { name: 'Split base', cx: .5, cy: .4, rw: .058, rh: .1, minx: .02, maxx: .98 },
    s4: { name: 'Big name', cx: .5, cy: .5, rw: .062, rh: .11, minx: .02, maxx: .98 },
    s5: { name: 'Tagline first', cx: .56, cy: .44, rw: .056, rh: .1, minx: .3, maxx: .98 }
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
