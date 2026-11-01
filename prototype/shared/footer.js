/* Contact footer: points drift in from the edges of the section and land in the
   "Start a conversation" button, turning lime as they get close. */
(function () {
  'use strict';
  var root = document.documentElement;
  var card = document.querySelector('.contact'), btn = card && card.querySelector('.contact-btn');
  if (!card || !btn) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.createElement('canvas'); cv.className = 'ct-fx'; cv.setAttribute('aria-hidden', 'true');
  card.prepend(cv);
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, vis = false, last = performance.now();
  function light() { return root.getAttribute('data-theme') === 'light'; }
  function size() { var r = card.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  size(); addEventListener('resize', size);
  var sd = 3; function rnd() { return (sd = (sd * 16807) % 2147483647) / 2147483647; }
  var F = []; for (var k = 0; k < 90; k++) F.push({ t: rnd(), sp: .10 + rnd() * .12, a: rnd() * 6.283, cv: (rnd() - .5) * 1.4, b: .5 + rnd() * .5 });
  function frame(now) {
    if (!vis) return;
    if (!reduce) requestAnimationFrame(frame);
    var dt = Math.min(.05, (now - last) / 1000); last = now;
    var m = window.ltMode ? window.ltMode(card) : (light() ? 'light' : 'dark');
    var hz = m === 'dark' ? '184,242,74' : m === 'atlas' ? '47,125,34' : '78,168,50', ink = m === 'dark' ? '240,242,234' : m === 'atlas' ? '28,29,24' : '111,117,104';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var br = btn.getBoundingClientRect(), cr = card.getBoundingClientRect();
    var bx = br.left - cr.left + br.width / 2, by = br.top - cr.top + br.height / 2, R = Math.hypot(W, H) * .7;
    for (var i = 0; i < F.length; i++) {
      var p = F[i]; p.t += dt * p.sp; if (p.t > 1) { p.t -= 1; p.a = rnd() * 6.283; p.cv = (rnd() - .5) * 1.4; }
      var e = p.t * p.t * (3 - 2 * p.t), dist = R * (1 - e), ang = p.a + p.cv * (1 - e);
      var x = bx + Math.cos(ang) * dist, y = by + Math.sin(ang) * dist * .62;
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      ctx.fillStyle = 'rgb(' + (dist < 220 ? hz : ink) + ')';
      ctx.globalAlpha = Math.min(1, (.12 + .7 * e) * p.b) * (1 - Math.max(0, (e - .93) / .07));
      var s = 1 + 2 * e; ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { last = performance.now(); requestAnimationFrame(frame); } }).observe(card);
  new MutationObserver(function () { if (reduce && vis) frame(performance.now()); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
})();
