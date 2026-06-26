# Design Token Finder

A tiny Chrome extension (Manifest V3) that lists the **CSS variables (design tokens)**
used on the current page — e.g. `--colorTextLinkDefault` — with their resolved values
and a swatch for colors.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. **Load unpacked** → select this folder

No build step.

## Use

**Token list:** click the toolbar icon. It scans the active tab and lists every CSS
custom property it finds, sorted by name. Type in the filter box to narrow the list; click
any row to copy `var(--token-name)` to the clipboard.

**Inspect mode:** click **View Tokens** (the pointer button). The popup closes and the
page enters inspect mode:

- **Hover** an element to highlight it and see the design tokens it uses
  (e.g. `color: var(--colorTextLinkDefault)`) with each token's resolved value + swatch.
- **Click** to lock the selection so it stops following the mouse.
- **Double-click** to climb to the parent element — handy for nested elements; keep
  double-clicking to walk outward until you land on the right one.
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
