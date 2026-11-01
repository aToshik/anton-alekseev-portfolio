/* Light-theme direction to compare (Home): ?lt=islands | atlas | dusk | dawn | night | base (kept for the tab).
   islands: page light, hero + contact stay dark.  atlas: warm paper star-chart, ink points, lime as highlighter.
   dusk: a lighter, softer version of the dark space (stars stay light). dawn: lighter still, mid grey-green.
   night: light sections on the dark starry page.
   Loaded before orbit/space/footer so they read it. Exposes window.ltMode() -> 'dark' | 'light' | 'atlas' | 'dusk' for a given element. */
(function () {
  var root = document.documentElement, v = 'islands';
  try {
    var q = new URLSearchParams(location.search).get('lt');
    if (q && /^(islands|atlas|dusk|dawn|night|base)$/.test(q)) sessionStorage.setItem('lt', q);
    v = sessionStorage.getItem('lt') || 'islands';
  } catch (e) {}
  root.setAttribute('data-lt', v);
  window.ltMode = function (el) {
    if (root.getAttribute('data-theme') !== 'light') return 'dark';
    var lt = root.getAttribute('data-lt');
    if (lt === 'islands' && el && el.closest && el.closest('.hero, .contact')) return 'dark';
    if (lt === 'night') return el ? 'light' : 'dark';      // the page (no element) is the dark sky, sections are light
    return lt === 'atlas' ? 'atlas' : lt === 'dusk' ? 'dusk' : lt === 'dawn' ? 'dawn' : 'light';
  };
})();
