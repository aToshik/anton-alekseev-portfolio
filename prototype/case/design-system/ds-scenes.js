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
      { label: 'waiting for my review', hold: 1700, wait: true },
      { label: 'tokens, docs and Figma updated', hold: 1500, outs: true }
    ],
    build: [
      { label: 'specs and tokens in context', hold: 1100 },
      { label: 'agent reads both contracts', hold: 1100 },
      { label: 'feature shipped', hold: 1100 },
      { label: '2 questions left', hold: 1200 },
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
          say('approved'); await sleep(800);
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

  /* ---- ds:sync replay (run d460cccb, Table token restructure) ---- */
  var SYNC = [
    ['<span class="p">›</span> /ds:sync', 600],
    ['<span class="d">  ds:audit · reading Figma through MCP…</span>', 900],
    ['<span class="g">  ✓</span> 54 components · 3 token collections read', 500],
    ['<span class="g">  ✓</span> diff vs approved baseline', 700],
    ['', 100],
    ['  33 changes   <span class="c">■ 7 critical</span>   <span class="d">■ 26 low</span>', 700],
    ['  <span class="c">CRITICAL</span> renamed  table/row-color/default', 250],
    ['  <span class="d">               →</span>  table/row/bg-color/default', 250],
    ['  <span class="c">CRITICAL</span> renamed  table/table/padding-x → table/padding-x', 250],
    ['  <span class="c">CRITICAL</span> removed  table/row-color/total', 250],
    ['<span class="d">  … 4 more critical · 26 low</span>', 600],
    ['', 100],
    ['  Apply all 33 changes? [y/N] ', 0, 'ask'],
    ['<span class="d">  ds:update · applying</span>', 500],
    ['  <span class="p">✎</span> components + semantic .tokens.json', 450, 0],
    ['  <span class="p">✎</span> docs/components/table.md', 450, 1],
    ['  <span class="p">✎</span> docs/components/date-picker.md', 450, 2],
    ['  <span class="p">✎</span> Figma · Date Picker description', 450, 3],
    ['<span class="g">  ✓</span> baseline saved · 0 drift', 2800]
  ];
  var sync = document.querySelector('.ds-sync');
  if (sync) {
    var body = sync.querySelector('.ds-term-body');
    var files = [].slice.call(sync.querySelectorAll('.ds-file'));
    var addLine = function (html) { var ln = document.createElement('div'); ln.className = 'ln'; ln.innerHTML = html || ' '; body.appendChild(ln); return ln; };
    watch(sync);
    if (reduce) {
      SYNC.forEach(function (l) { addLine(l[2] === 'ask' ? l[0] + '<span class="p">y</span>' : l[0]); });
      files.forEach(function (f) { f.classList.add('on'); });
    } else {
      (async function () {
        for (;;) {
          await gate(sync);
          body.innerHTML = ''; files.forEach(function (f) { f.classList.remove('on'); });
          for (var i = 0; i < SYNC.length; i++) {
            await gate(sync);
            var l = SYNC[i], ln = addLine(l[0]);
            if (l[2] === 'ask') {
              var cur = document.createElement('span'); cur.className = 'cur'; ln.appendChild(cur);
              await sleep(1600); cur.remove();
              ln.insertAdjacentHTML('beforeend', '<span class="p">y</span>  <span class="d">← designer</span>');
              await sleep(500);
            } else if (typeof l[2] === 'number') files[l[2]].classList.add('on');
            await sleep(l[1]);
          }
        }
      })();
    }
  }

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

  /* ---- D02: the v1.1 sections slide into the v1.0 template ---- */
  var fmt = document.querySelector('.ds-format');
  if (fmt && !reduce) {
    var adds = [].slice.call(fmt.querySelectorAll('.ds-fs.add, .ds-fs .plus'));
    var fmtReplay = fmt.querySelector('.ds-replay');
    var fmtRun = 0;
    var playFmt = async function () {
      var run = ++fmtRun;
      adds.forEach(function (a) { a.classList.remove('in'); });
      await gate(fmt); await sleep(500);
      for (var i = 0; i < adds.length && run === fmtRun; i++) { adds[i].classList.add('in'); await sleep(380); }
    };
    fmt.classList.add('ds-anim');
    watch(fmt);
    playFmt();
    if (fmtReplay) fmtReplay.addEventListener('click', playFmt);
  } else if (fmt) { var r0 = fmt.querySelector('.ds-replay'); if (r0) r0.hidden = true; }

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

  /* ---- D04: ds:update scans table.md top to bottom; only the Figma-derived section changes ---- */
  var diff = document.querySelector('.ds-diff');
  if (diff) {
    var dReplay = diff.querySelector('.ds-replay');
    var dsecs = [].slice.call(diff.querySelectorAll('.ds-dsec'));
    var dRun = 0;
    var playDiff = async function () {
      var run = ++dRun;
      diff.classList.remove('run', 'done');
      dsecs.forEach(function (d) { d.classList.remove('seen'); });
      await gate(diff); await sleep(600);
      if (run !== dRun) return;
      void diff.offsetWidth; diff.classList.add('run');
      for (var i = 0; i < dsecs.length && run === dRun; i++) { await sleep(520); dsecs[i].classList.add('seen'); }
      await sleep(400); if (run === dRun) diff.classList.add('done');
    };
    if (reduce) { diff.classList.add('done'); dsecs.forEach(function (d) { d.classList.add('seen'); }); if (dReplay) dReplay.hidden = true; }
    else {
      diff.classList.add('ds-anim'); watch(diff); playDiff();
      if (dReplay) dReplay.addEventListener('click', playDiff);
    }
  }
})();
