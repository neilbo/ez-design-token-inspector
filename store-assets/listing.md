# Chrome Web Store listing copy

Paste these into the Developer Dashboard fields.

## Name
Drift — Design Token Audit

## Summary (≤132 chars)
Audit how any live UI uses your design tokens. Pin findings, add notes, and capture a shareable audit. Catch design drift.

## Category
Developer Tools

## Detailed description
Drift turns any web page into a quick design-QA pass for your design tokens —
catch where a live UI drifts from its system before it ships. A simple workflow:
reveal → audit → annotate → share. For designers QA'ing implemented UIs, devs
increasing token adoption, and design-system teams auditing consistency.

• Reveal — open the popup to list every CSS variable (design token) on the page,
  with resolved values and color swatches; filter by name and click to copy
  `var(--token)`. Then hover any element to see exactly which tokens it uses
  (e.g. `color: var(--colorTextLinkDefault)`) — including font shorthands and
  chained variables, resolved to their final value. Double-click to climb to a
  parent element.

• Audit — pin overlays on multiple elements at once to compare token usage across
  a screen. Each pin is color-coded with a connector line back to its element, so
  it stays legible even when you drag the tooltips out of the way.

• Annotate — add a note to any pinned finding to record what's wrong or what to fix.

• Share — capture an annotated PNG of your findings (to Downloads or straight to
  the clipboard) to hand off to your team.

Everything runs locally in your browser. No data is collected or sent anywhere.

## Single purpose (required field)
Inspect and list the CSS custom properties (design tokens) used by the current web
page.

## Permission justifications (required per permission)

- activeTab: Run the token scan/inspector on the tab the user is currently viewing,
  only when they click the extension.
- scripting: Inject the scanner/inspector into the current tab to read its CSS and
  draw the highlight overlay.
- downloads: Save a screenshot to the user's Downloads folder when they click the
  Screenshot button.
- clipboardWrite: Copy a screenshot of the audit to the clipboard when the user
  clicks the Copy button, so they can paste it into another app.
- storage: Remember the user's toggle preferences (screenshot/overlay/audit) locally.

## Host permission justification
None requested. The extension uses activeTab + scripting, which only grant access
to a tab after the user invokes the extension.

## Data usage disclosures (Privacy tab)
- Does NOT collect or use personally identifiable information.
- Does NOT collect health, financial, authentication, personal communications,
  location, web history, or user activity data.
- Does NOT sell or transfer data to third parties.
- No remote code: all code is included in the package.

## Privacy policy URL
Host store-assets/PRIVACY.md at a public URL (e.g. GitHub Pages or a Gist) and
paste that link here.
