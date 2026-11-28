(function () {
  'use strict';

  var KEY = 'gs_visit_stats_v1';
  var SESSION_GAP = 30 * 60 * 1000; // 30 分钟内的刷新视为同一次访问
  var now = Date.now();
  var prevLast = 0;
  var count = 1;

  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var o = JSON.parse(raw);
      if (o && typeof o.count === 'number' && isFinite(o.count)) {
        prevLast = Number(o.last) || 0;
        count = now - prevLast < SESSION_GAP ? o.count : o.count + 1;
        if (count < 1) count = 1;
      }
    }
    localStorage.setItem(KEY, JSON.stringify({ count: count, last: now }));
  } catch (e) {
    /* 隐私模式或禁用 localStorage 时退化为本次访问 */
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function fmt(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  var ICON_EYE = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';
  var ICON_CLOCK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';

  var CSS = [
    '@media (min-width:769px){aside.gs-panel{position:relative}}',
    'aside.gs-panel .gs-list-wrap{padding-bottom:104px}',
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
    '.gs-visit-num{font-weight:700;color:#0d47a1;font-size:13px;letter-spacing:.2px}',
    '.gs-visit-time{color:#37474f;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis}',
    '.gs-visit-unit{color:#6b7a8c;margin-left:1px}',
    '.gs-visit-tag{margin-left:auto;font-size:10px;color:#1565c0;opacity:.75}',
    '.gs-panel.collapsed .gs-visit-card{opacity:0}',
    '@media (max-width:768px){.gs-visit-card{left:12px;right:12px;bottom:16px}}'
  ].join('\n');

  var lastVisitText = prevLast ? fmt(prevLast) : '首次访问';

  function build() {
    var card = document.createElement('div');
    card.className = 'gs-visit-card';
    card.setAttribute('aria-label', '访问统计');
    card.title = '访问次数与最后访问时间统计自当前浏览器';
    card.innerHTML =
      '<div class="gs-visit-row">' + ICON_EYE +
        '<span class="gs-visit-label">访问次数</span>' +
        '<span class="gs-visit-num">' + count + '</span><span class="gs-visit-unit">次</span>' +
      '</div>' +
      '<div class="gs-visit-row">' + ICON_CLOCK +
        '<span class="gs-visit-label">最后访问</span>' +
        '<span class="gs-visit-time" title="上一次打开本页的时间">' + lastVisitText + '</span>' +
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
    if (!document.querySelector('.gs-visit-card')) ensure();
  }).observe(document.body, { childList: true, subtree: true });
})();
