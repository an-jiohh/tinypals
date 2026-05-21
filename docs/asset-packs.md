# TinyPals Asset Packs

TinyPals character assets are static renderer imports. This keeps Vite bundling
predictable and makes every public asset explicit in code review.

## Pack Contract

Each pack lives in `src/renderer/assets/<asset-id>/` and must include:

- `pet.json`
- `spritesheet-2x.png`
- one row PNG for each state:
  - `idle`
  - `running-right`
  - `running-left`
  - `waving`
  - `jumping`
  - `failed`
  - `waiting`
  - `running`
  - `review`

`pet.json` must use the hatch-pet 9-state model and a `frame` block:

```json
{
  "id": "example-pet",
  "displayName": "Example Pet",
  "description": "A short public description.",
  "license": "custom",
  "frame": { "width": 96, "height": 104 },
  "states": {
    "idle": { "file": "example_pet_idle.png", "frameCount": 6, "fps": 6, "loop": true }
  }
}
```

The example above is shortened; production packs must define all nine states.

## Adding a Pack

1. Export the new files into `src/renderer/assets/<asset-id>/`.
2. Import the manifest and all row PNG files in `src/renderer/src/petAssetRegistry.ts`.
3. Add the pack to the registry map and character option list.
4. Update `src/renderer/src/petAssetRegistry.test.ts`.
5. Run `npm run test`, `npm run typecheck`, and `npm run build`.

Unknown selected asset ids must fall back to the default `dough-penguin` pack.
If a requested state file is missing, rendering falls back to `idle`.

## Optional Hatch Skill

`skills/tinypals-hatch-pet` can generate and export compatible packs. It is
optional contributor tooling, not runtime app code.

Typical flow:

```bash
npm run skill:tinypals:install
npm run skill:tinypals:validate
```

Then use `$tinypals-hatch-pet` in Codex to create or repair a pet. After the
export step, apply the explicit registry patch manually.

## Public Asset Rules

- Do not use labeled QA contact sheets as production sprite sources.
- Keep generated assets free of text, third-party logos, and confusingly similar
  third-party character names or silhouettes.
- Record `license: "custom"` for project-generated assets unless a different
  license has been verified.
- Treat `tinypals-test` as a demo/test pack for character selection, not a
  separate finished product character.
