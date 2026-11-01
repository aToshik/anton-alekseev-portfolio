/* Contact footer variants (?foot=0|1|2|3, kept for the tab). 1: dark section; its visual by ?fx=a orbit | b flow into the button | c core light. 2: dark points inside the lime card. */
(function () {
  'use strict';
  var root = document.documentElement, v = '1';
  try {
    var q = new URLSearchParams(location.search).get('foot');
    if (q && /^[0-3]$/.test(q)) sessionStorage.setItem('foot', q);
    v = sessionStorage.getItem('foot') || '1';
  } catch (e) {}
  root.setAttribute('data-foot', v);
  var fx = 'a';
  try {
    var qf = new URLSearchParams(location.search).get('fx');
    if (qf && /^[abc]$/.test(qf)) sessionStorage.setItem('fx', qf);
    fx = sessionStorage.getItem('fx') || 'a';
  } catch (e) {}
  root.setAttribute('data-fx', fx);
  var card = document.querySelector('.contact');
  if (!card) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (v === '1' && fx !== 'c') {
    var cv1 = document.createElement('canvas'); cv1.className = 'ct-fx'; cv1.setAttribute('aria-hidden', 'true');
    card.prepend(cv1);
    var c1 = cv1.getContext('2d'), w1 = 0, h1 = 0, d1 = 1, vis = false, t0 = performance.now(), lastT = t0;
    var btn = card.querySelector('.contact-btn');
    function hz() { return root.getAttribute('data-theme') === 'light' ? '78,168,50' : '184,242,74'; }
    function ink() { return root.getAttribute('data-theme') === 'light' ? '111,117,104' : '240,242,234'; }
    function sz1() { var r = card.getBoundingClientRect(); w1 = r.width; h1 = r.height; d1 = Math.min(2, devicePixelRatio || 1); cv1.width = Math.round(w1 * d1); cv1.height = Math.round(h1 * d1); }
    sz1(); addEventListener('resize', sz1);
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { lastT = performance.now(); requestAnimationFrame(draw1); } }).observe(card);
    var sd = 3; function rr() { return (sd = (sd * 16807) % 2147483647) / 2147483647; }
    // b: particles flowing from the edges into the button
    var F = []; for (var k = 0; k < 90; k++) F.push({ t: rr(), sp: .10 + rr() * .12, a: rr() * 6.283, cv: (rr() - .5) * 1.4, b: .5 + rr() * .5 });
    var T1 = 0;
    function draw1(now) {
      if (!vis) return; requestAnimationFrame(draw1);
      var dt = Math.min(.05, (now - lastT) / 1000); lastT = now; if (!reduce) T1 += dt;
      c1.setTransform(d1, 0, 0, d1, 0, 0); c1.clearRect(0, 0, w1, h1);
      var H = hz();
      if (fx === 'a') {
        // a: a hero-style orbit around the right side of the section, one lime object with a trail
        var cx = w1 * .7, cy = h1 * .34, rx = Math.min(w1 * .24, 290), ry = rx * .36, tilt = -.22;
        c1.save(); c1.translate(cx, cy); c1.rotate(tilt);
        c1.strokeStyle = 'rgba(' + ink() + ',.3)'; c1.lineWidth = 1; c1.setLineDash([2, 6]);
        c1.beginPath(); c1.ellipse(0, 0, rx, ry, 0, 0, 6.283); c1.stroke();
        c1.beginPath(); c1.ellipse(0, 0, rx * .62, ry * .62, 0, 0, 6.283); c1.stroke();
        c1.setLineDash([]);
        // core
        var g = c1.createRadialGradient(0, 0, 0, 0, 0, rx * .5); g.addColorStop(0, 'rgba(' + H + ',.22)'); g.addColorStop(1, 'rgba(' + H + ',0)');
        c1.fillStyle = g; c1.beginPath(); c1.ellipse(0, 0, rx * .5, rx * .5, 0, 0, 6.283); c1.fill();
        c1.fillStyle = 'rgb(' + H + ')'; c1.fillRect(-3, -3, 6, 6);
        // object + trail on the outer orbit, a small grey one on the inner orbit
        var ph = T1 * .35;
        for (var s2 = 0; s2 < 26; s2++) { var q = ph - s2 * .022; c1.globalAlpha = .5 * (1 - s2 / 26); var px = Math.cos(q) * rx, py = Math.sin(q) * ry; c1.fillRect(px - 1, py - 1, 2, 2); }
        c1.globalAlpha = 1; var ox = Math.cos(ph) * rx, oy = Math.sin(ph) * ry;
        c1.shadowColor = 'rgba(' + H + ',.9)'; c1.shadowBlur = 14; c1.fillRect(ox - 4, oy - 4, 8, 8); c1.shadowBlur = 0;
        var ph2 = -T1 * .55 + 2; c1.fillStyle = 'rgba(' + ink() + ',.55)'; c1.fillRect(Math.cos(ph2) * rx * .62 - 2.5, Math.sin(ph2) * ry * .62 - 2.5, 5, 5);
        c1.restore();
      } else {
        // b: points drift in from the edges and land in the button
        var br = btn.getBoundingClientRect(), cr = card.getBoundingClientRect();
        var bx = br.left - cr.left + br.width / 2, by = br.top - cr.top + br.height / 2, R = Math.hypot(w1, h1) * .7;
        for (var m = 0; m < F.length; m++) {
          var p = F[m]; p.t += dt * p.sp * (reduce ? 0 : 1); if (p.t > 1) { p.t -= 1; p.a = rr() * 6.283; p.cv = (rr() - .5) * 1.4; }
          var e = p.t * p.t * (3 - 2 * p.t), dist = R * (1 - e), ang = p.a + p.cv * (1 - e);
          var x = bx + Math.cos(ang) * dist, y = by + Math.sin(ang) * dist * .62;
          if (x < -4 || y < -4 || x > w1 + 4 || y > h1 + 4) continue;
          var near = Math.max(0, 1 - dist / 260);
          c1.fillStyle = near > .15 ? 'rgb(' + H + ')' : 'rgb(' + ink() + ')';
          c1.globalAlpha = Math.min(1, (.12 + .7 * e) * p.b) * (1 - Math.max(0, (e - .93) / .07));
          var s3 = 1 + 2 * e; c1.fillRect(x - s3 / 2, y - s3 / 2, s3, s3);
        }
        c1.globalAlpha = 1;
      }
    }
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
