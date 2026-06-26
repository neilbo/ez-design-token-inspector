# Chrome Web Store listing copy

Paste these into the Developer Dashboard fields.

## Name
Design Token Inspector

## Summary (≤132 chars)
Find the CSS variables (design tokens) on any page and inspect which tokens each element uses.

## Category
Developer Tools

## Detailed description
Design Token Inspector helps designers and developers see how a website uses CSS
custom properties — its "design tokens".

• Token list — open the popup to list every CSS variable defined on the current
  page, with resolved values and color swatches. Filter by name, click to copy
  `var(--token)`.

• Inspect mode — click "View Tokens" to highlight elements as you hover and see
  exactly which tokens they use (e.g. `color: var(--colorTextLinkDefault)`),
  including font shorthands and chained variables, resolved to their final value.
  Double-click to climb to a parent element; drag tooltips out of the way.

• Visual audit — optionally pin overlays on multiple elements at once to compare
  token usage across a screen.

• Screenshot — capture an annotated PNG of your findings to your Downloads folder.

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
