(function () {
  'use strict';

  var KEY = 'gs_visit_stats_v1';
  var SESSION_GAP = 30 * 60 * 1000; // 30 分钟内的刷新视为同一次访问

  var now = Date.now();
  var prevLast = 0;
  var localCount = 1;

  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var o = JSON.parse(raw);
      if (o && typeof o.count === 'number' && isFinite(o.count)) {
        prevLast = Number(o.last) || 0;
        localCount = now - prevLast < SESSION_GAP ? o.count : o.count + 1;
        if (localCount < 1) localCount = 1;
      }
    }
    localStorage.setItem(KEY, JSON.stringify({ count: localCount, last: now }));
  } catch (e) {
    /* 隐私模式或禁用 localStorage 时退化为本次访问 */
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function fmt(ts) {
    if (!ts) return '首次访问';
    var d = new Date(ts);
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function num(n) {
    n = Number(n);
    if (!isFinite(n)) return '—';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  var ICON_EYE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';
  var ICON_USER = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  var ICON_CLOCK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';

  var CSS = [
    '@media (min-width:769px){aside.gs-panel{position:relative}}',
    'aside.gs-panel .gs-list-wrap{padding-bottom:126px}',
    '.gs-visit-card{',
    '  position:absolute;left:10px;right:10px;bottom:10px;z-index:6;',
    '  padding:9px 12px;border-radius:12px;',
    '  background:linear-gradient(180deg,rgba(247,251,255,.70) 0%,rgba(255,255,255,.93) 100%);',
    '  -webkit-backdrop-filter:blur(14px) saturate(150%);backdrop-filter:blur(14px) saturate(150%);',
    '  border:1px solid rgba(21,101,192,.18);',
    '  box-shadow:0 8px 22px rgba(13,71,161,.12),inset 0 1px 0 rgba(255,255,255,.75);',
    '  display:flex;flex-direction:column;gap:5px;',
    '  font-size:11.5px;line-height:1.5;color:#546274;',
    '  pointer-events:none;user-select:none;',
    '  transition:opacity .25s ease;',
    '}',
    '.gs-visit-row{display:flex;align-items:center;gap:6px;min-width:0;white-space:nowrap}',
    '.gs-visit-row svg{flex:none;color:#1565c0;opacity:.85}',
    '.gs-visit-label{color:#6b7a8c}',
    '.gs-visit-num{font-weight:700;color:#0d47a1;font-size:13px;letter-spacing:.2px;font-variant-numeric:tabular-nums}',
    '.gs-visit-time{color:#37474f;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}',
    '.gs-visit-unit{color:#6b7a8c;margin-left:1px}',
    '.gs-panel.collapsed .gs-visit-card{opacity:0}',
    '@media (max-width:768px){.gs-visit-card{left:12px;right:12px;bottom:16px}}'
  ].join('\n');

  function build() {
    var card = document.createElement('div');
    card.className = 'gs-visit-card';
    card.setAttribute('aria-label', '访问统计');
    card.title = '累计访问与独立访客为全站统计；上次访问为当前浏览器上次打开时间';
    card.innerHTML =
      '<div class="gs-visit-row">' + ICON_EYE +
        '<span class="gs-visit-label">累计访问</span>' +
        '<span class="gs-visit-num" data-k="pv">' + num(localCount) + '</span><span class="gs-visit-unit">次</span>' +
      '</div>' +
      '<div class="gs-visit-row">' + ICON_USER +
        '<span class="gs-visit-label">独立访客</span>' +
        '<span class="gs-visit-num" data-k="uv">—</span><span class="gs-visit-unit">人</span>' +
      '</div>' +
      '<div class="gs-visit-row">' + ICON_CLOCK +
        '<span class="gs-visit-label">上次访问</span>' +
        '<span class="gs-visit-time" title="当前浏览器上一次打开本页的时间">' + fmt(prevLast) + '</span>' +
      '</div>';
    return card;
  }

  function ensure() {
    var panel = document.querySelector('.gs-panel');
    if (!panel) return false;
    if (panel.querySelector('.gs-visit-card')) return true;
    panel.appendChild(build());
    return true;
  }

  function injectCss() {
    if (document.getElementById('gs-visit-stats-css')) return;
    var st = document.createElement('style');
    st.id = 'gs-visit-stats-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  var lastData = null;

  function renderCounters(data) {
    if (!data) return;
    lastData = data;
    var card = document.querySelector('.gs-visit-card');
    if (!card) return;
    var pv = card.querySelector('[data-k="pv"]');
    var uv = card.querySelector('[data-k="uv"]');
    if (pv && data.pv != null) pv.textContent = num(data.pv);
    if (uv && data.uv != null) uv.textContent = num(data.uv);
  }

  function loadCounters() {
    var host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '') return; // 本地预览不计数
    var url = location.origin + location.pathname;
    if (!/\/$/.test(url)) {
      // 统一到目录形式，避免路径末尾斜杠造成重复统计
      if (!/\.[a-z0-9]+$/i.test(url)) url += '/';
    }
    try {
      fetch('https://cdn.busuanzi.cc/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url, referrer: document.referrer || '' }),
        cache: 'no-store'
      })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          renderCounters({
            pv: r.busuanzi_page_pv != null ? r.busuanzi_page_pv : r.busuanzi_site_pv,
            uv: r.busuanzi_page_uv != null ? r.busuanzi_page_uv : r.busuanzi_site_uv
          });
        })
        .catch(function () { /* 统计服务不可用时保留本地数值 */ });
    } catch (e) {
      /* fetch 不可用 */
    }
  }

  injectCss();

  if (!ensure()) {
    var tries = 0;
    var timer = setInterval(function () {
      tries += 1;
      if (ensure() || tries > 60) clearInterval(timer);
    }, 300);
  }

  // React 重渲染后若节点被移除，自动补回
  new MutationObserver(function () {
    if (!document.querySelector('.gs-visit-card')) {
      ensure();
      renderCounters(lastData);
    }
  }).observe(document.body, { childList: true, subtree: true });

  loadCounters();
})();
