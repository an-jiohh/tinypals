# TinyPals Desktop Pet

[한국어 README](README.ko.md)

TinyPals Desktop Pet is a small floating desktop companion built with Electron,
React, and replaceable animated character asset packs. The current v1 focuses on
the pet window, settings, updates, and asset-pack infrastructure; timer,
schedule, and reporting features are planned future layers.

## Requirements

- Node.js 22.12 or newer
- npm 10 or newer
- macOS or Windows for manual app verification

## Quick Start

```bash
npm install
npm run dev
```

Run the standard checks:

```bash
npm run test
npm run typecheck
npm run build
```

Package locally:

```bash
npm run dist:mac
npm run dist:win
```

Use an isolated settings directory for manual testing:

```bash
TINYPALS_USER_DATA_DIR=/private/tmp/tinypals-desktop-pet-user-data npm run dev
```

## Current Features

- Transparent always-on-top floating pet window
- Draggable pet position with local `settings.json` persistence
- Resizable pet window that preserves the 96:104 frame ratio
- Separate tray/menu-bar settings window
- Character selection through registered asset packs
- PNG row spritesheet animation for the 9 hatch-pet states
- GitHub Releases update check, download, and install flow
- Optional Sentry crash/error reporting

Not implemented yet:

- Study timer UI
- Schedule management
- Stats, reports, or export
- Cloud sync
- Third-party licensed characters, sounds, or brand assets

## Character Asset Packs

TinyPals uses static asset-pack registration instead of runtime folder scanning.
Each asset pack lives under `src/renderer/assets/<asset-id>/` and contains:

- `pet.json`
- `spritesheet-2x.png`
- nine state row PNG files for `idle`, `running-right`, `running-left`,
  `waving`, `jumping`, `failed`, `waiting`, `running`, and `review`

The logical frame size is `96x104`. Current renderer row images preserve the
hatch-pet source atlas cell resolution where possible, typically `384x416` for
2x atlases and `192x208` for 1x atlases.

Registered packs currently include:

- `dough-penguin`: default custom generated pet
- `dough-penguin-test`: duplicate demo/test pack used to verify character selection
- `artist-penguin`: custom generated artist pet
- `cleaner-penguin`: custom generated cleaner pet

To add a new pack:

1. Export the files into `src/renderer/assets/<asset-id>/`.
2. Add static imports and a registry entry in `src/renderer/src/petAssetRegistry.ts`.
3. Update `src/renderer/src/petAssetRegistry.test.ts`.
4. Run `npm run test`, `npm run typecheck`, and `npm run build`.

QA contact sheets are review artifacts only. Do not use labeled contact sheets as
production sprite sources.

## TinyPals Hatch Pet Skill

This repository includes `skills/tinypals-hatch-pet` as optional development
tooling. It is a self-contained Codex skill for generating, validating,
exporting, and registering TinyPals-compatible pet spritesheets.

Install it into your local Codex skills directory:

```bash
npm run skill:tinypals:install
```

Validate the repo-local and installed skill copy:

```bash
npm run skill:tinypals:validate
```

The app does not require this skill at runtime. It is only for contributors who
want to create or repair character assets using the hatch-pet workflow.

## Sentry

Sentry is disabled unless a DSN is provided. Use `.env.example` as the template
for local `.env` files or CI secrets.

```bash
VITE_SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
SENTRY_DSN=https://public-key@o0.ingest.sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=production
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=your-source-map-upload-token
SENTRY_UPLOAD_SOURCEMAPS=false
```

Rules:

- Never commit real `.env` files or secret values.
- `SENTRY_AUTH_TOKEN` is only for source map upload.
- Source maps are generated and uploaded only when `SENTRY_UPLOAD_SOURCEMAPS=true`,
  `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are all present.
- Set `SENTRY_DISABLED=true` and `VITE_SENTRY_DISABLED=true` to force-disable
  reporting.
- Runtime Sentry config sets `sendDefaultPii: false`.

## Release

GitHub release publishing is configured in `.github/workflows/release.yml`.
Push a `vX.Y.Z` tag whose version matches `package.json`, or run a local release
script with `GH_TOKEN` configured:

```bash
npm run release:mac
npm run release:win
```

Local package builds without publishing use `npm run dist:mac` and
`npm run dist:win`.

See [Release guide](docs/release.md) for the full versioning, GitHub Releases,
update metadata, signing, and smoke-test procedure.

## Documentation

- [Architecture](docs/architecture.md)
- [Implementation map](docs/implementation-map.md)
- [Release guide](docs/release.md)
- [UX rules](docs/ux-rules.md)
- [Asset pack guide](docs/asset-packs.md)
- [App icon guide](docs/app-icons.md)
- [IP and asset safety](docs/research/tinypals-ip-safety-2026-05-20.md)
- [Security policy](SECURITY.md)

## License and Asset Notice

Source code in this repository is released under the MIT License. See
[LICENSE](LICENSE).

Included character images and spritesheets are custom generated project assets
tracked for TinyPals development. They are not official assets from any
third-party character, brand, or franchise. Before adding reference-derived
assets, verify that the reference can be used for the intended distribution
scope and avoid names, silhouettes, sounds, worlds, or marks that could create
third-party IP confusion.
