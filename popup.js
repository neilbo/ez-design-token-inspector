const $ = (id) => document.getElementById(id);
let tokens = [];
let lastData = null;

// ---------------------------------------------------------------------------
// Injected into the page to list all CSS variables (the popup token list).
// Must be fully self-contained (no outer references).
// ---------------------------------------------------------------------------
function collectVars() {
  const found = new Map();
  let blocked = 0, total = 0;

  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.style) {
        for (let i = 0; i < rule.style.length; i++) {
          const prop = rule.style[i];
          if (prop.startsWith('--') && !found.has(prop)) {
            found.set(prop, rule.style.getPropertyValue(prop).trim());
          }
        }
      }
      if (rule.cssRules) {
        try { walk(rule.cssRules); } catch (e) { /* nested cross-origin */ }
      }
    }
  };

  for (const sheet of document.styleSheets) {
    total++;
    try { walk(sheet.cssRules); } catch (e) { blocked++; }
  }

  const rootCS = getComputedStyle(document.documentElement);
  const out = [];
  for (const [name, authored] of found) {
    const resolved = rootCS.getPropertyValue(name).trim();
    const value = resolved || authored;
    if (value === '') continue;
    out.push({ name, value, isColor: CSS.supports('color', value) });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return { tokens: out, blocked, total };
}

