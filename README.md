# Pingu Desktop Pet

Pingu Desktop Pet is a minimal floating desktop pet app. The first version
focuses on a small, quiet, always-on-top character that can be moved around the
desktop and stores local settings.

## IP Notice

This project is designed around a licensed-use assumption for official Pingu IP.
Until licensing is confirmed, the app uses placeholder SVG assets and a
replaceable asset pack structure.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- macOS or Windows for v1 manual verification

## Commands

```bash
npm install
npm run dev
npm run test
npm run typecheck
npm run build
```

For isolated manual verification, set `PINGU_USER_DATA_DIR` to a temporary
directory before starting the app:

```bash
PINGU_USER_DATA_DIR=/private/tmp/pingu-desktop-pet-user-data npm run dev
```

## Product Documents

- `docs/research/pingu-character-research-2026-05-15.md`
- `docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md`
- `docs/superpowers/plans/2026-05-16-pingu-desktop-pet.md`

## v1 Scope

Included:

- Floating transparent pet window
- Always-on-top setting
- Drag positioning
- Minimal settings popover
- Local settings storage
- Replaceable SVG asset pack

Excluded:

- Timer UI
- Schedule management
- Statistics
- Cloud sync
- Official Pingu sound effects
