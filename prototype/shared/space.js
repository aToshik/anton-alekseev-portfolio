/* Space background: one fixed canvas behind the panels. Square points sit at different depths and drift
   out of the middle of the viewport; scrolling speeds the flow up (down = forward, up = back), the cursor
   shifts near points more than far ones. Panels stay still: the world moves behind them.
   Options on <html>: data-space="calm" (cases: sparser, no flow, parallax only). */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var calm = root.getAttribute('data-space') === 'calm';
  var cv = document.createElement('canvas');
  cv.className = 'space-bg'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1;
  var seed = 11; function rnd() { return (seed = (seed * 16807) % 2147483647) / 2147483647; }
  var N = calm ? 60 : 150, P = [], sinkEl = document.querySelector('.contact');
  for (var i = 0; i < N; i++) { var a = rnd() * Math.PI * 2, r = .2 + rnd() * 1.1; P.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, p: rnd(), v: 45 + rnd() * 35, b: .55 + rnd() * .45 }); }
  function size() { W = innerWidth; H = innerHeight; dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  size(); addEventListener('resize', size);
  var mx = 0, my = 0, tx = 0, ty = 0;
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { tx = e.clientX - W / 2; ty = e.clientY - H / 2; } }, { passive: true });
  var lastY = scrollY, vel = 0, T = 0, prev = performance.now(), raf = 0;
  function colour() { return root.getAttribute('data-theme') === 'light' ? '#6f7568' : '#f0f2ea'; }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - prev) / 1000); prev = now;
    var dy = scrollY - lastY; lastY = scrollY;
    vel += (dy / Math.max(dt, .001) - vel) * Math.min(1, dt * 6);           // px/s, smoothed
    var boost = calm ? 0 : Math.max(-6, Math.min(6, vel / 400));            // scroll speeds the flow, sign = direction
    if (!reduce) T += dt * (calm ? 0 : .35 + boost);
    mx += (tx - mx) * Math.min(1, dt * 4); my += (ty - my) * Math.min(1, dt * 4);
    var light = root.getAttribute('data-theme') === 'light';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.fillStyle = colour();
    var cx = W / 2, cy = H * .45, sc = Math.max(W, H) * .6, k = light ? .55 : 1;
    var sink = null;                                                             // ?foot=3: the lime card pulls the flow in
    if (root.getAttribute('data-foot') === '3' && sinkEl) { var sr = sinkEl.getBoundingClientRect(); if (sr.bottom > 0 && sr.top < H) sink = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2, w: sr.width / 2, h: sr.height / 2 }; }
    for (var i = 0; i < N; i++) {
      var s = P[i], z = 1 - .93 * (((s.p + T / s.v) % 1 + 1) % 1), f = .1 / z, n = 1 - z;
      var x = cx + s.x * sc * f - mx * .05 * n, y = cy + s.y * sc * f * .8 - my * .05 * n;
      var glow = 1;
      if (sink) {
        var ddx = sink.x - x, ddy = sink.y - y, d = Math.max(0, Math.hypot(Math.max(0, Math.abs(ddx) - sink.w), Math.max(0, Math.abs(ddy) - sink.h)));
        var pull = Math.exp(-d / 260); x += ddx * .18 * pull; y += ddy * .18 * pull; glow = 1 + 2.2 * pull;
        if (pull > .2) ctx.fillStyle = light ? '#4ea832' : '#d6f79a'; else ctx.fillStyle = colour();
      }
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      ctx.globalAlpha = Math.min(1, (.07 + .5 * n * n) * Math.min(1, n * 6) * s.b * k * glow);
      var r = .6 + 1.8 * n * n; ctx.fillRect(x - r / 2, y - r / 2, r, r);
    }
  }
  function start() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  if (reduce) { frame(performance.now()); stop(); addEventListener('resize', function () { frame(performance.now()); stop(); }); }
  else start();
})();