// ---------------------------------------------------------------------------
// Injected into the page to toggle the element-inspector. Returns { active }.
// Lives on `window.__dtfInspector` so a second call tears it down.
// Fully self-contained.
// ---------------------------------------------------------------------------
function toggleInspector() {
  const KEY = '__dtfInspector';
  if (window[KEY]) { window[KEY].destroy(); return { active: false }; }

  const cursorStyle = document.createElement('style');
  cursorStyle.textContent = '*{cursor:crosshair !important;}';
  document.head.appendChild(cursorStyle);

  const host = document.createElement('div');
  host.style.cssText = 'all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'open' });
  document.documentElement.appendChild(host);
  shadow.innerHTML = `
    <style>
      .box{position:fixed;border:2px solid #5b53ff;background:rgba(91,83,255,.12);border-radius:2px;pointer-events:none;}
      .box.lock{border-color:#ffce7a;background:rgba(255,206,122,.14);}
      .tip{position:fixed;max-width:340px;background:#1e1e22;color:#eee;font:12px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);overflow:hidden;pointer-events:none;}
      .tip h4{margin:0;padding:8px 10px;background:#27272c;font:600 11px ui-monospace,Menlo,monospace;color:#c8c8cc;}
      .tip ul{margin:0;padding:4px 0;list-style:none;max-height:240px;overflow:auto;}
      .tip li{display:flex;align-items:baseline;gap:6px;padding:5px 10px;flex-wrap:wrap;}
      .sw{width:12px;height:12px;border-radius:3px;border:1px solid rgba(255,255,255,.2);flex:none;align-self:center;}
      .p{color:#9a9aa0;} .v{color:#8ac6ff;font-family:ui-monospace,Menlo,monospace;word-break:break-all;}
      .rv{color:#888;width:100%;padding-left:18px;font-family:ui-monospace,Menlo,monospace;word-break:break-word;}
      .empty{padding:8px 10px;color:#999;}
      .bar{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#1e1e22;color:#eee;font:12px -apple-system,sans-serif;border-radius:999px;padding:8px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.35);pointer-events:auto;white-space:nowrap;}
      .bar b{color:#fff;} .bar span{color:#999;}
      .bar button{all:unset;cursor:pointer;color:#fff;padding:5px 10px;border-radius:6px;}
      .bar button.ghost{background:#3a3a40;display:flex;align-items:center;gap:5px;}
      .bar button.ghost:hover{background:#4a4a52;}
      .bar button#hover{color:#fff;}
      .bar button#hover .hl{color:#fff;}
      .bar button#hover.off{background:#5b53ff;color:#fff;}
      .bar button#hover.off:hover{background:#4a43e0;}
      .bar button.primary{background:#e5484d;}
      .bar button.primary:hover{background:#d13438;}
      .box.pin{border-color:#3ddc97;background:rgba(61,220,151,.10);}
      .tip.pin,.tip.locked{pointer-events:auto;cursor:grab;user-select:none;}
      .tip.pin:active,.tip.locked:active{cursor:grabbing;}
      .tip.pin h4{display:flex;align-items:center;gap:8px;}
      .close{all:unset;cursor:pointer;margin-left:auto;color:#ff8a8a;font-size:13px;line-height:1;padding:1px 5px;border-radius:4px;}
      .close:hover{background:#4a1f1f;}
      .bar button.off{background:#2a2a30;color:#888;}
      .bar button .key{color:inherit;opacity:.7;font-size:14px;margin-left:2px;}
    </style>
    <div class="pins"></div>
    <div class="box" hidden></div>
    <div class="tip" hidden></div>
    <div class="bar">
      <b>Inspecting tokens</b>
      <span id="hint">click = lock · dbl-click = parent</span>
      <button id="hover" class="ghost" title="Toggle the live hover highlight"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M7 2l13 8.5-5.7 1.2 3.5 6.4-2.6 1.4-3.5-6.4L7 18z"/></svg><span class="hl">Hover: off</span> <span class="key">(h)</span></button>
      <button id="clear" class="ghost" title="Remove all pinned overlays">Clear <span class="key">(c)</span></button>
      <button id="shot" class="ghost" title="Capture a PNG of the visible area">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 3l-1.7 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.3L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
        Screenshot <span class="key">(s)</span>
      </button>
      <button id="x" class="primary">Exit <span class="key">(esc)</span></button>
    </div>`;

  const box = shadow.querySelector('.box');
  const tip = shadow.querySelector('.tip');
  const bar = shadow.querySelector('.bar');
  const pinsEl = shadow.querySelector('.pins');
  const hintEl = shadow.getElementById('hint');
  shadow.getElementById('x').addEventListener('click', () => destroy());
  shadow.getElementById('shot').addEventListener('click', () => capture());
  shadow.getElementById('clear').addEventListener('click', () => clearPins());

  // Live hover highlight can be paused so it stops following the cursor (and
  // doesn't sit over an element while you line up a screenshot or review pins).
  let hoverOn = true;
  const hoverBtn = shadow.getElementById('hover');
  const hoverLbl = hoverBtn.querySelector('.hl');
  const toggleHover = () => {
    hoverOn = !hoverOn;
    hoverLbl.textContent = hoverOn ? 'Hover: off' : 'Hover: on';
    hoverBtn.classList.toggle('off', !hoverOn);
    if (!hoverOn) { box.hidden = true; tip.hidden = true; }
  };
  hoverBtn.addEventListener('click', toggleHover);

  // Visual-audit mode: clicks pin persistent overlays instead of moving one.
  let auditMode = false;
  const pins = [];
  const updateHint = () => {
    hintEl.textContent = auditMode
      ? 'click = pin · dbl-click = parent'
      : 'click = lock · dbl-click = parent';
  };
  const onStorage = (changes, area) => {
    if (area === 'local' && changes.dtfAuditMode) {
      auditMode = changes.dtfAuditMode.newValue === true;
      updateHint();
    }
  };
  chrome.storage.onChanged.addListener(onStorage);
  chrome.storage.local.get('dtfAuditMode', (res) => { auditMode = res.dtfAuditMode === true; updateHint(); });

  function capture() {
    // The control toolbar is never in the shot. The "Include overlay" preference
    // decides whether the highlight box + token tooltip are kept (annotated shot)
    // or hidden too (clean DevTools-style capture). Wait for a real repaint, then
    // the worker captures the tab and saves the PNG.
    const tag = current ? shortSel(current).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') : 'page';
    chrome.storage.local.get('dtfIncludeOverlay', (res) => {
      const includeOverlay = res.dtfIncludeOverlay !== false; // default: include
      // Always hide the toolbar, and the transient live hover highlight unless
      // it's locked (a locked tooltip is the annotation in normal mode). Pins are
      // kept when including the overlay. Off => hide everything for a clean shot.
      const hideLive = !locked;
      if (includeOverlay) {
        bar.style.visibility = 'hidden';
        if (hideLive) { box.style.display = 'none'; tip.style.display = 'none'; }
      } else {
        host.style.display = 'none';
      }
      setTimeout(() => {
        chrome.runtime.sendMessage(
          { type: 'dtf:capture', filename: `design-tokens-${tag || 'page'}.png` },
          (resp) => {
            bar.style.visibility = '';
            box.style.display = '';
            tip.style.display = '';
            host.style.display = '';
            if (chrome.runtime.lastError || !resp || !resp.ok) {
              console.warn('[Design Token Inspector] screenshot failed:', chrome.runtime.lastError?.message || resp?.error);
            }
          }
        );
      }, 120);
    });
  }

  let current = null, locked = false, clickTimer = null, dragging = false;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shortSel = (el) => {
    let s = el.tagName ? el.tagName.toLowerCase() : 'node';
    if (el.id) s += '#' + el.id;
    const cls = ((el.getAttribute && el.getAttribute('class')) || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (cls.length) s += '.' + cls.join('.');
    return s;
  };

  function collect(el) {
    const seen = new Set(), usages = [];
    const re = /var\(\s*(--[A-Za-z0-9_-]+)/g;
    const cs = getComputedStyle(el);
    // Parse the authored declaration text so shorthands that contain var()
    // (e.g. `font: var(--textBodyBoldMedium)`) are captured. Iterating the
    // longhand properties would miss them — a var() shorthand can't expand,
    // so its longhands read back as empty.
    const scan = (cssText) => {
      if (!cssText) return;
      for (const decl of cssText.split(';')) {
        const idx = decl.indexOf(':');
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim();
        const val = decl.slice(idx + 1).trim();
        if (!prop || prop.startsWith('--')) continue; // skip custom-prop definitions
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(val))) {
          const name = m[1], key = prop + '|' + name;
          if (seen.has(key)) continue;
          seen.add(key);
          const resolved = cs.getPropertyValue(name).trim(); // resolves var chains
          usages.push({ prop, name, resolved, isColor: !!resolved && CSS.supports('color', resolved) });
        }
      }
    };
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.selectorText && rule.style) {
          let matched = false;
          for (const sel of rule.selectorText.split(',')) {
            try { if (el.matches(sel.trim())) { matched = true; break; } } catch (e) { /* pseudo */ }
          }
          if (matched) scan(rule.style.cssText);
        }
        if (rule.cssRules) { try { walk(rule.cssRules); } catch (e) {} }
      }
    };
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      walk(rules);
    }
    if (el.style && el.style.length) scan(el.style.cssText);
    return usages;
  }

  function tokensHtml(el) {
    const usages = collect(el);
    return usages.length
      ? '<ul>' + usages.map((u) =>
          `<li>${u.isColor
            ? `<span class="sw" style="background:${esc(u.resolved)}"></span>`
            : '<span class="sw" style="background:transparent;border-color:transparent"></span>'}` +
          `<span class="p">${esc(u.prop)}:</span> <span class="v">var(${esc(u.name)})</span>` +
          `<span class="rv">${esc(u.resolved || '')}</span></li>`
        ).join('') + '</ul>'
      : '<div class="empty">No token variables used here.</div>';
  }

  function renderTip(el) {
    tip.innerHTML = `<h4>${esc(shortSel(el))}${locked ? ' 🔒' : ''}</h4>${tokensHtml(el)}`;
    tip.hidden = false;
    tip._dragged = false; // re-rendered for a new target -> reposition fresh
  }

  // Position a box/tip pair over `el`. Shared by the live highlight and pins.
  // A tooltip the user has dragged keeps its position (only the box re-anchors).
  function place(boxEl, tipEl, el) {
    const r = el.getBoundingClientRect();
    boxEl.style.left = r.left + 'px';
    boxEl.style.top = r.top + 'px';
    boxEl.style.width = r.width + 'px';
    boxEl.style.height = r.height + 'px';
    boxEl.hidden = false;
    if (tipEl._dragged) return;
    const tw = tipEl.offsetWidth || 340, th = tipEl.offsetHeight || 100;
    let tx = Math.min(r.left, window.innerWidth - tw - 8);
    let ty = r.bottom + 8;
    if (ty + th > window.innerHeight) ty = Math.max(8, r.top - th - 8);
    tipEl.style.left = Math.max(8, tx) + 'px';
    tipEl.style.top = ty + 'px';
  }

  function position(el) {
    place(box, tip, el);
    box.classList.toggle('lock', locked);
    tip.classList.toggle('locked', locked); // enables pointer-events + drag
  }

  // Drag a tooltip from anywhere on its surface (locked live tip or pinned tips).
  // The close button is excluded, and a small movement threshold keeps plain
  // clicks working. The dragged tip is clamped so it can't be lost off-screen.
  function onDragStart(e) {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('.close')) return;
    const tipEl = e.target.closest && e.target.closest('.tip');
    if (!tipEl) return;
    const startX = e.clientX, startY = e.clientY;
    const r = tipEl.getBoundingClientRect();
    const offX = startX - r.left, offY = startY - r.top;
    let active = false;
    const move = (ev) => {
      if (!active) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 4) return;
        active = true;
        dragging = true;
        tipEl._dragged = true;
        const sel = window.getSelection && window.getSelection();
        if (sel) sel.removeAllRanges();
      }
      ev.preventDefault();
      const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
      const nx = Math.max(-(w - 80), Math.min(window.innerWidth - 80, ev.clientX - offX));
      const ny = Math.max(0, Math.min(window.innerHeight - 28, ev.clientY - offY));
      tipEl.style.left = nx + 'px';
      tipEl.style.top = ny + 'px';
    };
    const up = () => {
      dragging = false;
      document.removeEventListener('mousemove', move, true);
      document.removeEventListener('mouseup', up, true);
    };
    document.addEventListener('mousemove', move, true);
    document.addEventListener('mouseup', up, true);
  }
  shadow.addEventListener('mousedown', onDragStart, true);

  function setTarget(el) {
    if (!el || el === document.documentElement) return;
    current = el;
    renderTip(el);
    position(el);
  }

  // Persistent overlay (audit mode). Stays put with its own close button.
  function addPin(el) {
    if (!el || el === document.documentElement) return;
    const b = document.createElement('div');
    b.className = 'box pin';
    const t = document.createElement('div');
    t.className = 'tip pin';
    t.innerHTML = `<h4>${esc(shortSel(el))}<button class="close" title="Remove">✕</button></h4>${tokensHtml(el)}`;
    pinsEl.appendChild(b);
    pinsEl.appendChild(t);
    const pin = { el, box: b, tip: t };
    pins.push(pin);
    t.querySelector('.close').addEventListener('click', () => removePin(pin));
    place(b, t, el);
  }

  function removePin(pin) {
    pin.box.remove();
    pin.tip.remove();
    const i = pins.indexOf(pin);
    if (i >= 0) pins.splice(i, 1);
  }

  function clearPins() {
    for (const p of pins) { p.box.remove(); p.tip.remove(); }
    pins.length = 0;
  }

  const inHost = (e) => e.composedPath().includes(host);
  const onMove = (e) => { if (!hoverOn || dragging || locked || inHost(e)) return; if (e.target && e.target !== current) setTarget(e.target); };
  const onClick = (e) => {
    if (inHost(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (auditMode) {
      // Disambiguate single vs double click so dbl-click-to-climb doesn't pin.
      const el = hoverOn ? (current || e.target) : e.target;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickTimer = null; addPin(el); }, 220);
    } else {
      locked = true;
      setTarget(e.target);
    }
  };
  const onDbl = (e) => {
    if (inHost(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
    const p = current && current.parentElement;
    if (p) { if (!auditMode) locked = true; setTarget(p); }
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { if (locked) { locked = false; if (current) { renderTip(current); position(current); } } else destroy(); return; }
    // Single-letter shortcuts: s = screenshot, c = clear pins, h = toggle hover.
    // Ignore when a modifier is held (e.g. Cmd+S) or while typing in a page field,
    // so they only fire as bare inspector shortcuts.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    const editable = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''));
    if (editable) return;
    const k = e.key.toLowerCase();
    if (k === 's') { e.preventDefault(); capture(); }
    else if (k === 'c') { e.preventDefault(); clearPins(); }
    else if (k === 'h') { e.preventDefault(); toggleHover(); }
  };
  const onScroll = () => { if (current && (locked || hoverOn)) position(current); for (const p of pins) place(p.box, p.tip, p.el); };

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('dblclick', onDbl, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll, true);

  function destroy() {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('dblclick', onDbl, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll, true);
    chrome.storage.onChanged.removeListener(onStorage);
    if (clickTimer) clearTimeout(clickTimer);
    host.remove();
    cursorStyle.remove();
    delete window[KEY];
  }

  window[KEY] = { destroy };
  return { active: true };
}

function isInspecting() { return !!window.__dtfInspector; }

// ---------------------------------------------------------------------------
// Popup logic
// ---------------------------------------------------------------------------
async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function scan() {
  setStatus('Scanning…');
  $('list').innerHTML = '';
  const tab = await activeTab();
  if (!tab?.id) return setStatus('No active tab.', true);

  let results;
  try {
    results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectVars });
  } catch (e) {
    return setStatus("Can't scan this page — open a normal http(s) tab.", true);
  }
  lastData = results?.[0]?.result;
  tokens = lastData?.tokens || [];
  render();
}

