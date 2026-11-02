/* Off screen (Profile): one small pixel scene built from square points.
   PC games  = a screen frame, a crosshair and shots at targets inside it.
   Airsoft   = no frame, pine trees, the same crosshair hunting targets between them.
   Camping   = the trees stay, the crosshair leaves, a campfire is lit.
   Points gather or scatter as layers come and go. Chips switch the state
   (hover, focus or tap); untouched, the states take turns. The cursor pushes
   points aside. Without JS the stage is hidden and the chips are plain labels. */
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
  var GW = 40, GH = 20; /* scene grid in cells */

  /* ---- layers (cell coordinates) ---- */
  function frameLayer() {
    var pts = [], x, y;
    for (x = 8; x <= 31; x++) { pts.push([x, 2]); pts.push([x, 15]); }
    for (y = 3; y <= 14; y++) { pts.push([8, y]); pts.push([31, y]); }
    pts.push([19, 16]); pts.push([20, 16]);
    for (x = 16; x <= 23; x++) pts.push([x, 17]);
    return pts;
  }
  function tree(pts, cx, base, h) {
    pts.push([cx, base]); pts.push([cx, base - 1]);              /* trunk */
    for (var r = 0; r < h; r++) {                                  /* canopy, top down */
      var y = base - 2 - (h - 1) + r, half = Math.floor((r % 4) / 1.5) + Math.floor(r / 4); /* tiers */
      for (var x = cx - half; x <= cx + half; x++) pts.push([x, y]);
    }
  }
  function forestLayer() {
    var pts = [];
    tree(pts, 4, 17, 10); tree(pts, 11, 17, 6); tree(pts, 28, 17, 7); tree(pts, 35, 17, 11);
    for (var x = 0; x < GW; x += 2) pts.push([x, 18]);            /* ground */
    return pts;
  }
  var LAYERS = { frame: frameLayer(), forest: forestLayer(), fire: [[20, 17], [19, 17], [21, 17], [20, 16], [20, 15], [19, 18], [21, 18]] };
  var STATES = {
    games:   { layers: ['frame'], aim: { x0: 11, x1: 28, y0: 4, y1: 13 } },
    airsoft: { layers: ['forest'], aim: { x0: 6, x1: 33, y0: 5, y1: 15 }, spots: [8, 9, 16, 18, 20, 22, 24, 31, 32] },
    camping: { layers: ['forest', 'fire'], aim: null }
  };
  var ORDER = chips.map(function (c) { return c.getAttribute('data-shape'); });
  var LABEL = {}; chips.forEach(function (c) { LABEL[c.getAttribute('data-shape')] = c.textContent.trim(); });

  /* ---- particles ---- */
  var N = Math.max(LAYERS.frame.length, LAYERS.forest.length + LAYERS.fire.length) + 36;
  var P = [], sparks = [];
  var W = 0, H = 0, dpr = 1, cell = 8, ox = 0, oy = 0;
  var seed = 11; function rnd() { return (seed = (seed * 16807) % 2147483647) / 2147483647; }
  for (var i = 0; i < N; i++) P.push({ x: -1, y: -1, vx: 0, vy: 0, tx: 0, ty: 0, on: false, fire: false, a: 0, ta: .25, d: 0, wob: rnd() * 6.28 });

  function gx(c) { return ox + (c + .5) * cell; }
  function gy(r) { return oy + (r + .5) * cell; }

  function size() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cell = Math.max(5, Math.min((W - 28) / GW, (H - 34) / GH));
    ox = (W - GW * cell) / 2; oy = (H - 26 - GH * cell) / 2 + 2;
    P.forEach(function (p) { if (p.x < 0) { p.x = rnd() * W; p.y = rnd() * H; } });
    if (cur) place(true);
  }

  var colors = {};
  function readColors() {
    var cs = getComputedStyle(stage), light = document.documentElement.getAttribute('data-theme') === 'light';
    colors.accent = (cs.getPropertyValue('--accent') || '#83de72').trim();
    colors.dust = (cs.getPropertyValue('--label') || '#8e948a').trim();
    colors.fg = (cs.getPropertyValue('--fg') || '#f0f2ea').trim();
    colors.aim = light ? colors.fg : (cs.getPropertyValue('--lime') || '#b8f24a').trim();
    colors.fire = light ? '#e0782f' : '#f2a03d';
  }

  /* ---- state ---- */
  var cur = null;
  function place(keep) {
    var st = STATES[cur], pts = [];
    st.layers.forEach(function (l) { LAYERS[l].forEach(function (c) { pts.push({ c: c, fire: l === 'fire' }); }); });
    var idx = P.map(function (_, k) { return k; });
    if (!keep) for (var k = idx.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = idx[k]; idx[k] = idx[j]; idx[j] = t; }
    idx.forEach(function (pi, n) {
      var p = P[pi];
      if (n < pts.length) { p.on = true; p.fire = pts[n].fire; p.tx = gx(pts[n].c[0]); p.ty = gy(pts[n].c[1]); p.ta = pts[n].fire ? 1 : .85; p.d = keep ? 0 : Math.random() * 16; }
      else { p.on = false; p.fire = false; p.tx = 8 + Math.random() * (W - 16); p.ty = 8 + Math.random() * (H - 16); p.ta = .25; p.d = 0; }
      if (reduce || keep) { p.x = p.tx; p.y = p.ty; p.a = p.ta; p.vx = p.vy = 0; }
      else { p.vx += (Math.random() - .5) * 5; p.vy += (Math.random() - .5) * 5; }
    });
  }

  /* ---- crosshair + targets ---- */
  var aim = { x: 0, y: 0, a: 0, flash: 0 }, target = null, wait = 30;
  function newTarget() {
    var st = STATES[cur]; if (!st.aim) { target = null; return; }
    var r = st.aim, cx = st.spots ? st.spots[Math.floor(Math.random() * st.spots.length)] : r.x0 + Math.floor(Math.random() * (r.x1 - r.x0));
    var cy = r.y0 + Math.floor(Math.random() * (r.y1 - r.y0));
    target = { c: cx, r: cy, a: 0, hit: false };
  }
  function burst(x, y) {
    for (var k = 0; k < 14; k++) { var an = Math.random() * 6.28, sp = 1 + Math.random() * 2.6; sparks.push({ x: x, y: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, a: 1 }); }
  }

  function setState(name) {
    if (!STATES[name] || name === cur) return;
    cur = name;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-shape') === name ? 'true' : 'false'); });
    var n = ORDER.indexOf(name) + 1;
    if (nEl) nEl.textContent = '0' + n + ' / 0' + ORDER.length;
    if (nmEl) nmEl.textContent = LABEL[name];
    place(false);
    target = null; wait = 26;
    if (STATES[name].aim && !aim.a) { aim.x = W / 2; aim.y = H / 2; }
    if (reduce) { aim.a = STATES[name].aim ? 1 : 0; aim.x = W / 2; aim.y = gy(9); draw(0); }
  }

  /* ---- pointer: points step aside ---- */
  var mx = -999, my = -999;
  cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  cv.addEventListener('pointerleave', function () { mx = my = -999; });

  function step() {
    var R = Math.max(36, cell * 5), R2 = R * R, i, p;
    for (i = 0; i < P.length; i++) {
      p = P[i];
      if (p.d > 0) { p.d--; continue; }
      if (!p.on) { p.wob += .01; p.tx += Math.cos(p.wob) * .12; p.ty += Math.sin(p.wob * .8) * .1; }
      p.vx += (p.tx - p.x) * .055; p.vy += (p.ty - p.y) * .055;
      var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > .01) { var f = (1 - d2 / R2) * 2.4 / Math.sqrt(d2); p.vx += dx * f; p.vy += dy * f; }
      p.vx *= .78; p.vy *= .78; p.x += p.vx; p.y += p.vy;
      p.a += (p.ta - p.a) * .08;
    }
    /* crosshair: fade in/out with the state, glide to the target, shoot */
    var hasAim = !!STATES[cur].aim;
    aim.a += ((hasAim ? 1 : 0) - aim.a) * .08;
    if (hasAim) {
      if (!target) { if (--wait <= 0) newTarget(); }
      else {
        var tx = gx(target.c), ty = gy(target.r);
        target.a += ((target.hit ? 0 : 1) - target.a) * .12;
        if (!target.hit) {
          aim.x += (tx - aim.x) * .07; aim.y += (ty - aim.y) * .07;
          if (Math.abs(tx - aim.x) < 1.2 && Math.abs(ty - aim.y) < 1.2 && target.a > .9) { target.hit = true; aim.flash = 1; burst(tx, ty); }
        } else if (target.a < .05) { target = null; wait = 18 + Math.random() * 22; }
      }
    }
    aim.flash *= .86;
    for (i = sparks.length - 1; i >= 0; i--) { var s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vx *= .9; s.vy *= .9; s.a -= .04; if (s.a <= 0) sparks.splice(i, 1); }
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var sz = Math.max(3, cell * .62), i, p;
    ctx.fillStyle = colors.dust;
    for (i = 0; i < P.length; i++) { p = P[i]; if (p.on) continue; ctx.globalAlpha = p.a; ctx.fillRect(p.x - 1, p.y - 1, 2, 2); }
    ctx.fillStyle = colors.accent;
    for (i = 0; i < P.length; i++) { p = P[i]; if (!p.on || p.fire) continue; ctx.globalAlpha = Math.min(1, p.a); ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz); }
    ctx.fillStyle = colors.fire;
    for (i = 0; i < P.length; i++) { p = P[i]; if (!p.fire) continue; ctx.globalAlpha = Math.min(1, p.a) * (reduce ? 1 : .7 + .3 * Math.sin(t / 90 + i * 1.7)); ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz); }
    /* target */
    if (target && target.a > .02) {
      ctx.globalAlpha = target.a; ctx.fillStyle = colors.fg;
      var ts = sz * 1.5; ctx.fillRect(gx(target.c) - ts / 2, gy(target.r) - ts / 2, ts, ts);
    }
    /* sparks */
    ctx.fillStyle = colors.aim;
    for (i = 0; i < sparks.length; i++) { ctx.globalAlpha = Math.max(0, sparks[i].a); ctx.fillRect(sparks[i].x - 1.5, sparks[i].y - 1.5, 3, 3); }
    /* crosshair: four ticks around a gap, plus a pixel ring of corners */
    if (aim.a > .02) {
      var g = cell * (1.3 + aim.flash * .8), L = cell * 1.6, w = Math.max(2, cell * .34), x = aim.x, y = aim.y;
      ctx.globalAlpha = aim.a; ctx.fillStyle = colors.aim;
      ctx.fillRect(x - w / 2, y - g - L, w, L); ctx.fillRect(x - w / 2, y + g, w, L);
      ctx.fillRect(x - g - L, y - w / 2, L, w); ctx.fillRect(x + g, y - w / 2, L, w);
      ctx.fillRect(x - w / 2, y - w / 2, w, w);
      if (aim.flash > .05) { ctx.globalAlpha = aim.a * aim.flash; var q = g * .9; ctx.fillRect(x - q - w, y - q - w, w, w); ctx.fillRect(x + q, y - q - w, w, w); ctx.fillRect(x - q - w, y + q, w, w); ctx.fillRect(x + q, y + q, w, w); }
    }
    ctx.globalAlpha = 1;
  }

  /* ---- loop only while visible ---- */
  var vis = false, raf = 0;
  function frame(t) { raf = 0; if (!vis || reduce) return; step(); draw(t); raf = requestAnimationFrame(frame); }
  function kick() { if (!raf && vis && !reduce) raf = requestAnimationFrame(frame); }

  /* ---- autoplay, paused after the visitor picks ---- */
  var auto = 0, pausedUntil = 0;
  function tick() { if (!vis || reduce || Date.now() < pausedUntil) return; setState(ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]); }
  function userPick(name) { pausedUntil = Date.now() + 10000; setState(name); }
  chips.forEach(function (c) {
    var name = c.getAttribute('data-shape');
    c.addEventListener('mouseenter', function () { userPick(name); });
    c.addEventListener('focus', function () { userPick(name); });
    c.addEventListener('click', function () { userPick(name); });
  });
  stage.addEventListener('pointerenter', function () { pausedUntil = Date.now() + 10000; });

  readColors();
  new MutationObserver(function () { readColors(); if (reduce) draw(0); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  size();
  setState(ORDER[0]);
  window.addEventListener('resize', function () { size(); if (reduce) draw(0); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      vis = en[0].isIntersecting;
      if (vis) { kick(); if (!auto && !reduce) auto = setInterval(tick, 5200); }
      else if (auto) { clearInterval(auto); auto = 0; }
    }, { threshold: .15 }).observe(stage);
  } else { vis = true; kick(); }
})();
