/* Off screen (Profile): one small pixel world built from square points.
   PC games  = a monitor; inside it a game: two pines, ground, a HUD, enemies to shoot.
   Airsoft   = the monitor goes away, the game world stays where it was and grows
               into a real forest; the same crosshair hunts players at the same spots.
   Camping   = the forest and ground stay, the crosshair leaves; a tent, a campfire
               with embers and smoke, a moon and stars appear.
   Every point belongs to one element, so elements shared by two scenes never move:
   only the elements that enter or leave gather or scatter. Chips switch the scene
   (hover, focus or tap); untouched, the scenes take turns. The cursor pushes points
   aside. Without JS the stage is hidden and the chips are plain labels. */
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
  var nmEl = sec.querySelector('.off-nm');
  var GW = 64, GH = 33, GROUND = 27, FEET = 26; /* grid in cells; ground row; feet row */

  /* ---- elements (cell coordinates + point type) ---- */
  function add(pts, x, y, t) {
    if (x < 0 || x >= GW || y < 0 || y >= GH) return;
    var u = pts.u || (pts.u = {}), k = x + ',' + y; if (u[k]) return; u[k] = 1;
    pts.push({ c: [x, y], t: t });
  }
  /* pine: trunk + three-row tiers that widen downwards (saw-tooth edge),
     needle texture inside, shaded right edge */
  function pine(pts, cx, h) {
    var top = FEET - 1 - h, r, x;
    for (r = 0; r < h; r++) {
      var k = Math.floor(r / 3), w = r % 3, half = Math.floor(k * .7) + w, y = top + r;
      for (x = cx - half; x <= cx + half; x++) {
        var edge = half >= 2 && x === cx + half, tex = half >= 2 && x !== cx && (x * 3 + y * 2) % 5 === 0;
        add(pts, x, y, edge || tex ? 'dim' : 'acc');
      }
    }
    add(pts, cx, FEET, 'wood'); add(pts, cx, FEET - 1, 'wood');
  }
  function build() {
    var E = {}, x, y;
    /* game world inside the screen = the middle of the forest */
    E.treesIn = []; pine(E.treesIn, 18, 14); pine(E.treesIn, 45, 17);
    E.bush = []; [[33, FEET], [34, FEET], [35, FEET], [34, FEET - 1]].forEach(function (c) { add(E.bush, c[0], c[1], 'acc'); });
    E.groundIn = []; for (x = 12; x <= 51; x++) add(E.groundIn, x, GROUND, 'acc');
    [13, 27, 41, 49].forEach(function (x) { add(E.groundIn, x, FEET, 'dim'); });
    /* the monitor around it */
    E.frame = [];
    for (x = 11; x <= 52; x++) { add(E.frame, x, 2, 'acc'); add(E.frame, x, 29, 'acc'); add(E.frame, x, 30, x === 49 ? 'led' : 'dim'); }
    for (y = 3; y <= 28; y++) { add(E.frame, 11, y, 'acc'); add(E.frame, 52, y, 'acc'); }
    add(E.frame, 31, 31, 'dim'); add(E.frame, 32, 31, 'dim');
    for (x = 26; x <= 37; x++) add(E.frame, x, 32, 'acc');
    for (x = 41; x <= 50; x++) add(E.frame, x, 32, 'dim');            /* keyboard */
    add(E.frame, 54, 32, 'dim'); add(E.frame, 55, 32, 'dim');            /* mouse */
    E.hud = [];
    [[14, 3], [13, 4], [14, 4], [15, 4], [14, 5]].forEach(function (c) { add(E.hud, c[0], c[1], 'fg'); }); /* health */
    for (x = 17; x <= 23; x++) add(E.hud, x, 4, x < 22 ? 'acc' : 'dim');
    /* the rest of the forest */
    E.treesOut = []; E.treesOut.u = E.treesIn.u; pine(E.treesOut, 3, 21); pine(E.treesOut, 10, 12); pine(E.treesOut, 57, 18); pine(E.treesOut, 62, 10);
    E.groundOut = []; for (x = 0; x < GW; x++) if (x < 12 || x > 51) add(E.groundOut, x, GROUND, 'acc');
    [1, 6, 55, 60].forEach(function (x) { add(E.groundOut, x, FEET, 'dim'); });
    E.dirt = []; for (x = 1; x < GW; x += 3) { add(E.dirt, x, 29, 'faint'); add(E.dirt, x + 1, 31, 'faint'); }
    /* camp */
    E.tent = []; add(E.tent, 25, 19, 'dim');
    for (y = 20; y <= FEET; y++) { var hf = Math.round((y - 20) * 5 / 6); add(E.tent, 25 - hf, y, 'fg'); add(E.tent, 25 + hf, y, 'fg'); if (y >= 22) add(E.tent, 25, y, 'dim'); }
    add(E.tent, 19, FEET, 'faint'); add(E.tent, 31, FEET, 'faint');
    E.fire = [];
    [[36, 26], [37, 26], [38, 26], [39, 26], [40, 26], [36, 25], [40, 25]].forEach(function (c) { add(E.fire, c[0], c[1], 'wood'); });
    [[37, 25], [39, 25], [37, 24], [39, 24], [37, 23], [39, 23], [37, 22], [39, 22], [38, 21], [38, 20]].forEach(function (c) { add(E.fire, c[0], c[1], 'fire'); });
    [[38, 25], [38, 24], [38, 23], [38, 22]].forEach(function (c) { add(E.fire, c[0], c[1], 'core'); });
    E.moon = []; [[50, 2], [51, 2], [52, 2], [49, 3], [50, 3], [49, 4], [49, 5], [50, 5], [50, 6], [51, 6], [52, 6]].forEach(function (c) { add(E.moon, c[0], c[1], 'fg'); });
    E.stars = []; E.stars.u = {}; Object.keys(E.treesIn.u).forEach(function (k) { E.stars.u[k] = 1; }); Object.keys(E.moon.u).forEach(function (k) { E.stars.u[k] = 1; }); var s = 7;
    for (var n = 0; n < 60 && E.stars.length < 22; n++) {
      s = (s * 16807) % 2147483647; var sx = s % GW; s = (s * 16807) % 2147483647; var sy = 1 + s % 12;
      add(E.stars, sx, sy, 'star');
    }
    return E;
  }
  var EL = build();
  var SPOTS = [23, 30, 37]; /* where enemies / players stand, same in both shooting scenes */
  var MAN = [[0, -7], [0, -6], [-1, -5], [0, -5], [1, -5], [-1, -4], [0, -4], [1, -4], [2, -4], [3, -4], [-1, -3], [0, -3], [1, -3], [-1, -2], [1, -2], [-1, -1], [1, -1], [-1, 0], [1, 0]];

  var STATES = {
    games:   { els: ['frame', 'hud', 'treesIn', 'bush', 'groundIn'], dim: { treesIn: .42, bush: .42, groundIn: .6 }, aim: true },
    airsoft: { els: ['treesIn', 'bush', 'groundIn', 'treesOut', 'groundOut', 'dirt'], dim: {}, aim: true },
    camping: { els: ['treesIn', 'bush', 'groundIn', 'treesOut', 'groundOut', 'dirt', 'tent', 'fire', 'moon', 'stars'], dim: {}, aim: false }
  };
  var ORDER = chips.map(function (c) { return c.getAttribute('data-shape'); });
  var LABEL = {}; chips.forEach(function (c) { LABEL[c.getAttribute('data-shape')] = c.textContent.trim(); });
  var ALPHA = { acc: .95, dim: .5, faint: .26, fg: .9, wood: .9, fire: 1, core: 1, star: .75, led: 1 };

  /* ---- points: one per element cell, fixed for life ---- */
  var P = [], D = [], fx = [];
  var W = 0, H = 0, dpr = 1, cell = 6, ox = 0, oy = 0;
  Object.keys(EL).forEach(function (name) {
    EL[name].forEach(function (q) { P.push({ el: name, c: q.c, t: q.t, x: -99, y: -99, vx: 0, vy: 0, a: 0, ta: 0, on: false, d: 0, ph: Math.random() * 6.28 }); });
  });
  for (var i = 0; i < 30; i++) D.push({ x: 0, y: 0, wob: Math.random() * 6.28, a: .2 + Math.random() * .2 });

  function gx(c) { return ox + (c + .5) * cell; }
  function gy(r) { return oy + (r + .5) * cell; }

  function size() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cell = Math.max(3, Math.min((W - 24) / GW, (H - 36) / GH));
    ox = (W - GW * cell) / 2; oy = (H - 28 - GH * cell) / 2 + 4;
    D.forEach(function (d) { d.x = Math.random() * W; d.y = Math.random() * H; });
    P.forEach(function (p) { if (p.on) { p.x = gx(p.c[0]); p.y = gy(p.c[1]); } });
  }

  var colors = {};
  function readColors() {
    var cs = getComputedStyle(stage), light = document.documentElement.getAttribute('data-theme') === 'light';
    colors.acc = (cs.getPropertyValue('--accent') || '#83de72').trim();
    colors.dust = (cs.getPropertyValue('--label') || '#8e948a').trim();
    colors.fg = (cs.getPropertyValue('--fg') || '#f0f2ea').trim();
    colors.aim = light ? colors.fg : (cs.getPropertyValue('--lime') || '#b8f24a').trim();
    colors.fire = light ? '#e0782f' : '#f2a03d';
    colors.core = light ? '#f0b02c' : '#ffd66b';
    colors.wood = light ? '#8a5a32' : '#b07a48';
    colors.smoke = colors.dust;
  }
  function colorOf(t) { return t === 'fg' || t === 'star' ? colors.fg : t === 'led' ? colors.aim : t === 'fire' || t === 'core' || t === 'wood' ? colors[t] : colors.acc; }

  /* ---- scene switch: shared elements keep their place, the rest gather / scatter ---- */
  var cur = null;
  function apply(snap) {
    var st = STATES[cur];
    P.forEach(function (p) {
      var on = st.els.indexOf(p.el) >= 0;
      p.ta = on ? ALPHA[p.t] * (st.dim[p.el] || 1) : 0;
      if (on && !p.on) {
        /* entering: start near home, scattered, and gather */
        var an = Math.random() * 6.28, rr = cell * (4 + Math.random() * 10);
        p.x = gx(p.c[0]) + Math.cos(an) * rr; p.y = gy(p.c[1]) + Math.sin(an) * rr; p.a = 0;
        p.vx = p.vy = 0; p.d = snap ? 0 : Math.floor(Math.random() * 14);
      } else if (!on && p.on) {
        /* leaving: drift outward while fading */
        var bn = Math.random() * 6.28, sp = 1.5 + Math.random() * 3;
        p.vx = Math.cos(bn) * sp; p.vy = Math.sin(bn) * sp - 1; p.d = 0;
      }
      p.on = on;
      if (snap && on) { p.x = gx(p.c[0]); p.y = gy(p.c[1]); p.a = p.ta; p.vx = p.vy = 0; }
    });
  }

  /* ---- crosshair, enemies / players, ammo ---- */
  var aim = { x: 0, y: 0, a: 0, flash: 0 }, foe = null, wait = 30, ammo = 6, hudA = 0, last = -1;
  function newFoe() {
    var k; do { k = Math.floor(Math.random() * SPOTS.length); } while (k === last && SPOTS.length > 1);
    last = k; foe = { s: SPOTS[k], up: 0, hit: false, hold: 0 };
  }
  function shoot() {
    foe.hit = true; aim.flash = 1;
    MAN.forEach(function (m) {
      var x = gx(foe.s + m[0]), y = gy(FEET + m[1]), an = Math.atan2(m[1] + 3.5, m[0]) + (Math.random() - .5), sp = 1 + Math.random() * 2.4;
      fx.push({ x: x, y: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - .6, a: 1, g: .08, k: 'hit', s: cell * .55 });
    });
    if (cur === 'games') ammo = Math.max(0, ammo - 1);
  }

  function setState(name) {
    if (!STATES[name] || name === cur) return;
    var first = cur === null;
    cur = name;
    chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-shape') === name ? 'true' : 'false'); });
    if (nmEl) nmEl.textContent = LABEL[name];
    apply(first || reduce);
    if (!STATES[name].aim) { if (foe && !foe.hit) foe.hit = true; }
    else if (aim.a < .05) { aim.x = gx(31.5); aim.y = gy(14); wait = 30; }
    if (reduce) { aim.a = STATES[name].aim ? 1 : 0; hudA = name === 'games' ? 1 : 0; foe = STATES[name].aim ? { s: SPOTS[1], up: 1, hit: false } : null; aim.x = gx(SPOTS[1]); aim.y = gy(FEET - 4); draw(0); }
  }

  /* ---- pointer: points step aside ---- */
  var mx = -999, my = -999;
  cv.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  cv.addEventListener('pointerleave', function () { mx = my = -999; });

  var tFire = 0;
  function step() {
    var R = Math.max(30, cell * 6), R2 = R * R, i, p;
    for (i = 0; i < P.length; i++) {
      p = P[i];
      if (p.d > 0) { p.d--; continue; }
      if (p.on) {
        p.vx += (gx(p.c[0]) - p.x) * .06; p.vy += (gy(p.c[1]) - p.y) * .06;
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > .01) { var f = (1 - d2 / R2) * 2.2 / Math.sqrt(d2); p.vx += dx * f; p.vy += dy * f; }
        p.vx *= .78; p.vy *= .78;
      } else if (p.a > .01) { p.vx *= .95; p.vy *= .95; }
      else continue;
      p.x += p.vx; p.y += p.vy;
      p.a += (p.ta - p.a) * (p.on ? .07 : .06);
    }
    for (i = 0; i < D.length; i++) { var d = D[i]; d.wob += .008; d.x += Math.cos(d.wob) * .15; d.y += Math.sin(d.wob * .8) * .12; }

    var st = STATES[cur];
    hudA += ((cur === 'games' ? 1 : 0) - hudA) * .08;
    aim.a += ((st.aim ? 1 : 0) - aim.a) * .08;
    if (st.aim) {
      if (!foe) { if (--wait <= 0) newFoe(); }
      else if (!foe.hit) {
        foe.up += (1 - foe.up) * .14;
        var tx = gx(foe.s), ty = gy(FEET - 4);
        aim.x += (tx - aim.x) * .07; aim.y += (ty - aim.y) * .07;
        if (foe.up > .97 && Math.abs(tx - aim.x) < 1.2 && Math.abs(ty - aim.y) < 1.2 && ++foe.hold > 6) shoot();
      }
    }
    if (foe && foe.hit) { foe.up -= .2; if (foe.up <= 0) { foe = null; wait = 20 + Math.random() * 26; if (ammo === 0) { ammo = -1; setTimeout(function () { ammo = 6; }, 900); } } }
    aim.flash *= .85;

    /* campfire: embers and smoke */
    var fireA = 0; for (i = 0; i < P.length; i++) if (P[i].el === 'fire' && P[i].t === 'core') { fireA = P[i].a; break; }
    if (fireA > .5 && ++tFire % 5 === 0) {
      if (Math.random() < .55) fx.push({ x: gx(38) + (Math.random() - .5) * cell * 2, y: gy(21), vx: (Math.random() - .5) * .5, vy: -.5 - Math.random() * .6, a: 1, g: 0, k: 'ember', s: Math.max(1.5, cell * .3) });
      if (tFire % 15 === 0) fx.push({ x: gx(38), y: gy(20), vx: .12 + Math.random() * .15, vy: -.35, a: .35, g: 0, k: 'smoke', s: cell * .55 });
    }
    for (i = fx.length - 1; i >= 0; i--) {
      var e = fx[i]; e.x += e.vx; e.y += e.vy; e.vy += e.g;
      if (e.k === 'hit') { e.vx *= .93; e.vy *= .93; e.a -= .03; }
      else if (e.k === 'ember') { e.vx += (Math.random() - .5) * .12; e.a -= .018; }
      else { e.s += .03; e.a -= .004; }
      if (e.a <= 0) fx.splice(i, 1);
    }
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var sz = Math.max(2.4, cell * .74), i, p, last = '';
    ctx.fillStyle = colors.dust;
    for (i = 0; i < D.length; i++) { ctx.globalAlpha = D[i].a; ctx.fillRect(D[i].x - 1, D[i].y - 1, 2, 2); }
    /* smoke behind everything */
    ctx.fillStyle = colors.smoke;
    for (i = 0; i < fx.length; i++) if (fx[i].k === 'smoke') { ctx.globalAlpha = Math.max(0, fx[i].a); ctx.fillRect(fx[i].x - fx[i].s / 2, fx[i].y - fx[i].s / 2, fx[i].s, fx[i].s); }
    for (i = 0; i < P.length; i++) {
      p = P[i]; if (p.a < .01) continue;
      var a = p.a, s = sz;
      if (!reduce) {
        if (p.t === 'star') a *= .5 + .5 * Math.sin(t / 650 + p.ph * 3);
        else if (p.t === 'fire') { a *= .55 + .45 * Math.sin(t / 80 + p.ph * 5); }
        else if (p.t === 'core') a *= .8 + .2 * Math.sin(t / 60 + p.ph * 5);
        else if (p.t === 'led') a *= .6 + .4 * Math.sin(t / 500);
      }
      if (p.t === 'star') s = Math.max(1.5, sz * .45);
      var col = colorOf(p.t); if (col !== last) { ctx.fillStyle = col; last = col; }
      ctx.globalAlpha = Math.min(1, a); ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    /* enemy / player rising from behind the ground */
    if (foe && foe.up > .02) {
      ctx.fillStyle = colors.fg; ctx.globalAlpha = aim.a * (foe.hit ? .9 : 1);
      var off = (1 - foe.up) * 8;
      MAN.forEach(function (m) {
        var r = FEET + m[1] + off; if (r > FEET + .2) return;
        ctx.fillRect(gx(foe.s + m[0]) - sz / 2, gy(r) - sz / 2, sz, sz);
      });
    }
    /* ammo in the game HUD */
    if (hudA > .02 && ammo >= 0) {
      ctx.fillStyle = colors.fg;
      for (i = 0; i < 6; i++) { ctx.globalAlpha = hudA * (i < ammo ? .9 : .18); ctx.fillRect(gx(44 + i) - sz / 2, gy(4) - sz / 2, sz * .7, sz); }
    }
    /* hit sparks + embers */
    for (i = 0; i < fx.length; i++) {
      var e = fx[i]; if (e.k === 'smoke') continue;
      ctx.fillStyle = e.k === 'ember' ? colors.core : colors.aim; ctx.globalAlpha = Math.max(0, e.a);
      ctx.fillRect(e.x - e.s / 2, e.y - e.s / 2, e.s, e.s);
    }
    /* crosshair: four ticks around a gap and a centre point */
    if (aim.a > .02) {
      var u = cell * 1.4, g = u * (1.1 + aim.flash * .8), L = u * 1.5, w = Math.max(2, cell * .4), x = aim.x, y = aim.y;
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
      if (vis) { kick(); if (!auto && !reduce) auto = setInterval(tick, 6000); }
      else if (auto) { clearInterval(auto); auto = 0; }
    }, { threshold: .15 }).observe(stage);
  } else { vis = true; kick(); }
})();
