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
      .bar button{all:unset;cursor:pointer;background:#5b53ff;color:#fff;padding:5px 10px;border-radius:6px;}
    </style>
    <div class="box" hidden></div>
    <div class="tip" hidden></div>
    <div class="bar"><b>Inspecting tokens</b><span>click = lock · dbl-click = parent · Esc = exit</span><button id="x">Exit</button></div>`;

  const box = shadow.querySelector('.box');
  const tip = shadow.querySelector('.tip');
  shadow.getElementById('x').addEventListener('click', () => destroy());

  let current = null, locked = false;

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

  function renderTip(el) {
    const usages = collect(el);
    const items = usages.length
      ? '<ul>' + usages.map((u) =>
          `<li>${u.isColor
            ? `<span class="sw" style="background:${esc(u.resolved)}"></span>`
            : '<span class="sw" style="background:transparent;border-color:transparent"></span>'}` +
          `<span class="p">${esc(u.prop)}:</span> <span class="v">var(${esc(u.name)})</span>` +
          `<span class="rv">${esc(u.resolved || '')}</span></li>`
        ).join('') + '</ul>'
      : '<div class="empty">No token variables used here.</div>';
    tip.innerHTML = `<h4>${esc(shortSel(el))}${locked ? ' 🔒' : ''}</h4>${items}`;
    tip.hidden = false;
  }

  function position(el) {
    const r = el.getBoundingClientRect();
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    box.hidden = false;
    box.classList.toggle('lock', locked);
    const tw = tip.offsetWidth || 340, th = tip.offsetHeight || 100;
    let tx = Math.min(r.left, window.innerWidth - tw - 8);
    let ty = r.bottom + 8;
    if (ty + th > window.innerHeight) ty = Math.max(8, r.top - th - 8);
    tip.style.left = Math.max(8, tx) + 'px';
    tip.style.top = ty + 'px';
  }

  function setTarget(el) {
    if (!el || el === document.documentElement) return;
    current = el;
    renderTip(el);
    position(el);
  }

  const inHost = (e) => e.composedPath().includes(host);
  const onMove = (e) => { if (locked || inHost(e)) return; if (e.target && e.target !== current) setTarget(e.target); };
  const onClick = (e) => { if (inHost(e)) return; e.preventDefault(); e.stopPropagation(); locked = true; setTarget(e.target); };
  const onDbl = (e) => { if (inHost(e)) return; e.preventDefault(); e.stopPropagation(); const p = current && current.parentElement; if (p) { locked = true; setTarget(p); } };
  const onKey = (e) => { if (e.key === 'Escape') { if (locked) { locked = false; if (current) { renderTip(current); position(current); } } else destroy(); } };
  const onScroll = () => { if (current) position(current); };

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
  $('inspect-label').textContent = active ? 'Stop inspecting' : 'View Tokens';
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

$('filter').addEventListener('input', render);
$('refresh').addEventListener('click', scan);
scan();
refreshInspectButton();
