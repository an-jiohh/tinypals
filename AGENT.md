# AGENT.md

## Project Intent

TinyPals is a minimal desktop floating virtual pet. The current product layer is
the companion pet itself; timer, schedule, and study/work features are future
additions. The UX should feel like a small always-on-top companion, not a
dashboard-first productivity app.

## Workflow

- Ask before adding production dependencies.
- Keep changes consistent with the existing Electron, React, TypeScript, and
  static asset-pack patterns.
- Do not commit real `.env` files, generated local app data, or personal Codex
  environment files.
- Treat `skills/tinypals-hatch-pet` as optional contributor tooling, not runtime
  app code.

## Source of Truth

- Overview and setup: `README.md`
- Runtime architecture: `docs/architecture.md`
- Feature modification map: `docs/implementation-map.md`
- UX constraints: `docs/ux-rules.md`
- Asset-pack workflow: `docs/asset-packs.md`
- Character/IP safety: `docs/research/tinypals-ip-safety-2026-05-20.md`
- Security policy: `SECURITY.md`

## Verification

For code or public documentation changes, run the relevant checks before the
final response:

```bash
npm run test
npm run typecheck
npm run build
```

For visual UI changes, verify with an actual running app or screenshot when
practical. Report any checks that could not be run.

## Git

Write Git-related messages in Korean and include what changed, why it changed,
and any important verification context.
