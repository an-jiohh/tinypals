# AGENT.md

## Project Intent
This project is a minimal desktop floating virtual pet.
The first product layer is the companion pet itself; timer, schedule, and study/work features are future additions.
The primary UX should feel like a small always-on-top companion, not a dashboard-first productivity app.

## Workflow
- If the planning intent changes, always ask the user whether the product intent file should be updated next.
- Ask before adding production dependencies.
- Do not add or expand `AGENT.md` instructions without an explicit user request.

## Source of Truth
Before implementation, read the planning markdown file in this repository.
Summarize the intended product, UX style, and MVP scope before creating project files.
Do not duplicate UX rules in this file; update the source documents below and keep this file as an index.

- Overall overview and setup instructions: `README.md`
- Tech stack and runtime structure: `docs/architecture.md`
- Where to modify each feature: `docs/implementation-map.md`
- Product UX rules: `docs/ux-rules.md`
- Character/IP research: `docs/research/pingu-character-research-2026-05-15.md`
- Product intent: `docs/superpowers/specs/2026-05-16-pingu-desktop-pet-design.md`
- Implementation plan history: `docs/superpowers/plans/2026-05-16-pingu-desktop-pet.md`

## Verification
When code exists:
- Run the project’s test/check commands before final response.
- If visual UI changes are made, verify with an actual running app or screenshot.
- Report any checks that could not be run.

## Git
- Write Git-related messages in detail, including what changed, why it changed, and any important context.
