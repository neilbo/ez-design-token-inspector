# Drift — Release Notes

## Status
- **v1.0.1** — packaged and ready to submit (`dist/drift-1.0.1.zip`).
- **v1.0.0** — earlier submission, pending review at the time 1.0.1 was prepared.
  Replace the in-review draft with 1.0.1, or upload 1.0.1 once 1.0.0 clears.

## What's in v1.0.1 (changes since v1.0.0)
- **Action feedback** — a snackbar/toast confirms actions in the inspector overlay
  (image copied to clipboard, screenshot saved, pins cleared, hover on/off), fired
  from both keyboard shortcuts and the toolbar buttons. Includes failure variants
  (capture/copy failed).
- **Buy Me a Coffee** — donate footer at the bottom of the popup (full-width purple
  bar, white text, ☕ on each side) linking to a PayPal donation.

## Submission checklist
- [x] **Bump the version** in `manifest.json` → `1.0.1` (the store rejects re-uploads
      that reuse a published/pending version number).
- [x] Rebuild the package: `./package.sh` → `dist/drift-1.0.1.zip`.
- [ ] Upload `dist/drift-1.0.1.zip` in the Developer Dashboard (replace the in-review
      1.0.0 draft, or submit after 1.0.0 clears review).
- [ ] Paste the "What's new" notes (below) into the update.
- [x] Permission justifications in `listing.md` are current (`clipboardWrite` documented).
- [x] Screenshots/promo art match the UI (Drift branding).

## Chrome Web Store "What's new" notes (paste into the update)
- Added on-screen confirmation when you copy, screenshot, clear pins, or toggle hover.
- Added a Buy Me a Coffee link to support development.