function render() {
  const filter = $('filter').value.trim().toLowerCase();
  const shown = tokens.filter(
    (t) => !filter || t.name.toLowerCase().includes(filter) || t.value.toLowerCase().includes(filter)
  );
  if (!tokens.length) return setStatus('No CSS variables found on this page.', true);

  let note = `${tokens.length} CSS variable${tokens.length === 1 ? '' : 's'}`;
  if (lastData?.blocked) note += ` · ${lastData.blocked}/${lastData.total} sheets blocked`;
  if (filter) note += ` · ${shown.length} shown`;
  setStatus(note);

  const list = $('list');
  list.innerHTML = '';
  for (const t of shown) {
    const li = document.createElement('li');
    const swatch = t.isColor
      ? `<span class="swatch"><span style="background:${escapeHtml(t.value)}"></span></span>`
      : `<span class="swatch"></span>`;
    li.innerHTML = `${swatch}<span class="meta"><span class="name">${escapeHtml(t.name)}</span><span class="value">${escapeHtml(t.value)}</span></span>`;
    li.addEventListener('click', () => copyVar(li, t.name));
    list.appendChild(li);
  }
}

async function refreshInspectButton() {
  const tab = await activeTab();
  if (!tab?.id) return;
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: isInspecting });
    setInspectActive(!!r?.[0]?.result);
  } catch (e) { /* restricted page */ }
}

