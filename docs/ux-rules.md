# UX Rules

- Pet click is reserved for pet reaction/state changes.
- Settings must be opened from the tray/menu bar or a dedicated settings surface, not from pet click.
- Keep the pet window's default size at 144x156 and preserve the 96:104 aspect ratio when resizing.
- Offer character selection from settings; unknown asset pack ids should fall back to the default pet.
- Use hatch-pet's 9-state model for character animation: idle, running-right, running-left, waving, jumping, failed, waiting, running, review.
- Derive renderer row sprites from hatch-pet `spritesheet-2x.png`; do not extract production assets from a labeled contact sheet.
- Treat `tinypals-test` as a demo/test character selection pack, not a distinct product character.
- Use `Move to Bottom Right` semantics instead of top-left reset behavior.
- `Move to Bottom Right` should reposition the pet without resizing it.
- Keep settings window corners rounded; avoid overlapping native rounded borders with CSS borders.
- Do not add third-party character IP assets or sounds unless the rights are confirmed.
