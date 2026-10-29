/* Inbox case, Decision 01: drives the small Inbox in inbox-desk.css.
   Requests from different doors land one by one in the list, the newest
   opens in the thread, and the reply channel follows the customer.
   Plays only on screen; with reduced motion it shows each business's final state. */
(function () {
  'use strict';
  var root = document.querySelector('.ibd');
  if (!root) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var I = {
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
    missed: '<path d="m16 2 6 6M22 2l-6 6"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    sms: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    messenger: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="m8 13 3-3 2 2 3-3"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
    form: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>'
  };
  var svg = function (k, cls) { return '<svg class="ibd-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>'; };
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

  var CH = [['Email', 'mail'], ['SMS', 'sms'], ['WhatsApp', 'whatsapp'], ['Messenger', 'messenger']];
  // Each request: name, initials, door label, icon, time, card. The last one opens with the channel picker.
  var BIZ = [
    { reply: 'WhatsApp', items: [
      { n: 'Emma Clarke', i: 'EC', d: 'Booking request', ic: 'calendar', t: '15:45', src: "Sent from Women's Haircut page", title: 'Balayage · Fri 10:00', kv: [['Team member', 'Jennie'], ['Price', '$180']], st: 'Pending' },
      { n: 'Mike Sandler', i: 'MS', d: 'Google review', ic: 'star', t: '15:52', src: 'Sent from Google', title: '★★★★★', body: 'Jennie is the best colorist in town. Booked again!', st: 'Reply' },
      { n: 'Alice Morris', i: 'AM', d: 'Missed call', ic: 'missed', t: '16:04', src: 'Phone call', title: 'Missed call · 0:00', body: 'Call back or send a message.', st: 'Missed' },
      { n: 'Grace Liu', i: 'GL', d: 'WhatsApp message', ic: 'whatsapp', t: '16:10', src: 'Sent via WhatsApp', body: 'Hi! Can I move my Friday color to 5 pm?', st: 'Open' }
    ] },
    { reply: 'SMS', items: [
      { n: 'Kenneth Allen', i: 'KA', d: 'Estimate request', ic: 'file', t: '9:12', src: 'Sent from Lawn Care page', title: 'Weekly mowing · 0.4 acre', kv: [['Start', 'May 4'], ['Budget', '$1,000']], st: 'Open' },
      { n: 'Rosa Diaz', i: 'RD', d: 'Call-me-back request', ic: 'phone', t: '9:30', src: 'Sent from Contact page', title: 'Call me back', kv: [['Phone', '+1 (512) 555-0193'], ['Best time', 'After 5 pm']], st: 'Open' },
      { n: 'Tom Becker', i: 'TB', d: 'Email', ic: 'mail', t: '9:41', src: 'Sent via Email', body: 'Could you also trim the hedges next visit?', st: 'Open' },
      { n: 'Sarah Quinn', i: 'SQ', d: 'SMS', ic: 'sms', t: '9:55', src: 'Sent via SMS', body: 'Are you coming Thursday or Friday this week?', st: 'Open' }
    ] },
    { reply: 'Messenger', items: [
      { n: 'Olivia Bennett', i: 'OB', d: 'New order #1049', ic: 'bag', t: '17:40', src: 'Sent from Hoka Clifton 9 page', title: 'New order #1049', kv: [['Shipping', 'Self collect'], ['Total', '$145']], st: 'Pending' },
      { n: 'Marcus Reed', i: 'MR', d: 'Contact form', ic: 'form', t: '17:52', src: 'Sent from Contact page', body: 'Do you do gait analysis before fitting?', st: 'Open' },
      { n: 'Hannah Lee', i: 'HL', d: 'Gift card purchase', ic: 'gift', t: '18:03', src: 'Sent from Gift cards page', title: 'Gift card · $100', kv: [['For', 'Chris Lee'], ['Paid', '$100']], st: 'Paid' },
      { n: 'Daniel Kim', i: 'DK', d: 'Facebook message', ic: 'messenger', t: '18:12', src: 'Sent from your Facebook page', body: 'Do you still have the Nike Pegasus 41 in size 10.5?', st: 'Open' }
    ] }
  ];

  var btns = Array.prototype.slice.call(root.querySelectorAll('.ibd-biz button'));
  var rowsEl = root.querySelector('.ibd-rows'), pend = root.querySelector('.ibd-pend b');
  var cname = root.querySelector('.ibd-ch b'), cav = root.querySelector('.ibd-ch .ibd-av');
  var msgs = root.querySelector('.ibd-msgs'), chan = root.querySelector('.ibd-chan'), menu = root.querySelector('.ibd-menu');
  menu.innerHTML = CH.map(function (c) { return '<li data-c="' + c[0] + '">' + svg(c[1]) + c[0] + '<em></em>' + svg('check', 'ok') + '</li>'; }).join('');
  var lis = Array.prototype.slice.call(menu.children);

  function setChan(name) {
    var c = CH.filter(function (x) { return x[0] === name; })[0];
    chan.innerHTML = svg(c[1]) + c[0] + svg('down', 'car');
    lis.forEach(function (li) { li.classList.toggle('sel', li.getAttribute('data-c') === name); li.classList.remove('hov'); });
  }
  function card(it) {
    var kv = it.kv ? '<div class="ibd-kv">' + it.kv.map(function (p) { return '<span>' + esc(p[0]) + ' <b>' + esc(p[1]) + '</b></span>'; }).join('') + '</div>' : '';
    return '<div class="ibd-req"><div class="ibd-src">' + svg(it.ic) + '<span>' + esc(it.src) + ' at ' + it.t + '</span><span class="ibd-st">' + esc(it.st) + '</span></div>' +
      (it.title ? '<div class="ibd-title">' + esc(it.title) + '</div>' : '') + (it.body ? '<p class="ibd-body">' + esc(it.body) + '</p>' : '') + kv + '</div>';
  }
  function open(it) {
    cname.textContent = it.n; cav.textContent = it.i;
    msgs.innerHTML = card(it);
    Array.prototype.forEach.call(rowsEl.children, function (r) { r.classList.toggle('on', r.getAttribute('data-n') === it.n); });
  }
  function add(it) {
    var li = document.createElement('li');
    li.className = 'ibd-row'; li.setAttribute('data-n', it.n);
    li.innerHTML = '<span class="ibd-av">' + it.i + '</span><span class="ibd-who"><b>' + esc(it.n) + '</b><span>' + svg(it.ic) + esc(it.d) + '</span></span><span class="ibd-meta">' + it.t + '<span class="ibd-badge">1</span></span>';
    rowsEl.insertBefore(li, rowsEl.firstChild);
    pend.textContent = rowsEl.children.length;
    open(it);
  }
  function clear() {
    rowsEl.innerHTML = ''; pend.textContent = '0'; cname.textContent = 'Inbox'; cav.textContent = '';
    msgs.innerHTML = '<span class="ibd-empty">Waiting for customers</span>';
    menu.classList.remove('open'); chan.classList.remove('open'); setChan('Email');
  }
  function press(b) { btns.forEach(function (x, i) { x.setAttribute('aria-pressed', i === b ? 'true' : 'false'); }); }
  function finalState(b) {
    press(b); clear(); rowsEl.innerHTML = '';
    BIZ[b].items.forEach(add); setChan(BIZ[b].reply);
  }

  var visible = false, waiting = null, run = 0, cur = 0;
  function gate() { return visible ? Promise.resolve() : new Promise(function (r) { waiting = r; }); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible && waiting) { waiting(); waiting = null; }
    }, { threshold: 0.35 }).observe(root);
  } else visible = true;

  async function play(b, id) {
    var alive = function () { return id === run; };
    press(b); clear();
    await sleep(500); await gate(); if (!alive()) return;
    var items = BIZ[b].items;
    for (var i = 0; i < items.length; i++) {
      add(items[i]);
      await sleep(1100); await gate(); if (!alive()) return;
    }
    // reply where the customer wrote: the picker walks down to their channel
    chan.classList.add('open'); menu.classList.add('open');
    var target = CH.map(function (c) { return c[0]; }).indexOf(BIZ[b].reply);
    lis.forEach(function (li, j) { li.querySelector('em').textContent = j === target ? 'Last used' : ''; });
    for (var k = 0; k <= target; k++) {
      lis.forEach(function (li, j) { li.classList.toggle('hov', j === k); });
      await sleep(320); if (!alive()) return;
    }
    await sleep(300); if (!alive()) return;
    setChan(BIZ[b].reply); lis[target].classList.add('hov');
    await sleep(500); if (!alive()) return;
    menu.classList.remove('open'); chan.classList.remove('open');
    await sleep(2600); await gate();
  }
  async function loop(start) {
    var id = ++run; cur = start;
    for (;;) {
      await play(cur, id);
      if (id !== run) return;
      cur = (cur + 1) % BIZ.length;
    }
  }

  btns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      if (reduce) { finalState(i); return; }
      loop(i);
    });
  });

  if (reduce) { finalState(0); return; }
  loop(0);
})();