function setInspectActive(active) {
  $('inspect').classList.toggle('active', active);
  $('inspect-label').textContent = active ? 'Stop inspecting' : 'Select Element';
}

$('inspect').addEventListener('click', async () => {
  const tab = await activeTab();
  if (!tab?.id) return;
  let r;
  try {
    r = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: toggleInspector });
  } catch (e) {
    return setStatus("Can't inspect this page — open a normal http(s) tab.", true);
  }
  const active = !!r?.[0]?.result?.active;
  setInspectActive(active);
  if (active) window.close(); // let the user interact with the page
});

function copyVar(li, name) {
  navigator.clipboard.writeText(`var(${name})`).then(() => {
    const nameEl = li.querySelector('.name');
    const original = nameEl.textContent;
    nameEl.textContent = 'copied var(' + name + ')';
    nameEl.classList.add('copied');
    setTimeout(() => { nameEl.textContent = original; nameEl.classList.remove('copied'); }, 900);
  });
}

function setStatus(text, warn = false) {
  const el = $('status');
  el.textContent = text;
  el.className = warn ? 'status warn' : 'status';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

const OVERLAY_KEY = 'dtfIncludeOverlay';
const AUDIT_KEY = 'dtfAuditMode';
async function initPrefs() {
  const res = await chrome.storage.local.get([OVERLAY_KEY, AUDIT_KEY]);
  $('overlay-shot').checked = res[OVERLAY_KEY] !== false; // default: on
  $('audit-mode').checked = res[AUDIT_KEY] === true;       // default: off
}
$('overlay-shot').addEventListener('change', (e) => {
  chrome.storage.local.set({ [OVERLAY_KEY]: e.target.checked });
});
$('audit-mode').addEventListener('change', (e) => {
  chrome.storage.local.set({ [AUDIT_KEY]: e.target.checked });
});

$('filter').addEventListener('input', render);
$('refresh').addEventListener('click', scan);
scan();
refreshInspectButton();
initPrefs();
