# TinyPals IP and Asset Safety

작성일: 2026-05-20
공개 정리 업데이트: 2026-05-22

## Purpose

TinyPals is this project's product name. This document defines the public
repository rules for character names, reference-derived artwork, generated
spritesheets, and third-party IP risk.

This is an engineering checklist, not legal advice. Final distribution decisions
should still be reviewed by the maintainer.

## Repository Policy

- Do not use third-party character names, franchise names, logos, sounds,
  catchphrases, worlds, or relationship lore in source, docs, metadata, or asset
  paths unless rights have been confirmed.
- Keep character assets replaceable through the hatch-pet asset-pack structure.
- Use `license: "custom"` for project-generated character assets unless a
  different license has been verified and documented.
- Do not copy third-party logos, readable marks, UI screenshots, slogans, or
  distinctive brand dress into generated assets.
- Review any reference-derived asset for confusing similarity before public
  release.

## Current Included Assets

Current public asset packs:

- `dough-penguin`: default custom generated pet
- `dough-penguin-test`: duplicate demo/test pack for validating character selection
- `artist-penguin`: custom generated artist pet
- `cleaner-penguin`: custom generated cleaner pet

These assets are tracked as TinyPals project assets and are not official assets
from any third-party character, brand, or franchise.

## Review Checklist

Before adding or publishing a new asset pack:

- Search active source, docs, package metadata, and asset names for legacy or
  third-party IP names.
- Confirm the character does not rely on a protected name, exact silhouette,
  signature prop combination, sound, or fictional setting.
- Confirm generated rows have no text, logos, hidden labels, contact-sheet
  borders, frame numbers, or QA guide marks.
- Confirm `pet.json` has the correct `id`, `displayName`, `description`,
  `license`, `frame`, and all nine hatch-pet states.
- Run `npm run test`, `npm run typecheck`, and `npm run build`.

## Reference Images

Reference images can be useful for style and pose direction, but they are not
automatically safe for redistribution. When using references:

- Prefer user-owned or explicitly licensed references.
- Translate references into a distinct project character rather than copying a
  recognizable protected work.
- Avoid trademarked names and visual signatures in generated prompts and output.
- Keep source references out of production asset folders unless they are meant
  to be publicly redistributed.

## Related Docs

- `README.md`
- `docs/asset-packs.md`
- `docs/app-icons.md`
- `docs/implementation-map.md`
