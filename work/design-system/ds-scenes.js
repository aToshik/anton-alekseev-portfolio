/* Design System for AI case: drives the live scenes in ds-scenes.css.
   Each scene runs only while it is on screen; with reduced motion every
   scene shows its final, complete state. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* visibility gate: await gate(el) resolves once el is on screen */
  var seen = new Map(), waiters = new Map();
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      seen.set(en.target, en.isIntersecting);
      en.target.classList.toggle('ds-live', en.isIntersecting);
      if (en.isIntersecting && waiters.has(en.target)) { waiters.get(en.target).forEach(function (f) { f(); }); waiters.delete(en.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }) : null;
  function watch(el) { if (io) io.observe(el); else { seen.set(el, true); el.classList.add('ds-live'); } }
  function gate(el) {
    if (seen.get(el)) return Promise.resolve();
    return new Promise(function (r) { if (!waiters.has(el)) waiters.set(el, []); waiters.get(el).push(r); });
  }
  function center(el, root) {
    var a = el.getBoundingClientRect(), b = root.getBoundingClientRect();
    return { x: a.left - b.left + a.width / 2, y: a.top - b.top + a.height / 2 };
  }

  /* ---- workflow pipeline: a packet walks the nodes, waits for the designer ---- */
  var PLANS = {
    maintain: [
      { label: 'reading ~1,050 tokens', hold: 1100 },
      { label: 'diffing against the baseline', hold: 1100 },
      { label: '33 changes · 7 critical', hold: 1300 },
      { label: 'waiting for my review', hold: 1700, wait: 'approved' },
      { label: 'tokens, docs and Figma updated', hold: 1500, outs: true }
    ],
    build: [
      { label: 'specs and tokens in context', hold: 1100 },
      { label: 'agent reads both contracts', hold: 1100 },
      { label: 'data missing · questions sent back', hold: 1300 },
      { label: 'answering the questions', hold: 1500, wait: 'answered' },
      { label: 'format updated', hold: 1300, back: true }
    ]
  };
  async function runLane(lane) {
    var plan = PLANS[lane.getAttribute('data-lane')];
    var nodes = [].slice.call(lane.querySelectorAll('.ds-n'));
    var tiles = nodes.map(function (n) { return n.querySelector('.ds-tile'); });
    var outs = [].slice.call(lane.querySelectorAll('.ds-out'));
    var pkt = lane.querySelector('.ds-pkt'), fill = lane.querySelector('.ds-fill');
    var tag = lane.querySelector('.ds-tag'), tagText = tag.querySelector('span');
    var ret = lane.querySelector('.ds-ret');
    var start;
    /* the packet slides along the connector behind the tiles; the line lights up behind it */
    function move(p, dur) {
      var t = dur ? 'transform ' + dur + 'ms cubic-bezier(.6,0,.3,1), opacity .3s' : '';
      pkt.style.transition = t; pkt.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      tag.style.transition = t; tag.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
      if (!fill) return;
      fill.style.transition = dur ? 'width ' + dur + 'ms cubic-bezier(.6,0,.3,1), height ' + dur + 'ms cubic-bezier(.6,0,.3,1)' : 'none';
      var vertical = start.x === center(tiles[tiles.length - 1], lane).x;
      fill.style.left = start.x + 'px'; fill.style.top = start.y + 'px';
      if (vertical) { fill.style.width = '1px'; fill.style.height = Math.max(0, p.y - start.y) + 'px'; }
      else { fill.style.height = '1px'; fill.style.width = Math.max(0, p.x - start.x) + 'px'; }
    }
    function say(t) { tagText.textContent = t; tag.classList.toggle('show', !!t); }
    function clear() { nodes.forEach(function (n) { n.classList.remove('on'); }); }
    for (;;) {
      await gate(lane);
      nodes.forEach(function (n) { n.classList.remove('on', 'wait', 'approved'); });
      outs.forEach(function (o) { o.classList.remove('on'); });
      start = center(tiles[0], lane);
      pkt.style.opacity = 0; move(start, 0); void pkt.offsetWidth;
      pkt.style.opacity = 1;
      for (var i = 0; i < nodes.length; i++) {
        await gate(lane);
        move(center(tiles[i], lane), i ? 700 : 0);
        await sleep(i ? 700 : 300);
        var step = plan[i];
        clear(); nodes[i].classList.add('on');
        say(step.label);
        if (step.wait) {
          nodes[i].classList.add('wait'); await sleep(step.hold);
          nodes[i].classList.remove('wait'); nodes[i].classList.add('approved');
          say(step.wait); await sleep(800);
          continue;
        }
        if (step.outs) { for (var k = 0; k < outs.length; k++) { await sleep(320); outs[k].classList.add('on'); } }
        await sleep(step.hold);
      }
      if (plan[plan.length - 1].back && ret && ret.offsetParent) {
        lane.classList.add('returning'); say('better specs');
        await sleep(1600);
        lane.classList.remove('returning');
        clear(); nodes[0].classList.add('on'); await sleep(800);
      }
      pkt.style.opacity = 0; say(''); await sleep(500);
      clear(); move(start, 0); await sleep(500);
    }
  }
  [].slice.call(document.querySelectorAll('.ds-lane')).forEach(function (lane, i) {
    watch(lane);
    if (reduce) { var p = lane.querySelector('.ds-pkt'); if (p) p.hidden = true; lane.querySelector('.ds-tag').hidden = true; lane.querySelectorAll('.ds-out').forEach(function (o) { o.classList.add('on'); }); return; }
    setTimeout(function () { runLane(lane); }, i * 1800);
  });

  /* ---- Insight: 15 questions sort into categories, each category became part of the doc ---- */
  var sortEl = document.querySelector('.ds-sort');
  if (sortEl) {
    var CATS = [
      { n: 8, name: 'Behavior edge cases', to: 'States + Behavior sections', qs: ['Sort cycle: asc, desc, off?', 'Which columns can be dragged?', 'Loading: skeleton or spinner?', 'Empty table: what shows?', 'Can a pinned column move?', 'Minimum column width?', 'Error state for a row?', 'Sticky header on scroll?'] },
      { n: 2, name: 'Component vs consumer', to: 'Consumer contract section', qs: ['Who sorts the data?', 'Who writes the empty copy?'] },
      { n: 2, name: 'Accessibility strings', to: 'Default aria-label strings', qs: ['aria-label for sort?', 'Screen reader text for drag?'] },
      { n: 3, name: 'Tokens, sizes, authority', to: 'Token Mapping + Source column', qs: ['Row height token?', 'Figma or spec: which wins?', 'Hover token missing?'] }
    ];
    var inner = sortEl.querySelector('.ds-sort-in');
    var cards = [], chips = [];
    CATS.forEach(function (c, ci) {
      var card = document.createElement('div'); card.className = 'ds-cat';
      card.innerHTML = '<div class="hd"><b>' + c.n + '</b><span>' + c.name + '</span></div><div class="ft"><em>Became</em>' + c.to + '</div>';
      inner.appendChild(card); cards.push(card);
      c.qs.forEach(function (q) { var el = document.createElement('div'); el.className = 'ds-q'; el.textContent = q; el.setAttribute('data-c', ci); inner.appendChild(el); chips.push(el); });
    });
    var rnd = function (i) { var x = Math.sin(i * 91.7 + 3.1) * 43758.5453; return x - Math.floor(x); };
    var HEAD = 52, ROW = 32, FOOT = 50, PAD = 10, GROUP = 12;
    var layout = function (sorted) {
      var W = inner.clientWidth;
      var columns = W < 440 ? [[0, 1, 2, 3]] : W < 700 ? [[0], [1, 2, 3]] : [[0], [1], [2], [3]];
      var gap = 10, cw = (W - gap * (columns.length - 1)) / columns.length;
      var pos = {}, colH = [];
      columns.forEach(function (cats, col) {
        var y = 0;
        cats.forEach(function (ci, j) {
          if (j) y += GROUP;
          var h = HEAD + CATS[ci].qs.length * ROW + FOOT;
          pos[ci] = { x: col * (cw + gap), y: y, h: h };
          y += h;
        });
        colH.push(y);
      });
      /* equal-height cards when every category has its own column */
      if (columns.length === 4) { var mh = Math.max.apply(null, colH); CATS.forEach(function (c, ci) { pos[ci].h = mh; }); }
      var H = Math.max.apply(null, colH);
      sortEl.style.height = (H + 18 + 52) + 'px';
      sortEl.classList.toggle('sorted', sorted);
      cards.forEach(function (card, ci) {
        card.style.transform = 'translate(' + pos[ci].x + 'px,' + pos[ci].y + 'px)';
        card.style.width = cw + 'px'; card.style.height = pos[ci].h + 'px';
      });
      var count = [0, 0, 0, 0];
      chips.forEach(function (el, i) {
        var ci = +el.getAttribute('data-c');
        if (sorted) {
          var k = count[ci]++;
          el.style.width = (cw - PAD * 2) + 'px';
          el.style.transform = 'translate(' + (pos[ci].x + PAD) + 'px,' + (pos[ci].y + HEAD + k * ROW) + 'px)';
          el.style.transitionDelay = (i * 35) + 'ms';
        } else {
          var w = Math.min(220, W * 0.46);
          el.style.width = w + 'px';
          el.style.transform = 'translate(' + (rnd(i) * (W - w)) + 'px,' + (rnd(i + 40) * (H - 26)) + 'px) rotate(' + ((rnd(i + 80) - 0.5) * 10) + 'deg)';
          el.style.transitionDelay = '0ms';
        }
      });
    };
    var sortRun = 0;
    var playSort = async function () {
      var run = ++sortRun;
      layout(false);
      await gate(sortEl); await sleep(1400);
      if (run === sortRun) layout(true);
    };
    watch(sortEl);
    window.addEventListener('resize', function () { layout(sortEl.classList.contains('sorted')); });
    var replay = sortEl.querySelector('.ds-replay');
    if (reduce) { layout(true); if (replay) replay.hidden = true; }
    else { playSort(); if (replay) replay.addEventListener('click', playSort); }
  }

  /* ---- D02: the template file goes from v1.0 to v1.1 in place: the version line is
     retyped, new sections open up between the old ones, extended ones gain a line ---- */
  var fmt = document.querySelector('.ds-format');
  if (fmt) {
    var fReplay = fmt.querySelector('.ds-replay');
    var fsecs = [].slice.call(fmt.querySelectorAll('.ds-dtop, .ds-dsec'));
    var tws = [].slice.call(fmt.querySelectorAll('.tw'));
    var fcnt = fmt.querySelector('.cnt'), fcntFinal = fcnt.textContent;
    var FROM = { 0: '1.0 · Updated: 2026-05-04' };
    var fRun = 0;
    var typeIn = async function (el, run) {
      var target = el.getAttribute('data-t'), cur = el.textContent, p = 0;
      while (p < cur.length && p < target.length && cur[p] === target[p]) p++;
      el.classList.add('typing');
      while (el.textContent.length > p) { if (run !== fRun) return; el.textContent = el.textContent.slice(0, -1); await sleep(24); }
      for (var i = p; i < target.length; i++) { if (run !== fRun) return; el.textContent += target[i]; await sleep(42); }
      el.classList.remove('typing');
    };
    var openSec = async function (sec) {
      sec.classList.remove('pre');
      sec.style.maxHeight = sec.scrollHeight + 'px';
      await sleep(450); sec.style.maxHeight = '';
    };
    var fmtReset = function () {
      fmt.classList.remove('done');
      fsecs.forEach(function (d) { d.classList.remove('seen', 'act'); d.style.maxHeight = ''; if (d.classList.contains('ins')) d.classList.add('pre'); });
      tws.forEach(function (t, i) { t.classList.remove('typing'); t.textContent = FROM[i] || ''; });
      fmt.querySelectorAll('.dl.rv').forEach(function (l) { l.classList.remove('in'); });
      fcnt.textContent = 'v1.0';
    };
    var playFmt = async function () {
      var run = ++fRun;
      fmtReset();
      await gate(fmt); await sleep(700);
      for (var i = 0; i < fsecs.length; i++) {
        if (run !== fRun) return;
        var sec = fsecs[i], tw = sec.querySelector('.tw'), lines = [].slice.call(sec.querySelectorAll('.dl.rv'));
        sec.classList.add('act');
        if (sec.classList.contains('ins')) { await openSec(sec); fcnt.textContent = 'adding ' + tw.getAttribute('data-t'); }
        else if (tw || lines.length) fcnt.textContent = 'updating';
        if (tw) { await gate(fmt); await typeIn(tw, run); }
        for (var k = 0; k < lines.length; k++) { if (run !== fRun) return; await sleep(260); lines[k].classList.add('in'); }
        await sleep(sec.classList.contains('cur') ? 380 : 650);
        sec.classList.remove('act'); sec.classList.add('seen');
      }
      if (run !== fRun) return;
      fcnt.textContent = fcntFinal; fmt.classList.add('done');
    };
    if (reduce) { if (fReplay) fReplay.hidden = true; fmt.classList.add('done'); }
    else {
      fmt.classList.add('ds-anim'); watch(fmt); playFmt();
      if (fReplay) fReplay.addEventListener('click', playFmt);
    }
  }

  /* ---- D03: drift report rows arrive; Approve runs ds:update, Reject leaves everything as is ---- */
  var drift = document.querySelector('.ds-drift');
  if (drift) {
    var rows = [].slice.call(drift.querySelectorAll('.ds-row'));
    var foot = drift.querySelector('.foot'), result = drift.querySelector('.ds-result');
    var steps = result.querySelector('.ds-res-steps');
    var approve = drift.querySelector('[data-act="approve"]');
    var APPLY = [
      ['components + semantic .tokens.json', '6 renamed · 1 removed · 24 added'],
      ['docs/table.md · docs/date-picker.md', 'Token Mapping regenerated'],
      ['Figma descriptions', 'Date Picker · it_close rewritten'],
      ['Baseline', 'saved · 0 drift until Figma changes again']
    ];
    var busy = false;
    var stepLine = function (title, sub, cls) { var d = document.createElement('div'); d.className = 'ds-res ' + (cls || ''); d.innerHTML = '<b>' + title + '</b><span>' + sub + '</span>'; steps.appendChild(d); return d; };
    var decide = async function (act) {
      if (busy) return; busy = true;
      approve.classList.remove('pulse');
      foot.hidden = true; steps.innerHTML = ''; result.hidden = false;
      drift.classList.remove('applied', 'rejected');
      if (act === 'approve') {
        drift.classList.add('applied');
        stepLine('ds:update', 'applying the 33 approved changes', 'head');
        for (var i = 0; i < APPLY.length; i++) { await sleep(reduce ? 0 : 450); stepLine(APPLY[i][0], APPLY[i][1], 'ok'); }
        await sleep(reduce ? 0 : 350);
        stepLine('Result', 'engineers and their agents get the new token names before writing code', 'end');
      } else {
        drift.classList.add('rejected');
        stepLine('Rejected', 'nothing was written: tokens, docs and Figma descriptions stay as they were', 'head');
        await sleep(reduce ? 0 : 350);
        stepLine('Next ds:sync', 'shows the same changes again, until they are fixed in Figma or approved', 'end');
      }
      busy = false;
    };
    drift.querySelectorAll('[data-act="approve"], [data-act="reject"]').forEach(function (b) { b.addEventListener('click', function () { decide(b.getAttribute('data-act')); }); });
    result.querySelector('[data-act="reset"]').addEventListener('click', function () {
      drift.classList.remove('applied', 'rejected'); result.hidden = true; foot.hidden = false; approve.focus();
    });
    if (!reduce) {
      drift.classList.add('ds-anim');
      watch(drift);
      gate(drift).then(async function () {
        await sleep(250);
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i]; r.classList.add('in');
          if (r.getAttribute('data-r') === 'c') { r.classList.add('flash'); (function (x) { setTimeout(function () { x.classList.remove('flash'); }, 900); })(r); }
          await sleep(140);
        }
        await sleep(400); approve.classList.add('pulse');
      });
    }
  }

  /* ---- D04: ds:update rewrites table.md in place. Token rows are edited like
     in an editor (old suffix erased, new one typed), a removed row collapses,
     a new row opens up; hand-written sections are checked and left alone ---- */
  var diff = document.querySelector('#phase-4 .ds-diff');
  if (diff) {
    var dReplay = diff.querySelector('.ds-replay');
    var dsecs = [].slice.call(diff.querySelectorAll('.ds-dsec'));
    var tks = [].slice.call(diff.querySelectorAll('.tk'));
    var cnt = diff.querySelector('.cnt'), cntFinal = cnt.textContent;
    tks.forEach(function (t) { t._from = t.querySelector('.nm').textContent; t._v = t.querySelector('.v').textContent; });
    var dRun = 0;
    var resetTk = function (t) {
      t.className = 'tk'; t.style.maxHeight = '';
      var nm = t.querySelector('.nm'); nm.textContent = t._from; nm.classList.remove('typing');
      t.querySelector('.v').textContent = t._v;
      if (t.dataset.op === 'add') t.classList.add('pre');
    };
    var finalTk = function (t) {
      t.className = 'tk';
      if (t.dataset.op === 'del') { t.classList.add('gone'); return; }
      t.querySelector('.nm').textContent = t.dataset.to;
      if (t.dataset.v) t.querySelector('.v').textContent = t.dataset.v;
    };
    var typeTo = async function (nm, target, run) {
      var cur = nm.textContent, p = 0;
      while (p < cur.length && p < target.length && cur[p] === target[p]) p++;
      nm.classList.add('typing');
      while (nm.textContent.length > p) { if (run !== dRun) return; nm.textContent = nm.textContent.slice(0, -1); await sleep(26); }
      await sleep(120);
      for (var i = p; i < target.length; i++) { if (run !== dRun) return; nm.textContent += target[i]; await sleep(40); }
      nm.classList.remove('typing');
    };
    var edit = async function (t, run) {
      var nm = t.querySelector('.nm');
      t.classList.add('busy'); await sleep(260);
      if (t.dataset.op === 'del') {
        nm.classList.add('strike'); await sleep(500);
        t.classList.add('gone'); await sleep(450);
        return;
      }
      if (t.dataset.op === 'add') {
        t.classList.remove('pre'); await sleep(380);
        await typeTo(nm, t.dataset.to, run);
        t.querySelector('.v').textContent = t.dataset.v;
      } else {
        await typeTo(nm, t.dataset.to, run);
      }
      if (run !== dRun) return;
      t.classList.remove('busy'); t.classList.add('ok'); await sleep(260);
    };
    var playDiff = async function () {
      var run = ++dRun;
      diff.classList.remove('done');
      dsecs.forEach(function (d) { d.classList.remove('seen', 'act'); });
      tks.forEach(resetTk);
      cnt.textContent = 'reading Figma…';
      await gate(diff); await sleep(700);
      for (var i = 0; i < dsecs.length; i++) {
        if (run !== dRun) return;
        var sec = dsecs[i], rowsIn = [].slice.call(sec.querySelectorAll('.tk'));
        sec.classList.add('act');
        if (rowsIn.length) {
          cnt.textContent = 'regenerating Token Mapping';
          for (var k = 0; k < rowsIn.length; k++) { await gate(diff); if (run !== dRun) return; await edit(rowsIn[k], run); }
        } else await sleep(650);
        sec.classList.remove('act'); sec.classList.add('seen');
      }
      if (run !== dRun) return;
      cnt.textContent = cntFinal; diff.classList.add('done');
    };
    if (reduce) { diff.classList.add('done'); dsecs.forEach(function (d) { d.classList.add('seen'); }); tks.forEach(finalTk); if (dReplay) dReplay.hidden = true; }
    else {
      diff.classList.add('ds-anim'); watch(diff); playDiff();
      if (dReplay) dReplay.addEventListener('click', playDiff);
    }
  }
})();
