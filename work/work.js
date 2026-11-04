/* work/work.js: /work page behaviour.
   1. Cases and chapters: left directory on desktop, tabs + chapter chips on phones, URL hash, "next case".
   2. "One order, role by role": click a step to see what happens, the design focus and who built it.
   3. Dispatch console demo: fictional data, EN by default with a 中文 switch. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function scrollToY(y) { window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' }); }

  /* ---------------- 1. Cases and chapters ---------------- */
  var panels = $$('.wk-panel');
  var tabs = $$('.wk-tab');
  var sideCases = $$('.wk-side-case');
  var chapnav = document.querySelector('.wk-chapnav');
  var shell = document.querySelector('.wk-shell');
  var current = 0;

  function chaptersOf(i) { return $$('.wk-chapter', panels[i]); }
  /* Top of the case content, below the sticky phone bar when it shows. */
  function contentY() { var bar = document.querySelector('.wk-tabs'); return shell.offsetTop - (bar && bar.offsetParent ? bar.offsetHeight : 0); }
  function link(ch) { var a = document.createElement('a'); a.href = '#' + ch.id; a.textContent = ch.getAttribute('data-title'); return a; }

  sideCases.forEach(function (li, i) {
    var ol = li.querySelector('.wk-side-chapters');
    chaptersOf(i).forEach(function (ch) { var item = document.createElement('li'); item.appendChild(link(ch)); ol.appendChild(item); });
  });

  function buildChips(i) {
    if (!chapnav) return;
    chapnav.innerHTML = '';
    chaptersOf(i).forEach(function (ch) { chapnav.appendChild(link(ch)); });
  }

  function select(i, opts) {
    opts = opts || {};
    current = i;
    panels.forEach(function (p, j) { p.classList.toggle('is-active', i === j); });
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.tabIndex = i === j ? 0 : -1; });
    sideCases.forEach(function (li, j) {
      li.classList.toggle('is-active', i === j);
      li.querySelector('button').setAttribute('aria-current', i === j ? 'true' : 'false');
    });
    buildChips(i);
    if (opts.hash) history.replaceState(null, '', '#' + panels[i].getAttribute('data-case'));
    if (opts.scroll) scrollToY(contentY());
    spy();
    document.dispatchEvent(new CustomEvent('wk:panel'));
  }

  function indexFromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) return -1;
    for (var i = 0; i < panels.length; i++) {
      if (panels[i].getAttribute('data-case') === h) return i;
      if (panels[i].querySelector('[id="' + h + '"]')) return i;
    }
    return -1;
  }

  function spy() {
    var chs = chaptersOf(current);
    var line = window.innerWidth >= 1024 ? 140 : 180;
    var cur = chs[0];
    chs.forEach(function (ch) { if (ch.getBoundingClientRect().top <= line) cur = ch; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = chs[chs.length - 1];
    if (pinned && Date.now() < pinned.until) cur = pinned.el;
    var id = cur ? cur.id : '';
    $$('.wk-side-chapters a, .wk-chapnav a').forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('href') === '#' + id); });
    var chip = chapnav && chapnav.querySelector('a.is-current');
    if (chip && chapnav.scrollWidth > chapnav.clientWidth) chapnav.scrollLeft = chip.offsetLeft - chapnav.clientWidth / 2 + chip.offsetWidth / 2;
  }
  /* A clicked chapter stays highlighted while the smooth scroll runs. */
  var pinned = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.wk-side-chapters a, .wk-chapnav a');
    if (!a) return;
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (el) { pinned = { el: el, until: Date.now() + 1200 }; spy(); setTimeout(spy, 1250); }
  });
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; spy(); }); } }, { passive: true });

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i, { hash: true, scroll: true }); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
      if (n < 0) return;
      e.preventDefault(); tabs[n].focus(); select(n, { hash: true });
    });
  });
  sideCases.forEach(function (li, i) { li.querySelector('button').addEventListener('click', function () { select(i, { hash: true, scroll: true }); }); });
  $$('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      var key = b.getAttribute('data-next');
      for (var i = 0; i < panels.length; i++) if (panels[i].getAttribute('data-case') === key) select(i, { hash: true, scroll: true });
    });
  });
  window.addEventListener('hashchange', function () { var i = indexFromHash(); if (i >= 0 && i !== current) select(i); });

  var start = indexFromHash();
  select(start < 0 ? 0 : start);
  if (start >= 0) window.addEventListener('load', function () {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && el.classList.contains('wk-chapter') && el !== chaptersOf(current)[0]) el.scrollIntoView(); else window.scrollTo(0, contentY());
  });

  /* ---------------- 2. One order, role by role ---------------- */
  $$('[data-lanes]').forEach(function (root) {
    var grid = root.querySelector('.wk-lanes-grid');
    var svg = root.querySelector('.wk-lanes-links');
    var detail = root.querySelector('.wk-ldetail');
    var steps = $$('.wk-step[data-step]', root);
    var phone = window.matchMedia('(max-width: 760px)');
    var pairs = JSON.parse(root.getAttribute('data-links') || '[]');
    var active = null;

    function place() {
      if (phone.matches && active) active.insertAdjacentElement('afterend', detail);
      else if (detail.parentNode !== root) root.appendChild(detail);
    }
    function show(btn, focus) {
      active = btn;
      steps.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      var data = root.querySelector('.wk-ldata[data-for="' + btn.getAttribute('data-step') + '"]');
      detail.innerHTML = data ? data.innerHTML : '';
      place();
      if (focus && phone.matches) detail.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
    }
    function box(el, g) { var r = el.getBoundingClientRect(); return { l: r.left - g.left, r: r.right - g.left, t: r.top - g.top, b: r.bottom - g.top, cx: (r.left + r.right) / 2 - g.left, cy: (r.top + r.bottom) / 2 - g.top }; }
    function draw() {
      if (phone.matches || !grid.offsetParent) { svg.innerHTML = ''; return; }
      var g = grid.getBoundingClientRect();
      var out = '<defs><marker id="wk-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#8a857b"/></marker></defs>';
      pairs.forEach(function (p) {
        var a = root.querySelector('.wk-step[data-step="' + p[0] + '"]'), b = root.querySelector('.wk-step[data-step="' + p[1] + '"]');
        if (!a || !b) return;
        var A = box(a, g), B = box(b, g), d;
        if (B.l > A.r) { var mx = (A.r + B.l) / 2; d = 'M' + A.r + ' ' + A.cy + 'H' + mx + 'V' + B.cy + 'H' + (B.l - 3); }
        else if (B.b < A.t) d = 'M' + A.cx + ' ' + A.t + 'V' + (B.b + 3);
        else d = 'M' + A.cx + ' ' + A.b + 'V' + (B.t - 3);
        out += '<path d="' + d + '" marker-end="url(#wk-ah)"' + (p[2] ? ' class="is-' + p[2] + '"' : '') + '/>';
      });
      svg.innerHTML = out;
    }
    steps.forEach(function (b) { b.addEventListener('click', function () { show(b, true); }); });
    show(root.querySelector('.wk-step[data-default]') || steps[0]);
    draw();
    window.addEventListener('resize', function () { place(); draw(); });
    window.addEventListener('load', draw);
    document.addEventListener('wk:panel', function () { requestAnimationFrame(draw); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  });

  /* ---------------- 3. Dispatch console ---------------- */
  $$('[data-console]').forEach(initConsole);

  function initConsole(host) {
    var I = {
      en: {
        title: 'Dispatch console', station: 'Station 12 · Xuhui, Shanghai', demo: 'Demo data',
        toAssign: 'to assign', onRoad: 'on the road', ridersOn: 'riders on shift',
        spike: '⚡ Simulate a live-stream spike', lang: 'Language',
        modeOrder: 'Start from an order', modeRider: 'Start from a rider',
        hintOrder: 'Pick an order, then approve the AI suggestion, or drag the order onto any rider.',
        hintRider: 'Pick a rider to see their route and the orders they carry.',
        tabs: { assign: 'To assign', pickup: 'To pick up', delivering: 'Delivering', done: 'Done' },
        reserved: 'Reserved', priority: 'Priority', now: 'Deliver now', due: 'Due {t}', mins: '{m} min',
        riders: 'Riders', loadHint: 'orders carried / capacity', exp: 'Experienced', newR: 'New', km: '{d} km', full: 'At capacity',
        sugg: 'AI suggestion', suggMain: '<b>{name}</b> · {lv} · carrying {l} of {c} · {d} km to pick-up',
        why: 'Lowest load near the pick-up.', next: 'Next best: {name} ({l} of {c}, {d} km).',
        skip: 'Skipped {name}: closest, but already carrying {l} of {c}.',
        approve: 'Approve', assignTo: 'Assign to {name}', noRider: 'Every rider nearby is at capacity. Hold the order until a rider frees up.',
        noneSel: 'Select an order to see a suggestion.', allDone: 'Every order is assigned. Try a live-stream spike.',
        assigned: '{o} assigned to {name}', capWarn: '{name} is at capacity ({l}/{c}). New riders carry 2–3 orders, experienced riders 3–5.',
        spiked: 'A live stream just sold {n} camping sets', riderLine: 'Rider: {name}',
        showing: '{name}: {n} orders on the route', clear: 'Show all', noOrders: 'No orders here.',
        mapLabel: 'Map of the station area', p: 'P', d: 'D', streetA: 'Caoxi Rd', streetB: 'Yishan Rd', river: 'Creek'
      },
      zh: {
        title: '调度台', station: '12 号站 · 上海徐汇', demo: '演示数据',
        toAssign: '待分配', onRoad: '在途', ridersOn: '名骑手在岗',
        spike: '⚡ 模拟一次直播爆单', lang: '语言',
        modeOrder: '从订单出发', modeRider: '从骑手出发',
        hintOrder: '选一个订单：确认 AI 建议，或把订单拖到任意骑手身上。',
        hintRider: '选一个骑手，查看他的路线和手上的单。',
        tabs: { assign: '待分配', pickup: '待取餐', delivering: '配送中', done: '已完成' },
        reserved: '预约单', priority: '加急', now: '立即送', due: '{t} 送达', mins: '剩 {m} 分钟',
        riders: '骑手', loadHint: '手上单量 / 上限', exp: '老骑手', newR: '新骑手', km: '{d} 公里', full: '已满',
        sugg: 'AI 建议', suggMain: '<b>{name}</b> · {lv} · 手上 {l}/{c} 单 · 距取餐点 {d} 公里',
        why: '取餐点附近负载最低。', next: '次优：{name}（{l}/{c} 单，{d} 公里）。',
        skip: '跳过 {name}：离得最近，但手上已有 {l}/{c} 单。',
        approve: '确认分配', assignTo: '改派给 {name}', noRider: '附近骑手都已满，先保留订单，等骑手空出来。',
        noneSel: '选择一个订单查看建议。', allDone: '订单已全部分配，试试模拟直播爆单。',
        assigned: '{o} 已分配给 {name}', capWarn: '{name} 已满（{l}/{c}）。新骑手同时 2–3 单，老骑手 3–5 单。',
        spiked: '直播间刚卖出 {n} 份露营套餐', riderLine: '骑手：{name}',
        showing: '{name}：路线上 {n} 单', clear: '显示全部', noOrders: '这里没有订单。',
        mapLabel: '站点区域地图', p: '取', d: '送', streetA: '漕溪路', streetB: '宜山路', river: '河道'
      }
    };
    var lang = 'en', mode = 'order', tab = 'assign', selected = 'o1', focus = null, shake = null, spikes = 0;

    var SHOPS = {
      s1: { n: { en: 'Ember BBQ', zh: '炭火烤肉' }, pos: [32, 32] },
      s2: { n: { en: 'Yogurt Lab', zh: '酸奶研究所' }, pos: [56, 44] },
      s3: { n: { en: 'Copper Pot Hotpot', zh: '铜锅火锅' }, pos: [18, 52] },
      s4: { n: { en: 'Lanzhou Noodles', zh: '兰州拉面' }, pos: [66, 26] },
      s5: { n: { en: 'Camping Grill Co.', zh: '春日露营烤肉' }, pos: [44, 70] },
      s6: { n: { en: 'Milk Tea Bar', zh: '奶茶铺' }, pos: [24, 80] }
    };
    var DROPS = {
      d1: { n: { en: 'Xianghe Plaza, Tower B, 20F', zh: '祥和广场 B 座 20 楼' }, pos: [48, 12] },
      d2: { n: { en: 'Jiuhe Garden, Block 6', zh: '九禾花园 6 号楼' }, pos: [72, 54] },
      d3: { n: { en: 'Huacao Tech Park, Tower 3', zh: '华草科技园 3 号楼' }, pos: [8, 40] },
      d4: { n: { en: 'Starlight Apartments 2-1103', zh: '星光公寓 2-1103' }, pos: [74, 14] },
      d5: { n: { en: 'Riverside Lofts 5-402', zh: '滨江里 5-402' }, pos: [36, 86] },
      d6: { n: { en: 'Caoxi Rd 88, 12F', zh: '漕溪路 88 号 12 楼' }, pos: [10, 64] },
      d7: { n: { en: 'Yishan Mansion 1701', zh: '宜山大厦 1701' }, pos: [60, 80] },
      d8: { n: { en: 'Maple Court 3-201', zh: '枫林苑 3-201' }, pos: [26, 10] }
    };
    var ITEMS = {
      camp: { en: 'Spring camping set', zh: '春日露营套餐' }, yog: { en: 'Yogurt ice-cream drink ×2', zh: '酸奶冰淇淋饮 ×2' },
      pot: { en: 'Hotpot set for two', zh: '双人火锅套餐' }, noo: { en: 'Beef noodles', zh: '牛肉面' },
      bbq: { en: 'Barbecue platter for two', zh: '双人烤肉拼盘' }, tea: { en: 'Milk tea ×3', zh: '奶茶 ×3' }
    };
    var riders = [
      { id: 'r1', n: { en: 'Zhang Wei', zh: '张伟' }, lv: 'exp', cap: 5, pos: [22, 20] },
      { id: 'r2', n: { en: 'Wu Yufei', zh: '吴于菲' }, lv: 'new', cap: 3, pos: [52, 24] },
      { id: 'r3', n: { en: 'Sun Hao', zh: '孙浩' }, lv: 'exp', cap: 5, pos: [40, 56] },
      { id: 'r4', n: { en: 'Zhang Shuhan', zh: '张书翰' }, lv: 'new', cap: 3, pos: [64, 62] },
      { id: 'r5', n: { en: 'Han Meimei', zh: '韩美美' }, lv: 'new', cap: 3, pos: [30, 37] },
      { id: 'r6', n: { en: 'Liu Shu', zh: '刘书' }, lv: 'exp', cap: 5, pos: [60, 8] },
      { id: 'r7', n: { en: 'Fei Teng', zh: '费腾' }, lv: 'exp', cap: 5, pos: [70, 40] },
      { id: 'r8', n: { en: 'Wang Xinxin', zh: '王欣心' }, lv: 'new', cap: 3, pos: [14, 72] }
    ];
    function O(id, code, shop, drop, item, st, opt) {
      opt = opt || {};
      return { id: id, code: code, shop: shop, drop: drop, item: item, status: st, rider: opt.r || null, res: !!opt.res, prio: !!opt.prio, due: opt.due || '12:40', mins: opt.mins || 30 };
    }
    var orders = [
      O('o1', '#2041', 's1', 'd1', 'camp', 'assign', { res: 1, prio: 1, due: '12:20', mins: 18 }),
      O('o2', '#2042', 's2', 'd2', 'yog', 'assign', { due: '12:35', mins: 33 }),
      O('o3', '#2043', 's3', 'd3', 'pot', 'assign', { res: 1, due: '12:50', mins: 48 }),
      O('o4', '#2044', 's4', 'd4', 'noo', 'assign', { due: '12:30', mins: 28 }),
      O('a1', '#2031', 's6', 'd8', 'tea', 'pickup', { r: 'r1', due: '12:24', mins: 22 }),
      O('a2', '#2027', 's1', 'd3', 'bbq', 'delivering', { r: 'r1', res: 1, due: '12:12', mins: 10 }),
      O('a3', '#2033', 's4', 'd1', 'noo', 'pickup', { r: 'r2', due: '12:28', mins: 26 }),
      O('a4', '#2029', 's5', 'd5', 'camp', 'delivering', { r: 'r3', res: 1, due: '12:15', mins: 13 }),
      O('a5', '#2034', 's2', 'd7', 'yog', 'pickup', { r: 'r3', due: '12:31', mins: 29 }),
      O('a6', '#2025', 's2', 'd2', 'yog', 'delivering', { r: 'r4', due: '12:10', mins: 8 }),
      O('a7', '#2030', 's5', 'd7', 'bbq', 'delivering', { r: 'r4', res: 1, due: '12:18', mins: 16 }),
      O('a8', '#2035', 's2', 'd4', 'tea', 'pickup', { r: 'r4', due: '12:33', mins: 31 }),
      O('a9', '#2026', 's1', 'd6', 'bbq', 'delivering', { r: 'r5', res: 1, due: '12:11', mins: 9 }),
      O('a10', '#2032', 's3', 'd6', 'pot', 'pickup', { r: 'r5', due: '12:26', mins: 24 }),
      O('a11', '#2036', 's1', 'd8', 'camp', 'pickup', { r: 'r5', res: 1, prio: 1, due: '12:34', mins: 32 }),
      O('a12', '#2028', 's4', 'd4', 'noo', 'delivering', { r: 'r6', due: '12:14', mins: 12 }),
      O('a13', '#2022', 's4', 'd2', 'noo', 'delivering', { r: 'r7', due: '12:08', mins: 6 }),
      O('a14', '#2024', 's2', 'd2', 'tea', 'delivering', { r: 'r7', due: '12:13', mins: 11 }),
      O('a15', '#2037', 's5', 'd7', 'camp', 'pickup', { r: 'r7', res: 1, due: '12:36', mins: 34 }),
      O('a16', '#2038', 's4', 'd1', 'noo', 'pickup', { r: 'r7', due: '12:38', mins: 36 }),
      O('a17', '#2023', 's6', 'd5', 'tea', 'delivering', { r: 'r8', due: '12:09', mins: 7 }),
      O('a18', '#2039', 's3', 'd6', 'pot', 'pickup', { r: 'r8', res: 1, due: '12:40', mins: 38 }),
      O('x1', '#2011', 's1', 'd1', 'bbq', 'done', { r: 'r1', due: '11:52' }),
      O('x2', '#2013', 's2', 'd2', 'yog', 'done', { r: 'r7', due: '11:55' }),
      O('x3', '#2015', 's4', 'd4', 'noo', 'done', { r: 'r6', due: '11:58' }),
      O('x4', '#2016', 's5', 'd5', 'camp', 'done', { r: 'r3', due: '12:01' }),
      O('x5', '#2018', 's6', 'd8', 'tea', 'done', { r: 'r8', due: '12:03' })
    ];

    function t(k, v) {
      var parts = k.split('.'), s = I[lang], e = I.en;
      parts.forEach(function (p) { s = s && s[p]; e = e && e[p]; });
      s = s == null ? e : s;
      if (v) Object.keys(v).forEach(function (key) { s = s.split('{' + key + '}').join(v[key]); });
      return s;
    }
    function L(o) { return o[lang] || o.en; }
    function byId(id) { for (var i = 0; i < orders.length; i++) if (orders[i].id === id) return orders[i]; return null; }
    function rider(id) { for (var i = 0; i < riders.length; i++) if (riders[i].id === id) return riders[i]; return null; }
    function load(r) { return orders.filter(function (o) { return o.rider === r.id && (o.status === 'pickup' || o.status === 'delivering'); }).length; }
    function dist(a, b) { var x = a[0] - b[0], y = a[1] - b[1]; return Math.sqrt(x * x + y * y); }
    function km(dd) { return (dd * 0.06).toFixed(1); }
    function lvName(r) { return r.lv === 'exp' ? t('exp') : t('newR'); }
    function initials(r) { return lang === 'zh' ? r.n.zh.slice(-1) : r.n.en.split(' ').map(function (w) { return w[0]; }).join(''); }
    function rank(o) {
      var shop = SHOPS[o.shop].pos;
      return riders.map(function (r) { var l = load(r), d = dist(r.pos, shop); return { r: r, l: l, d: d, score: d * (1 + 1.6 * l / r.cap) }; })
        .filter(function (x) { return x.l < x.r.cap; })
        .sort(function (a, b) { return a.score - b.score; });
    }
    function nearest(o) {
      var shop = SHOPS[o.shop].pos;
      return riders.map(function (r) { return { r: r, l: load(r), d: dist(r.pos, shop) }; }).sort(function (a, b) { return a.d - b.d; })[0];
    }
    function count(st) { return orders.filter(function (o) { return o.status === st; }).length; }

    host.innerHTML = '<div class="cx" lang="en"><div class="cx-top"></div><div class="cx-mode"></div><div class="cx-body"></div><div class="cx-toast" role="status" aria-live="polite"></div></div>';
    var cx = host.firstChild, top = cx.children[0], modeBar = cx.children[1], body = cx.children[2], toastEl = cx.children[3], toastTimer;

    function toast(msg, warn) {
      toastEl.textContent = msg;
      toastEl.className = 'cx-toast is-on' + (warn ? ' is-warn' : '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3000);
    }

    function orderCard(o) {
      var sel = o.id === selected && mode === 'order';
      var tags = (o.res ? '<span class="cx-tag is-res">' + t('reserved') + '</span>' : '<span class="cx-tag is-now">' + t('now') + '</span>') + (o.prio ? '<span class="cx-tag is-prio">' + t('priority') + '</span>' : '');
      var due = o.status === 'done' ? '' : '<span class="cx-due' + (o.mins <= 15 ? ' is-soon' : '') + '">' + t('due', { t: o.due }) + ' · ' + t('mins', { m: o.mins }) + '</span>';
      var r = o.rider ? rider(o.rider) : null;
      return '<li><button type="button" class="cx-order' + (o.prio ? ' is-prio' : '') + (sel ? ' is-sel' : '') + (o.isNew ? ' is-new' : '') + '" data-order="' + o.id + '"' + (o.status === 'assign' ? ' draggable="true"' : '') + '>' +
        '<span class="cx-o-top"><b>' + o.code + '</b>' + tags + due + '</span>' +
        '<span class="cx-o-line"><i class="cx-pin is-p">' + t('p') + '</i><span>' + L(SHOPS[o.shop].n) + ' · ' + L(ITEMS[o.item]) + '</span></span>' +
        '<span class="cx-o-line"><i class="cx-pin is-d">' + t('d') + '</i><span>' + L(DROPS[o.drop].n) + '</span></span>' +
        (r ? '<span class="cx-o-rider">' + t('riderLine', { name: L(r.n) }) + '</span>' : '') +
        '</button></li>';
    }

    function routePath(a, b) { return 'M' + a[0] + ' ' + a[1] + 'H' + b[0] + 'V' + b[1]; }
    function mapSVG(sel, sug) {
      var s = '<svg viewBox="0 0 80 90" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + t('mapLabel') + '">' +
        '<rect width="80" height="90" fill="#eceee8"/>' +
        '<rect x="4" y="58" width="16" height="12" rx="2" fill="#dde7d3"/><rect x="54" y="4" width="14" height="9" rx="2" fill="#dde7d3"/><rect x="46" y="48" width="9" height="8" rx="1.5" fill="#dde7d3"/>' +
        '<path d="M-2 76 C 16 70, 34 82, 52 74 S 74 70, 82 73" fill="none" stroke="#cfe0ec" stroke-width="4"/>' +
        '<g class="m-road">' +
        [6, 18, 30, 46, 62, 84].map(function (y) { return '<path d="M0 ' + y + 'H80" stroke-width="' + (y === 30 || y === 62 ? 2.4 : 1.1) + '"/>'; }).join('') +
        [10, 24, 38, 50, 64, 76].map(function (x) { return '<path d="M' + x + ' 0V90" stroke-width="' + (x === 38 ? 2.4 : 1.1) + '"/>'; }).join('') +
        '</g>' +
        '<text class="m-label" x="2" y="29">' + t('streetA') + '</text><text class="m-label" x="39.2" y="4" transform="rotate(90 39.2 4)">' + t('streetB') + '</text><text class="m-label" x="62" y="70">' + t('river') + '</text>';
      var showDrops = [];
      var routes = '';
      if (mode === 'order' && sel) {
        var shopPos = SHOPS[sel.shop].pos, from = sel.status === 'assign' ? (sug ? sug.pos : null) : (sel.rider ? rider(sel.rider).pos : null);
        if (from && sel.status !== 'delivering' && sel.status !== 'done') routes += '<path class="m-route-r" d="' + routePath(from, shopPos) + '"/>';
        routes += '<path class="m-route-d" d="' + routePath(shopPos, DROPS[sel.drop].pos) + '"/>';
        showDrops.push(sel.drop);
      }
      if (mode === 'rider' && focus) {
        var fr = rider(focus), pts = [fr.pos];
        orders.filter(function (o) { return o.rider === focus && o.status === 'pickup'; }).forEach(function (o) { pts.push(SHOPS[o.shop].pos); });
        orders.filter(function (o) { return o.rider === focus && (o.status === 'pickup' || o.status === 'delivering'); }).forEach(function (o) { pts.push(DROPS[o.drop].pos); showDrops.push(o.drop); });
        var d = 'M' + pts[0][0] + ' ' + pts[0][1];
        for (var i = 1; i < pts.length; i++) d += 'H' + pts[i][0] + 'V' + pts[i][1];
        routes += '<path class="m-route-f" d="' + d + '"/>';
      }
      s += routes;
      var relShops = {};
      if (mode === 'order' && sel) relShops[sel.shop] = 1;
      if (mode === 'rider' && focus) orders.forEach(function (o) { if (o.rider === focus && o.status === 'pickup') relShops[o.shop] = 1; });
      var anyRel = Object.keys(relShops).length > 0;
      Object.keys(SHOPS).forEach(function (k) {
        var p = SHOPS[k].pos;
        s += '<g class="m-pin' + (anyRel && !relShops[k] ? ' is-faded' : '') + '"><rect x="' + (p[0] - 2.2) + '" y="' + (p[1] - 2.2) + '" width="4.4" height="4.4" rx="1.1" fill="#2b8a57" stroke="#fff" stroke-width=".5"/><text x="' + p[0] + '" y="' + p[1] + '">' + t('p') + '</text></g>';
      });
      showDrops.forEach(function (k) {
        var p = DROPS[k].pos;
        s += '<g class="m-pin"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.3" fill="#6a4fd6" stroke="#fff" stroke-width=".5"/><text x="' + p[0] + '" y="' + p[1] + '">' + t('d') + '</text></g>';
      });
      riders.forEach(function (r) {
        var l = load(r), isSug = sug && sug.id === r.id, isFocus = focus === r.id && mode === 'rider';
        var faded = (mode === 'rider' && focus && !isFocus) || (mode === 'order' && sel && sel.status === 'assign' && sug && !isSug && l < r.cap ? false : false);
        s += '<g class="m-rider' + (l >= r.cap ? ' is-full' : '') + (faded ? ' is-faded' : '') + '" data-rider="' + r.id + '">' +
          (isSug || isFocus ? '<circle class="m-pulse" cx="' + r.pos[0] + '" cy="' + r.pos[1] + '" r="2.6"/>' : '') +
          '<circle class="m-body" cx="' + r.pos[0] + '" cy="' + r.pos[1] + '" r="2.6" fill="#b7740b" stroke="#fff" stroke-width=".5"/>' +
          (isSug || isFocus ? '<circle class="m-ring" cx="' + r.pos[0] + '" cy="' + r.pos[1] + '" r="3.6"/>' : '') +
          '<text x="' + r.pos[0] + '" y="' + r.pos[1] + '">' + initials(r) + '</text></g>';
      });
      return s + '</svg>';
    }

    function render() {
      var lists = $$('.cx-list', body).map(function (l) { return l.scrollTop; });
      cx.setAttribute('lang', lang === 'zh' ? 'zh-Hans' : 'en');
      var sel = selected ? byId(selected) : null;
      var ranked = sel && sel.status === 'assign' ? rank(sel) : [];
      var sug = ranked[0] ? ranked[0].r : null;

      top.innerHTML =
        '<div class="cx-brand"><span class="cx-dot"></span><b>' + t('title') + '</b><span class="cx-station">' + t('station') + '</span><span class="cx-demo">' + t('demo') + '</span></div>' +
        '<div class="cx-kpis"><span class="' + (count('assign') > 4 ? 'is-warn' : '') + '"><b>' + count('assign') + '</b> ' + t('toAssign') + '</span><span><b>' + (count('pickup') + count('delivering')) + '</b> ' + t('onRoad') + '</span><span><b>' + riders.length + '</b> ' + t('ridersOn') + '</span></div>' +
        '<div class="cx-actions"><button type="button" class="cx-spike" data-spike>' + t('spike') + '</button>' +
        '<span class="cx-seg" role="group" aria-label="' + t('lang') + '"><button type="button" data-lang="en" aria-pressed="' + (lang === 'en') + '">EN</button><button type="button" data-lang="zh" aria-pressed="' + (lang === 'zh') + '">中文</button></span></div>';

      modeBar.innerHTML = '<span class="cx-seg" role="group"><button type="button" data-mode="order" aria-pressed="' + (mode === 'order') + '">' + t('modeOrder') + '</button><button type="button" data-mode="rider" aria-pressed="' + (mode === 'rider') + '">' + t('modeRider') + '</button></span><span class="cx-hint">' + (mode === 'order' ? t('hintOrder') : t('hintRider')) + '</span>';

      // Orders
      var list, banner = '';
      if (mode === 'rider' && focus) {
        var fr = rider(focus);
        list = orders.filter(function (o) { return o.rider === focus && (o.status === 'pickup' || o.status === 'delivering'); });
        banner = '<p class="cx-filter"><span>' + t('showing', { name: L(fr.n), n: list.length }) + '</span><button type="button" data-clear>' + t('clear') + '</button></p>';
      } else {
        list = orders.filter(function (o) { return o.status === tab; });
        if (tab === 'assign') list.sort(function (a, b) { return (b.prio - a.prio) || (a.mins - b.mins); });
        else list.sort(function (a, b) { return a.mins - b.mins; });
      }
      var tabsHtml = ['assign', 'pickup', 'delivering', 'done'].map(function (k) {
        var on = !(mode === 'rider' && focus) && tab === k;
        return '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + on + '">' + t('tabs.' + k) + '<i>' + count(k) + '</i></button>';
      }).join('');
      var ordersHtml = '<div class="cx-tabs" role="tablist">' + tabsHtml + '</div><ul class="cx-list">' + banner +
        (list.length ? list.map(orderCard).join('') : '<li class="cx-empty">' + (tab === 'assign' ? t('allDone') : t('noOrders')) + '</li>') + '</ul>';

      // Suggestion
      var suggHtml = '';
      if (mode === 'order') {
        if (!sel) suggHtml = '<p class="cx-sugg-why">' + (count('assign') ? t('noneSel') : t('allDone')) + '</p>';
        else if (sel.status === 'assign') {
          if (!sug) suggHtml = '<p class="cx-sugg-k">' + t('sugg') + '</p><p class="cx-sugg-skip">' + t('noRider') + '</p>';
          else {
            var top0 = ranked[0], alt = ranked[1], nr = nearest(sel);
            suggHtml = '<p class="cx-sugg-k">' + t('sugg') + ' · ' + sel.code + '</p>' +
              '<p class="cx-sugg-main">' + t('suggMain', { name: L(sug.n), lv: lvName(sug), l: top0.l, c: sug.cap, d: km(top0.d) }) + '</p>' +
              '<p class="cx-sugg-why">' + t('why') + (alt ? ' ' + t('next', { name: L(alt.r.n), l: alt.l, c: alt.r.cap, d: km(alt.d) }) : '') + '</p>' +
              (nr && nr.r.id !== sug.id && nr.l >= nr.r.cap ? '<p class="cx-sugg-skip">' + t('skip', { name: L(nr.r.n), l: nr.l, c: nr.r.cap }) + '</p>' : '') +
              '<div class="cx-sugg-actions"><button type="button" class="cx-btn is-primary" data-approve="' + sug.id + '">' + t('approve') + '</button>' +
              (alt ? '<button type="button" class="cx-btn" data-approve="' + alt.r.id + '">' + t('assignTo', { name: L(alt.r.n) }) + '</button>' : '') + '</div>';
          }
        } else if (sel.rider) {
          var rr = rider(sel.rider);
          suggHtml = '<p class="cx-sugg-k">' + sel.code + ' · ' + t('tabs.' + sel.status) + '</p><p class="cx-sugg-main">' + t('riderLine', { name: '<b>' + L(rr.n) + '</b>' }) + ' · ' + lvName(rr) + ' · ' + load(rr) + '/' + rr.cap + '</p>';
        }
      }

      // Riders
      var rows = riders.slice();
      var rankIndex = {};
      ranked.forEach(function (x, i) { rankIndex[x.r.id] = i; });
      if (ranked.length) rows.sort(function (a, b) { var ia = a.id in rankIndex ? rankIndex[a.id] : 99, ib = b.id in rankIndex ? rankIndex[b.id] : 99; return ia - ib; });
      var ridersHtml = '<div class="cx-rh"><b>' + t('riders') + '</b><span>' + t('loadHint') + '</span></div><ul class="cx-list">' + rows.map(function (r) {
        var l = load(r), pct = Math.round(100 * l / r.cap), full = l >= r.cap;
        var kmTxt = sel && sel.status === 'assign' && mode === 'order' ? t('km', { d: km(dist(r.pos, SHOPS[sel.shop].pos)) }) : '';
        return '<li><button type="button" class="cx-rider' + (sug && sug.id === r.id && mode === 'order' ? ' is-sugg' : '') + (focus === r.id && mode === 'rider' ? ' is-focus' : '') + (full ? ' is-full' : '') + (shake === r.id ? ' is-shake' : '') + '" data-rider="' + r.id + '">' +
          '<span class="cx-av">' + initials(r) + '</span>' +
          '<span class="cx-r-main"><b>' + L(r.n) + '</b></span>' +
          '<span class="cx-r-km">' + (full ? t('full') : kmTxt) + '</span>' +
          '<span class="cx-load"><span class="cx-lv' + (r.lv === 'new' ? ' is-new' : '') + '">' + lvName(r) + '</span><span class="cx-bar"><i class="' + (full ? 'is-full' : pct >= 60 ? 'is-mid' : '') + '" style="width:' + pct + '%"></i></span><span>' + l + '/' + r.cap + '</span></span>' +
          '</button></li>';
      }).join('') + '</ul>';

      body.innerHTML = '<section class="cx-orders">' + ordersHtml + '</section>' +
        '<section class="cx-map"><div class="cx-map-canvas">' + mapSVG(sel, sug) + '</div>' + (suggHtml ? '<div class="cx-sugg" aria-live="polite">' + suggHtml + '</div>' : '') + '</section>' +
        '<section class="cx-riders">' + ridersHtml + '</section>';
      $$('.cx-list', body).forEach(function (l, i) { if (lists[i]) l.scrollTop = lists[i]; });
      orders.forEach(function (o) { o.isNew = false; });
      shake = null;
    }

    function assign(oid, rid) {
      var o = byId(oid), r = rider(rid);
      if (!o || !r || o.status !== 'assign') return;
      var l = load(r);
      if (l >= r.cap) { shake = rid; toast(t('capWarn', { name: L(r.n), l: l, c: r.cap }), true); render(); return; }
      o.status = 'pickup'; o.rider = rid;
      toast(t('assigned', { o: o.code, name: L(r.n) }));
      var next = orders.filter(function (x) { return x.status === 'assign'; }).sort(function (a, b) { return (b.prio - a.prio) || (a.mins - b.mins); })[0];
      selected = next ? next.id : null;
      render();
    }

    function spike() {
      spikes++;
      var drops = ['d1', 'd2', 'd5', 'd7', 'd3', 'd8'], made = [];
      for (var i = 0; i < 4; i++) {
        var id = 'sp' + spikes + '_' + i, n = 2050 + spikes * 10 + i;
        var o = O(id, '#' + n, 's5', drops[(i + spikes) % drops.length], 'camp', 'assign', { res: 1, prio: i < 2, due: ['13:00', '13:10', '17:30', '18:00'][i], mins: [58, 68, 300, 330][i] });
        o.isNew = true; orders.push(o); made.push(o);
      }
      mode = 'order'; focus = null; tab = 'assign'; selected = made[0].id;
      toast(t('spiked', { n: made.length }));
      render();
    }

    cx.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lang],[data-mode],[data-tab],[data-order],[data-rider],[data-approve],[data-clear],[data-spike]');
      if (!b || !cx.contains(b)) return;
      if (b.hasAttribute('data-lang')) { lang = b.getAttribute('data-lang'); render(); return; }
      if (b.hasAttribute('data-spike')) { spike(); return; }
      if (b.hasAttribute('data-mode')) {
        mode = b.getAttribute('data-mode'); focus = null;
        if (mode === 'order' && !selected) { var f = orders.filter(function (o) { return o.status === 'assign'; })[0]; selected = f ? f.id : null; }
        if (mode === 'rider') focus = riders[0].id;
        render(); return;
      }
      if (b.hasAttribute('data-tab')) { tab = b.getAttribute('data-tab'); if (mode === 'rider') { mode = 'order'; focus = null; } render(); return; }
      if (b.hasAttribute('data-clear')) { focus = null; mode = 'order'; render(); return; }
      if (b.hasAttribute('data-approve')) { assign(selected, b.getAttribute('data-approve')); return; }
      if (b.hasAttribute('data-order')) { selected = b.getAttribute('data-order'); mode = 'order'; focus = null; render(); return; }
      if (b.hasAttribute('data-rider')) {
        var rid = b.getAttribute('data-rider'), sel = selected && byId(selected);
        if (mode === 'order' && sel && sel.status === 'assign') { assign(sel.id, rid); return; }
        mode = 'rider'; focus = rid; render();
      }
    });
    cx.addEventListener('dragstart', function (e) {
      var card = e.target.closest && e.target.closest('[data-order][draggable]');
      if (!card) return;
      e.dataTransfer.setData('text/plain', card.getAttribute('data-order'));
      e.dataTransfer.effectAllowed = 'move';
    });
    cx.addEventListener('dragover', function (e) {
      var row = e.target.closest && e.target.closest('.cx-rider');
      if (!row) return;
      e.preventDefault(); row.classList.add('is-drop');
    });
    cx.addEventListener('dragleave', function (e) { var row = e.target.closest && e.target.closest('.cx-rider'); if (row) row.classList.remove('is-drop'); });
    cx.addEventListener('drop', function (e) {
      var row = e.target.closest && e.target.closest('.cx-rider');
      if (!row) return;
      e.preventDefault();
      var oid = e.dataTransfer.getData('text/plain');
      selected = oid; mode = 'order';
      assign(oid, row.getAttribute('data-rider'));
    });
    render();
  }
})();
