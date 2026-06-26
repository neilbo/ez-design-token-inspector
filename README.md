# Drift

**Catch design drift before it ships.** A Manifest V3 Chrome extension to audit how a
live UI uses its **design tokens** — all locally in your browser. It's a quick design-QA
workflow: **reveal → audit → annotate → share.**

1. **Reveal** — list every CSS variable (design token) a page uses — e.g.
   `--colorTextLinkDefault` — with resolved values and color swatches, and hover any
   element to see exactly which tokens it pulls.
2. **Audit** — pin multiple elements at once, color-coded with connector lines, to
   compare token usage across a screen.
3. **Annotate** — add notes to each pinned finding.
4. **Share** — capture an annotated screenshot (download or copy to clipboard) to hand off.

Built for designers QA'ing implemented UIs, devs increasing token adoption, and
design-system teams auditing consistency.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. **Load unpacked** → select this folder

No build step.

## Use

**Token list:** click the toolbar icon. It scans the active tab and lists every CSS
custom property it finds, sorted by name. Type in the filter box to narrow the list; click
any row to copy `var(--token-name)` to the clipboard.

**Inspect mode:** click **Select Element** (the pointer button). The popup closes and the
page enters inspect mode:

- **Hover** an element to highlight it and see the design tokens it uses
  (e.g. `color: var(--colorTextLinkDefault)`) with each token's resolved value + swatch.
- **Click** to lock the selection so it stops following the mouse.
- **Drag** a tooltip from anywhere on it to move it out of the way (works for both the
  locked tooltip and pinned ones; the highlight box stays anchored to the element). A small
  drag threshold keeps plain clicks working, and tooltips are clamped on-screen.
- **Double-click** to climb to the parent element — handy for nested elements; keep
  double-clicking to walk outward until you land on the right one.
- **Keep overlays open (visual audit)** — tick this option in the popup (off by default) to
  switch click behaviour: each click *pins* a persistent green overlay so you can stack up
  many elements at once for a visual audit. Remove one with its **✕**, or all of them with
  **Clear** in the toolbar.
- **Hover** (toolbar button) toggles the live cursor-following highlight off/on — useful so
  the purple highlight doesn't sit over an element while you review pins or line up a shot.
- **Screenshot** (toolbar button) saves a PNG of the visible tab to your Downloads folder.
  By default pinned overlays (and a *locked* tooltip) are kept in the shot; the transient
  live hover highlight and the toolbar are always excluded. Untick **Include overlay in
  screenshot** in the popup for a fully clean DevTools-style capture.
- **Esc** unlocks (then **Esc** again, or the **Exit** button, leaves inspect mode).

Reopen the popup and click **Stop inspecting** to turn it off.

## How it works

`popup.js` injects self-contained functions via `chrome.scripting.executeScript`:

- **List:** walks the page's `document.styleSheets`, gathers every `--*` declaration
  (recursing into `@media`/`@supports`), resolves each value against `:root`, and flags
  colors with `CSS.supports('color', value)`.
- **Inspect:** sets up a Shadow-DOM overlay + document listeners that persist in the page.
  For the element under the cursor it finds the matched style rules (`el.matches(selector)`)
  plus the inline `style`, extracts every `var(--…)` reference, and resolves each token's
  value on that element with `getComputedStyle(el).getPropertyValue('--…')`. The toggle
  lives on `window.__dtfInspector`, so a second toggle tears it down.

## Limitations

- Cross-origin stylesheets can't be read; the count of skipped sheets is shown in the status line.
- Variables defined only under theme selectors (e.g. `.dark`) that aren't active on `:root`
  fall back to their authored value (which may itself be another `var(...)`).

## Files

```
manifest.json   permissions + popup
popup.html/css  UI
popup.js        scan + render (collector is injected into the page)
test/fixture.html  sample page with CSS variables for testing
```
