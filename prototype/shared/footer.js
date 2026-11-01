/* Contact footer variants (?foot=0|1|2|3, kept for the tab). 1: horizon rises with scroll. 2: dark points inside the lime card. */
(function () {
  'use strict';
  var root = document.documentElement, v = '1';
  try {
    var q = new URLSearchParams(location.search).get('foot');
    if (q && /^[0-3]$/.test(q)) sessionStorage.setItem('foot', q);
    v = sessionStorage.getItem('foot') || '1';
  } catch (e) {}
  root.setAttribute('data-foot', v);
  var card = document.querySelector('.contact');
  if (!card) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (v === '1') {
    var tick = function () {
      var r = card.getBoundingClientRect(), H = innerHeight;
      var p = Math.max(0, Math.min(1, (H - r.top) / (r.height + H * .4)));   // 0 when the card enters, 1 when it is fully in
      card.style.setProperty('--rise', reduce ? '0px' : ((1 - p) * 90).toFixed(1) + 'px');
    };
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
  }

  if (v === '2') {
    var cv = document.createElement('canvas'); cv.className = 'ct-space'; cv.setAttribute('aria-hidden', 'true');
    card.prepend(cv);
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, seed = 7, P = [];
    function rnd() { return (seed = (seed * 16807) % 2147483647) / 2147483647; }
    for (var i = 0; i < 110; i++) { var a = rnd() * 6.283, rr = .15 + rnd() * 1.2; P.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr, p: rnd(), v: 40 + rnd() * 30, b: .5 + rnd() * .5 }); }
    function size() { var r = card.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    size(); addEventListener('resize', size);
    var mx = 0, my = 0, tx = 0, ty = 0, T = 0, prev = performance.now(), lastY = scrollY, vel = 0, on = false;
    addEventListener('pointermove', function (e) { var r = card.getBoundingClientRect(); tx = e.clientX - r.left - W / 2; ty = e.clientY - r.top - H / 2; }, { passive: true });
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { prev = performance.now(); requestAnimationFrame(frame); } }).observe(card);
    function frame(now) {
      if (!on) return; requestAnimationFrame(frame);
      var dt = Math.min(.05, (now - prev) / 1000); prev = now;
      var dy = scrollY - lastY; lastY = scrollY; vel += (dy / Math.max(dt, .001) - vel) * Math.min(1, dt * 6);
      if (!reduce) T += dt * (.3 + Math.max(-5, Math.min(5, vel / 400)));
      mx += (tx - mx) * Math.min(1, dt * 4); my += (ty - my) * Math.min(1, dt * 4);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#12180e';
      var cx = W * .5, cy = H * .5, sc = Math.max(W, H) * .6;
      for (var i = 0; i < P.length; i++) {
        var s = P[i], z = 1 - .93 * (((s.p + T / s.v) % 1 + 1) % 1), f = .1 / z, n = 1 - z;
        var x = cx + s.x * sc * f - mx * .06 * n, y = cy + s.y * sc * f * .8 - my * .06 * n;
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        ctx.globalAlpha = Math.min(.85, (.16 + .7 * n * n) * Math.min(1, n * 6) * s.b);
        var r = 1 + 2.6 * n * n; ctx.fillRect(x - r / 2, y - r / 2, r, r);
      }
    }
  }
})();
