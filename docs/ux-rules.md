# UX Rules

- Pet click is reserved for pet reaction/state changes.
- Settings must be opened from the tray/menu bar or a dedicated settings surface, not from pet click.
- Keep the pet window's default size at 96x104 and preserve the 96:104 aspect ratio when resizing.
- Use hatch-pet's 9-state model for character animation: idle, running-right, running-left, waving, jumping, failed, waiting, running, review.
- Derive renderer row sprites from hatch-pet `spritesheet-2x.png`; do not extract production assets from a labeled contact sheet.
- Use `Move to Bottom Right` semantics instead of top-left reset behavior.
- Keep settings window corners rounded; avoid overlapping native rounded borders with CSS borders.
- Do not add official Pingu assets or sounds until licensing is confirmed.
