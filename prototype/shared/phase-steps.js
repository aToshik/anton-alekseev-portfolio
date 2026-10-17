/* Phase steps: mirrors the Decisions .phase-rail into the sidebar as a
   vertical timeline under the "Decisions" link. The page's own phase spy
   stays the source of truth: this only copies its on / active classes (as on / cur). */
(function () {
  'use strict';
  var rail = document.querySelector('.phase-rail');
  var sideNav = document.getElementById('sideNav');
  if (!rail || !sideNav) return;
  var section = rail.closest('.section');
  var parent = section && sideNav.querySelector(':scope > a[data-section="' + section.id + '"]');
  if (!parent) return;

  var steps = Array.prototype.slice.call(rail.querySelectorAll('.pr-step'));
  if (!steps.length) return;

  var sub = document.createElement('div');
  sub.className = 'side-sub';
  var html = '<div class="ss-in"><nav class="ss-list" aria-label="' + (rail.getAttribute('aria-label') || 'Phases') + '">' +
    '<span class="ss-track" aria-hidden="true"></span><span class="ss-fill" aria-hidden="true"></span>';
  steps.forEach(function (s) {
    var num = s.querySelector('.pr-num'), name = s.querySelector('.pr-name');
    html += '<a class="ss-step" href="' + s.getAttribute('href') + '"><span class="ss-dot" aria-hidden="true"></span>' +
      '<span class="ss-num">' + (num ? num.textContent : '') + '</span><span class="ss-name">' + (name ? name.textContent : '') + '</span></a>';
  });
  sub.innerHTML = html + '</nav></div>';
  parent.insertAdjacentElement('afterend', sub);

  var mirror = Array.prototype.slice.call(sub.querySelectorAll('.ss-step'));
  var fill = sub.querySelector('.ss-fill');
  function sync() {
    var cur = 0;
    steps.forEach(function (s, i) {
      mirror[i].classList.toggle('on', s.classList.contains('on'));
      mirror[i].classList.toggle('cur', s.classList.contains('active'));
      if (s.classList.contains('active')) { cur = i; mirror[i].setAttribute('aria-current', 'step'); }
      else mirror[i].removeAttribute('aria-current');
    });
    /* line runs from the first dot to the current one */
    var a = mirror[0], b = mirror[cur];
    if (fill && a && b) fill.style.height = (b.offsetTop - a.offsetTop) + 'px';
  }
  new MutationObserver(sync).observe(rail, { subtree: true, attributes: true, attributeFilter: ['class'] });
  /* heights are 0 while collapsed: re-measure once it opens */
  sub.addEventListener('transitionend', sync);
  new MutationObserver(sync).observe(parent, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
