/* ============================================================
   LIGHTBOX — shared by case pages
   Markup:  <button type="button" class="ph-visual has-img" data-lightbox
                    [data-lb-caption="#phase-4"] [data-lb-title="…"] [data-lb-full="assets/big.webp"]
                    [data-lb-video="assets/anim.mp4, assets/anim.webm"]>
              <img src="assets/x.webp" alt="…">
            </button>
   Caption: title + text come from the nearest .phase / .accent-block
            (.ph-label + .ph-text, else .body-copy), or from the container named in
            data-lb-caption. data-lb-title overrides the title; the
            image's alt is the last fallback.
   data-lb-video: the lightbox plays this video (muted loop, first
            playable source wins) instead of the image; the image is its poster.
            Videos get a player bar: restart, −5 s, play / pause, +5 s.
   data-lb-chapters="0 First step | 10.6 Second step": optional chapter
            track under the video (start second + label); click a chapter to jump.
   All [data-lightbox] on the page form one gallery (← / → / swipe).
   ============================================================ */
(function () {
  'use strict';
  var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (!triggers.length) return;

  var ICON = {
    zoom: '<svg class="lu lu-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="lu-ea" d="M15 3h6v6M21 3l-7 7"/><path class="lu-eb" d="M9 21H3v-6M3 21l7-7"/></svg>',
    prev: '<svg class="lu lu-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    next: '<svg class="lu lu-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    play: '<svg class="lu lu-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3 20 12 6 21Z" fill="currentColor"/></svg>',
    pause: '<svg class="lu lu-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>',
    restart: '<svg class="lu lu-rotate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    back5: '<svg class="lu lu-rewind" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 19 2 12l9-7z"/><path d="M22 19 13 12l9-7z"/></svg>',
    fwd5: '<svg class="lu lu-ff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m13 19 9-7-9-7z"/><path d="m2 19 9-7-9-7z"/></svg>',
    close: '<svg class="lu lu-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  };

  /* ---- collect slides ---- */
  var slides = triggers.map(function (el, i) {
    var img = el.querySelector('img');
    var inlineVid = el.querySelector('video');
    var src = el.getAttribute('data-lb-full') || (img && (img.currentSrc || img.getAttribute('src'))) || (inlineVid && inlineVid.getAttribute('poster'));
    var alt = (img && img.getAttribute('alt')) || (inlineVid && inlineVid.getAttribute('aria-label'));
    var sel = el.getAttribute('data-lb-caption');
    var box = (sel && document.querySelector(sel)) || el.closest('.phase, .accent-block');
    var label = box && box.querySelector('.ph-label');
    var text = box && (box.querySelector('.ph-text') || box.querySelector('.body-copy'));
    var title = el.getAttribute('data-lb-title');
    var num = '';
    if (!title && label) {
      var n = label.querySelector('.n'); num = n ? n.textContent.trim() : '';
      var c = label.cloneNode(true); var cn = c.querySelector('.n'); if (cn) cn.remove();
      var em = c.querySelector('em'); if (em) em.remove();
      title = c.textContent.replace(/^\s*·\s*/, '').trim();
    }
    if (!title) title = alt || '';
    var html = el.getAttribute('data-lb-text') || (text ? text.innerHTML : '');

    el.setAttribute('aria-haspopup', 'dialog');
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Open image fullscreen: ' + title);
    var video = (el.getAttribute('data-lb-video') || '').split(',').map(function (v) { return v.trim(); }).filter(Boolean);
    if (!el.querySelector('.lb-zoom')) el.insertAdjacentHTML('beforeend', '<span class="lb-zoom" aria-hidden="true">' + (video.length ? ICON.play + '<span>Play</span>' : ICON.zoom + '<span>Expand</span>') + '</span>');
    el.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    var chapters = (el.getAttribute('data-lb-chapters') || '').split('|').map(function (c) {
      var m = c.trim().match(/^([\d.]+)\s+(.+)$/); return m ? { t: parseFloat(m[1]), label: m[2] } : null;
    }).filter(Boolean);
    return { video: video, chapters: chapters, src: src, alt: alt || title, title: title, num: num, html: html };
  });

  /* ---- inline (on-page) videos: respect reduced motion, pause while the lightbox is open ---- */
  var inlineVids = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox] video'));
  function playInline(on) { inlineVids.forEach(function (v) { if (on && !reduced()) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); }); }
  if (reduced()) playInline(false);

  /* ---- build overlay once ---- */
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.hidden = true;
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-labelledby', 'lbTitle');
  lb.innerHTML =
    '<div class="lb-bar">' +
      '<span class="lb-count" aria-live="polite"></span>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image">' + ICON.prev + '</button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image">' + ICON.next + '</button>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close">' + ICON.close + '</button>' +
    '</div>' +
    '<div class="lb-stage"><img class="lb-img" alt="" draggable="false"><video class="lb-img lb-video" muted loop playsinline preload="auto" hidden></video>' +
      '<div class="lb-player" hidden>' +
        '<div class="lb-chapters"></div>' +
        '<div class="lb-ctrls">' +
          '<button class="lb-btn lb-restart" type="button" aria-label="Play from the start">' + ICON.restart + '</button>' +
          '<button class="lb-btn lb-back" type="button" aria-label="Back 5 seconds">' + ICON.back5 + '<span>5s</span></button>' +
          '<button class="lb-btn lb-toggle" type="button" aria-label="Pause">' + ICON.pause + '</button>' +
          '<button class="lb-btn lb-fwd" type="button" aria-label="Forward 5 seconds"><span>5s</span>' + ICON.fwd5 + '</button>' +
          '<span class="lb-time" aria-hidden="true"></span>' +
        '</div>' +
      '</div></div>' +
    '<aside class="lb-cap"><div class="lb-cap-in">' +
      '<p class="lb-eyebrow">' + (document.querySelector('.crumb [aria-current]') ? document.querySelector('.crumb [aria-current]').textContent : 'Case') + '</p>' +
      '<h2 class="lb-title" id="lbTitle"></h2>' +
      '<div class="lb-text"></div>' +
      '<p class="lb-hint">Click image to zoom · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>Esc</kbd> close</p>' +
    '</div></aside>';
  document.body.appendChild(lb);

  var $ = function (s) { return lb.querySelector(s); };
  var imgEl = $('.lb-img'), countEl = $('.lb-count'), titleEl = $('.lb-title'), textEl = $('.lb-text'),
      vidEl = $('.lb-video'), hintEl = $('.lb-hint'),
      player = $('.lb-player'), chapEl = $('.lb-chapters'), toggleBtn = $('.lb-toggle'), timeEl = $('.lb-time'),
      prevBtn = $('.lb-prev'), nextBtn = $('.lb-next'), closeBtn = $('.lb-close'), stage = $('.lb-stage'), cap = $('.lb-cap');
  var current = -1, lastFocus = null, single = slides.length < 2;
  if (single) { prevBtn.hidden = true; nextBtn.hidden = true; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function render(i, animate) {
    var s = slides[i];
    unzoom();
    current = i;
    countEl.innerHTML = '<b>' + pad(i + 1) + '</b> / ' + pad(slides.length);
    titleEl.innerHTML = (s.num ? '<span class="n">' + s.num + '</span>' : '');
    titleEl.appendChild(document.createTextNode(s.title));
    textEl.innerHTML = s.html;
    cap.scrollTop = 0;
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;
    var apply = function () {
      stopVideo();
      if (s.video.length) {
        imgEl.hidden = true; vidEl.hidden = false;
        vidEl.poster = s.src || ''; vidEl.setAttribute('aria-label', s.alt);
        vidEl.innerHTML = s.video.map(function (v) { return '<source src="' + v + '" type="video/' + (/\.webm(\?|$)/i.test(v) ? 'webm' : 'mp4') + '">'; }).join('');
        buildChapters(s.chapters);
        player.hidden = false; stage.classList.add('has-player');
        vidEl.load();
        var pr = vidEl.play(); if (pr && pr.catch) pr.catch(function () {});
      } else {
        vidEl.hidden = true; imgEl.hidden = false;
        player.hidden = true; stage.classList.remove('has-player');
        imgEl.src = s.src; imgEl.alt = s.alt;
      }
      hintEl.firstChild.nodeValue = s.video.length ? 'Click video or Space to pause · ' : 'Click image to zoom · ';
      imgEl.classList.remove('swap'); vidEl.classList.remove('swap');
    };
    if (animate && !reduced()) { imgEl.classList.add('swap'); vidEl.classList.add('swap'); setTimeout(apply, 140); } else apply();
    [i - 1, i + 1].forEach(function (j) { if (slides[j] && slides[j].src) { var p = new Image(); p.src = slides[j].src; } });
  }
  function stopVideo() { if (!vidEl.paused) vidEl.pause(); }
  function reduced() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  function open(i) {
    lastFocus = document.activeElement;
    render(i, false);
    lb.hidden = false;
    document.documentElement.classList.add('lb-lock');
    playInline(false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add('open'); }); });
    closeBtn.focus({ preventScroll: true });
    document.addEventListener('keydown', onKey, true);
  }
  function close() {
    if (lb.hidden) return;
    lb.classList.remove('open');
    stopVideo();
    document.documentElement.classList.remove('lb-lock');
    playInline(true);
    document.removeEventListener('keydown', onKey, true);
    setTimeout(function () { lb.hidden = true; }, reduced() ? 0 : 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function go(d) { var j = current + d; if (j >= 0 && j < slides.length) render(j, true); }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); if (stage.classList.contains('zoomed')) unzoom(); else close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === ' ' && !vidEl.hidden && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.lb-player'))) { e.preventDefault(); togglePlay(); }
    else if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(lb.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'), function (x) { return !x.hidden && !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    else if (e.code === 'KeyT') { e.stopPropagation(); } /* keep theme hotkey from firing behind the modal */
  }

  /* click / tap the image: toggle 2x zoom around the point */
  function unzoom() { stage.classList.remove('zoomed'); imgEl.style.width = ''; }
  imgEl.addEventListener('click', function (e) {
    if (moved) return;
    if (stage.classList.contains('zoomed')) { unzoom(); return; }
    var r = imgEl.getBoundingClientRect();
    var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    var w = Math.max(r.width * 2, Math.min(imgEl.naturalWidth || 0, r.width * 3));
    stage.classList.add('zoomed');
    imgEl.style.width = w + 'px';
    var h = w * (r.height / r.width);
    stage.scrollLeft = fx * w - stage.clientWidth / 2;
    stage.scrollTop = fy * h - stage.clientHeight / 2;
  });

  /* click / tap the video: play / pause */
  function togglePlay() { if (vidEl.paused) { var pr = vidEl.play(); if (pr && pr.catch) pr.catch(function () {}); } else vidEl.pause(); }
  vidEl.addEventListener('click', function () { if (moved) return; togglePlay(); });

  /* player bar: restart, ±5 s, play / pause, chapter track */
  var chapters = [];
  function seek(t) { var d = vidEl.duration || 0; vidEl.currentTime = Math.max(0, d ? Math.min(t, d - 0.05) : t); }
  function fmt(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + pad(t % 60); }
  function buildChapters(list) {
    chapters = list;
    chapEl.innerHTML = '';
    chapEl.hidden = !list.length;
    list.forEach(function (c, k) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'lb-chap';
      b.innerHTML = '<span class="lb-chap-bar"><i></i></span><span class="lb-chap-label"><b>' + pad(k + 1) + '</b> ' + c.label + '</span>';
      b.setAttribute('aria-label', 'Chapter ' + (k + 1) + ': ' + c.label);
      b.addEventListener('click', function () { seek(c.t); if (vidEl.paused) togglePlay(); });
      chapEl.appendChild(b);
    });
    layoutChapters(); syncPlayer();
  }
  function layoutChapters() {
    var d = vidEl.duration, items = chapEl.children;
    for (var k = 0; k < items.length; k++) {
      var end = chapters[k + 1] ? chapters[k + 1].t : d;
      items[k].style.flexGrow = d ? Math.max(end - chapters[k].t, 0.1) : 1;
    }
  }
  function syncPlayer() {
    var t = vidEl.currentTime || 0, d = vidEl.duration || 0, items = chapEl.children;
    for (var k = 0; k < items.length; k++) {
      var st = chapters[k].t, end = chapters[k + 1] ? chapters[k + 1].t : d;
      var f = end > st ? Math.min(Math.max((t - st) / (end - st), 0), 1) : 0;
      items[k].querySelector('i').style.width = (f * 100) + '%';
      items[k].classList.toggle('on', t >= st && (t < end || !chapters[k + 1]));
    }
    timeEl.textContent = d ? fmt(t) + ' / ' + fmt(d) : '';
  }
  function syncToggle() {
    var p = vidEl.paused;
    toggleBtn.innerHTML = p ? ICON.play : ICON.pause;
    toggleBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
  }
  vidEl.addEventListener('timeupdate', syncPlayer);
  vidEl.addEventListener('loadedmetadata', function () { layoutChapters(); syncPlayer(); });
  vidEl.addEventListener('play', syncToggle);
  vidEl.addEventListener('pause', syncToggle);
  toggleBtn.addEventListener('click', togglePlay);
  $('.lb-restart').addEventListener('click', function () { seek(0); if (vidEl.paused) togglePlay(); });
  $('.lb-back').addEventListener('click', function () { seek(vidEl.currentTime - 5); });
  $('.lb-fwd').addEventListener('click', function () { seek(vidEl.currentTime + 5); });

  prevBtn.addEventListener('click', function () { go(-1); });
  nextBtn.addEventListener('click', function () { go(1); });
  closeBtn.addEventListener('click', close);
  /* backdrop: clicking anywhere on the stage except the image closes */
  stage.addEventListener('click', function (e) { if (e.target !== imgEl && e.target !== vidEl && !player.contains(e.target) && !moved) close(); });

  /* swipe: horizontal = prev/next, down = close */
  var sx = 0, sy = 0, tracking = false, moved = false;
  stage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1 || stage.classList.contains('zoomed')) { tracking = false; return; }
    tracking = true; moved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!tracking) return; tracking = false;
    if (window.visualViewport && window.visualViewport.scale > 1.01) return; /* user is pinch-zoomed: let them pan */
    var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { moved = true; go(dx < 0 ? 1 : -1); }
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.3) { moved = true; close(); }
    setTimeout(function () { moved = false; }, 350);
  }, { passive: true });
})();
