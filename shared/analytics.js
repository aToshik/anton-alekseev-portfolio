/* Umami custom events. The Umami script itself is loaded in each page <head>
   and only counts visits on antonalekseev.design (data-domains), so previews
   and localhost stay out of the stats.
   One delegated listener covers static links and links built by JS (orbit card). */
(function () {
  function track(name, data) {
    if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data);
  }

  function page() {
    var p = location.pathname.replace(/\/index\.html$/, '/').replace(/^\/prototype/, '');
    return p === '/' || p === '/home/' ? 'home' : p.replace(/^\/|\/$/g, '') || 'home';
  }

  function where(a) {
    if (a.closest('.nav')) return 'topbar';
    if (a.closest('.side-nav, .mobile-bar')) return 'sidebar';
    if (a.closest('.contact, footer')) return 'contact';
    if (a.closest('#hero, #poMap')) return 'impact-map';
    return 'content';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var url = a.href || '';
    var from = { page: page(), place: where(a) };

    if (/\.pdf(\?|#|$)/i.test(href)) {
      track('cv-download', from);
    } else if (/linkedin\.com\//i.test(url)) {
      track('linkedin', from);
    } else if (/^mailto:/i.test(href)) {
      from.kind = /subject=/i.test(href) ? 'start-conversation' : 'email';
      track('contact', from);
    } else {
      var m = url.match(/\/(?:case|work)\/([a-z0-9-]+)\/?(?:index\.html)?(?:[?#].*)?$/i);
      if (m && location.host === a.host) {
        from.case = m[1];
        track('case-open', from);
      }
    }
  }, true);
})();
