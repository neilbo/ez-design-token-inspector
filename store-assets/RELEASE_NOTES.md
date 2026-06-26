# Drift — Release Notes

## Status
- **v1.0.0** — submitted to the Chrome Web Store, **pending review**.

## Pending changes (in the current build, not yet in the submitted package)
These have landed in `main` after the v1.0.0 submission and will ship in the next update:

- **Action feedback** — a snackbar/toast confirms actions in the inspector overlay
  (image copied to clipboard, screenshot saved, pins cleared, hover on/off), fired
  from both keyboard shortcuts and the toolbar buttons. Includes failure variants
  (capture/copy failed).
- **Buy Me a Coffee** — donate footer at the bottom of the popup (full-width purple
  bar, white text, ☕ on each side) linking to a PayPal donation.

## Before re-submitting to the Chrome Web Store
- [ ] **Bump the version** in `manifest.json` (e.g. `1.0.0` → `1.0.1`) — the store
      rejects re-uploads that reuse a published/pending version number.
- [ ] Rebuild the package: `./package.sh` → `dist/drift-<version>.zip`.
- [ ] Let the v1.0.0 review finish before uploading the update (or replace the
      in-review draft in the Developer Dashboard).
- [ ] Update the listing's "What's new" notes (see below).
- [ ] If permissions changed since the submitted build, update the permission
      justifications in `listing.md`. (`clipboardWrite` is already documented.)
- [ ] Confirm screenshots/promo art still match the UI (only refresh if it changed
      visibly).

## Chrome Web Store "What's new" notes (paste into the update)
- Added on-screen confirmation when you copy, screenshot, clear pins, or toggle hover.
- Added a Buy Me a Coffee link to support development.
