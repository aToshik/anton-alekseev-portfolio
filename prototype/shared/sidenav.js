/* Side menu variant switch (?side=a|b|c, kept for the tab) + rail fill for variant A. */
(function () {
  var root = document.documentElement, v = 'a';
  try {
    var q = new URLSearchParams(location.search).get('side');
    if (q && /^[abc]$/.test(q)) sessionStorage.setItem('side', q);
    v = sessionStorage.getItem('side') || 'a';
  } catch (e) {}
  root.setAttribute('data-side', v);

  var nav = document.getElementById('sideNav');
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll(':scope > a'));
  function fill() {
    var act = nav.querySelector(':scope > a.active'), seen = true;
    links.forEach(function (a) { if (a === act) seen = false; a.classList.toggle('past', !!act && seen); });
    var y = 0, nr = nav.getBoundingClientRect(), tgt = act;
    var sub = act && act.nextElementSibling;
    if (sub && sub.classList.contains('side-sub')) {
      var on = sub.querySelectorAll('.ss-step.on');
      if (on.length && sub.getBoundingClientRect().height > 4) tgt = on[on.length - 1];
    }
    if (tgt) { var r = tgt.getBoundingClientRect(); y = r.top - nr.top + r.height / 2 - 18; }
    nav.style.setProperty('--fill', Math.max(0, y) + 'px');
  }
  new MutationObserver(fill).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
  nav.addEventListener('transitionend', fill);
  window.addEventListener('resize', fill);
  fill();
})();
