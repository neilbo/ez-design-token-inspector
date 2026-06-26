# Privacy Policy — Drift

_Last updated: 2026-06-27_

Drift does **not** collect, store, transmit, or sell any personal
or browsing data.

## What the extension does

All processing happens locally in your browser:

- When you open the popup or use inspect mode, the extension reads the CSS of the
  **current tab** (stylesheets and computed styles) to list the CSS variables
  (design tokens) in use. This data never leaves your device.
- The **screenshot** feature captures the visible tab and either saves the image to
  your own Downloads folder or copies it to your clipboard (the **Copy** button), via
  the browser. The image is not uploaded anywhere.
- Your preferences (e.g. "Include overlay in screenshot", "Keep overlays open")
  are stored locally using `chrome.storage.local` and are not synced or shared.

## Data sharing

None. The extension makes no network requests and contains no analytics, tracking,
or third-party code.

## Permissions

- **activeTab / scripting** — read and annotate the page you explicitly run the
  tool on. Used only on user action.
- **downloads** — save a screenshot you request to your Downloads folder.
- **clipboardWrite** — copy a screenshot you request to your clipboard.
- **storage** — remember your toggle preferences locally.

## Contact

Questions: <your-email-here>
