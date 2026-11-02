/* Off screen (Profile): square points gather into a pixel icon of the hobby.
   Chips switch the icon (hover, focus or tap); while nobody touches them the
   icons take turns. The cursor pushes the points away on the stage.
   Without JS the chips stay as plain labels and the stage is hidden. */
(function () {
  'use strict';
  var sec = document.getElementById('off-screen');
  if (!sec) return;
  var stage = sec.querySelector('.off-stage'), cv = sec.querySelector('.off-cv');
  var chips = Array.prototype.slice.call(sec.querySelectorAll('.off-chip'));
  if (!stage || !cv || !chips.length || !cv.getContext) return;
  document.documentElement.classList.add('js-off');

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = cv.getContext('2d');
  var nEl = sec.querySelector('.off-n'), nmEl = sec.querySelector('.off-nm');

  /* ---- shapes as pixel grids ---- */
  function fromRows(rows) {
    var pts = [];
    rows.forEach(function (r, y) { for (var x = 0; x < r.length; x++) if (r[x] === '#') pts.push([x, y]); });
    return { w: rows[0].length, h: rows.length, pts: pts };
  }
  function crosshair() {
    var S = 15, c = 7, pts = [];
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = x - c, dy = y - c, d = Math.sqrt(dx * dx + dy * dy);
      var ring = d > 5.4 && d < 6.6;
      var cross = (dx === 0 || dy === 0) && Math.abs(dx + dy) >= 2 && Math.abs(dx + dy) <= 7;
      if (ring || cross || (dx === 0 && dy === 0)) pts.push([x, y]);
    }
    return { w: S, h: S, pts: pts };
  }
  function tent() {
    var W = 21, pts = [], k;
    for (var y = 0; y <= 9; y++) { pts.push([9 - y, y + 1]); if (y) pts.push([9 + y, y + 1]); }
    for (var x = 0; x < W; x++) pts.push([x, 11]);                     /* ground */
    for (k = 0; k <= 4; k++) { var o = Math.floor(k / 2) + 1; pts.push([9 - o, 6 + k]); pts.push([9 + o, 6 + k]); } /* door flaps */
    [[18, 10], [17, 9], [19, 9], [18, 8]].forEach(function (p) { pts.push(p); }); /* campfire */
    pts.push([2, 2]); pts.push([16, 1]); pts.push([20, 4]);            /* stars */
    return { w: W, h: 12, pts: pts };
  }
  var SHAPES = {
    games: fromRows([
      '..#############..',
      '.###############.',
      '####.#######.####',
      '###...#####.#.###',
      '####.#######.####',
      '#################',
      '######.....######',
      '#####.......#####',
      '.###.........###.'
    ]),
    airsoft: crosshair(),
    camping: tent()
  };
  var ORDER = chips.map(function (c) { return c.getAttribute('data-shape'); });
  var LABEL = {}; chips.forEach(function (c) { LABEL[c.getAttribute('data-shape')] = c.textContent.trim(); });

  /* ---- particles ---- */
  var N = 0; Object.keys(SHAPES).forEach(function (k) { N = Math.max(N, SHAPES[k].pts.length); });
  N += 34; /* spare points drift as dust */
  var P = [];
  var W = 0, H = 0, dpr = 1, cell = 10;
  var rnd = (function () { var s = 7; return function () { return (s = (s * 16807) % 2147483647) / 2147483647; }; })();
  for (var i = 0; i < N; i++) P.push({ x: rnd(), y: rnd(), vx: 0, vy: 0, tx: 0, ty: 0, on: false, a: 0, ta: .3, d: 0, wob: rnd() * 6.28 });

  function size() {
    var r = stage.getBoundingClientRect();
    var ow = W || r.width, oh = H || r.height;
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (P[0].x <= 1) P.forEach(function (p) { p.x *= W; p.y *= H; });            /* first layout */
    else P.forEach(function (p) { p.x *= W / ow; p.y *= H / oh; });
    if (cur) place(cur, true);
  }

  var cur = null, colors = {};
  function readColors() {
    var cs = getComputedStyle(stage);
    colors.accent = (cs.getPropertyValue('--accent') || '#83de72').trim();
    colors.dust = (cs.getPropertyValue('--label') || '#8e948a').trim();
  }

  function place(name, keep) {
    var sh = SHAPES[name]; if (!sh) return;
    cell = Math.max(6, Math.min((W - 40) / (sh.w + 2), (H - 56) / (sh.h + 1), 14));
    var ox = (W - sh.w * cell) / 2, oy = (H - 24 - sh.h * cell) / 2;
    var idx = P.map(function (_, k) { return k; });
    if (!keep) for (var k = idx.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = idx[k]; idx[k] = idx[j]; idx[j] = t; }
    idx.forEach(function (pi, n) {
      var p = P[pi];
      if (n < sh.pts.length) {
        p.on = true; p.tx = ox + (sh.pts[n][0] + .5) * cell; p.ty = oy + (sh.pts[n][1] + .5) * cell; p.ta = 1;
        p.d = keep ? 0 : Math.random() * 14;
      } else {
        p.on = false; p.tx = 10 + Math.random() * (W - 20); p.ty = 10 + Math.random() * (H - 20); p.ta = .28; p.d = 0;
      }
      if (reduce || keep) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.vx = p.vy = 0; }
      else { p.vx += (Math.random() - .5) * 6; p.vy += (Math.random() - .5) * 6; }
    });
  }

  function setShape(name) {
    if (!SHAPES[name] || name === cur) return;
    cur = name;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-shape') === name ? 'true' : 'false'); });
    var n = ORDER.indexOf(name) + 1;
    if (nEl) nEl.textContent = (n < 10 ? '0' : '') + n + ' / ' + (ORDER.length < 10 ? '0' : '') + ORDER.length;
    if (nmEl) nmEl.textContent = LABEL[name];
    place(name, false);
    if (reduce) draw();
  }

  /* ---- pointer: points step aside from the cursor ---- */
  var mx = -999, my = -999;
  cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  cv.addEventListener('pointerleave', function () { mx = my = -999; });

  function step() {
    var R = Math.max(40, cell * 4.2), R2 = R * R;
    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      if (p.d > 0) { p.d--; continue; }
      if (!p.on) { p.wob += .01; p.tx += Math.cos(p.wob) * .12; p.ty += Math.sin(p.wob * .8) * .1; }
      p.vx += (p.tx - p.x) * .055; p.vy += (p.ty - p.y) * .055;
      var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > .01) { var f = (1 - d2 / R2) * 2.4 / Math.sqrt(d2); p.vx += dx * f; p.vy += dy * f; }
      p.vx *= .78; p.vy *= .78; p.x += p.vx; p.y += p.vy;
      p.a += (p.ta - p.a) * .08;
    }
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var s = Math.max(3, cell * .66);
    ctx.fillStyle = colors.dust;
    for (var i = 0; i < P.length; i++) { var p = P[i]; if (p.on) continue; ctx.globalAlpha = p.a; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); }
    ctx.fillStyle = colors.accent;
    for (i = 0; i < P.length; i++) { p = P[i]; if (!p.on) continue; ctx.globalAlpha = Math.min(1, p.a); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s); }
    ctx.globalAlpha = 1;
  }

  /* ---- loop only while the section is on screen ---- */
  var vis = false, raf = 0;
  function frame() { raf = 0; if (!vis || reduce) return; step(); draw(); raf = requestAnimationFrame(frame); }
  function kick() { if (!raf && vis && !reduce) raf = requestAnimationFrame(frame); }

  /* ---- autoplay, paused for a while after the visitor picks a chip ---- */
  var auto = 0, pausedUntil = 0;
  function tick() {
    if (!vis || reduce || Date.now() < pausedUntil) return;
    setShape(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]);
  }
  function userPick(name) { pausedUntil = Date.now() + 9000; setShape(name); }
  chips.forEach(function (c) {
    var name = c.getAttribute('data-shape');
    c.addEventListener('mouseenter', function () { userPick(name); });
    c.addEventListener('focus', function () { userPick(name); });
    c.addEventListener('click', function () { userPick(name); });
  });
  stage.addEventListener('pointerenter', function () { pausedUntil = Date.now() + 9000; });

  readColors();
  new MutationObserver(function () { readColors(); if (reduce) draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  size();
  setShape(ORDER[0]);
  if (reduce) draw();
  window.addEventListener('resize', function () { size(); if (reduce) draw(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      vis = en[0].isIntersecting;
      if (vis) { kick(); if (!auto && !reduce) auto = setInterval(tick, 3800); }
      else if (auto) { clearInterval(auto); auto = 0; }
    }, { threshold: .15 }).observe(stage);
  } else { vis = true; kick(); }
})();
