/* Light-theme direction to compare (Home): ?lt=islands | atlas | night | base (kept for the tab).
   islands: page light, hero + AI section + contact stay dark; the space leaks out of them as ink dust.  atlas: warm paper star-chart, ink points, lime as highlighter.
   night: light sections on the dark starry page.
   Loaded before orbit/space/footer so they read it. Exposes window.ltMode() -> 'dark' | 'light' | 'atlas' | 'islands' (page around dark islands) for a given element. */
(function () {
  var root = document.documentElement, v = 'islands';
  try {
    var q = new URLSearchParams(location.search).get('lt');
    if (q && /^(islands|atlas|night|base)$/.test(q)) sessionStorage.setItem('lt', q);
    v = sessionStorage.getItem('lt') || 'islands';
  } catch (e) {}
  root.setAttribute('data-lt', v);
  window.ltMode = function (el) {
    if (root.getAttribute('data-theme') !== 'light') return 'dark';
    var lt = root.getAttribute('data-lt');
    if (lt === 'islands') return el ? (el.closest && el.closest('.hero, .contact, #ai') ? 'dark' : 'light') : 'islands';
    if (lt === 'night') return el ? 'light' : 'dark';      // the page (no element) is the dark sky, sections are light
    return lt === 'atlas' ? 'atlas' : 'light';
  };
})();
