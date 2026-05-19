#!/usr/bin/env python3
"""Build Pingu renderer row sprites from a hatch-pet atlas.

The source must be the hatch-pet final atlas, not the QA contact sheet. The
contact sheet has checkerboard, labels, and borders baked into RGB pixels, so
it cannot be used to recover clean alpha.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
from pathlib import Path

from PIL import Image

COLUMNS = 8
ROWS = 9
BASE_CELL_WIDTH = 192
BASE_CELL_HEIGHT = 208
DISPLAY_CELL_WIDTH = 96
DISPLAY_CELL_HEIGHT = 104
BASE_ATLAS_WIDTH = COLUMNS * BASE_CELL_WIDTH
BASE_ATLAS_HEIGHT = ROWS * BASE_CELL_HEIGHT

ROW_SPECS = [
    ("idle", "pingu_idle.png", 6, 6, True),
    ("running-right", "pingu_running_right.png", 8, 10, True),
    ("running-left", "pingu_running_left.png", 8, 10, True),
    ("waving", "pingu_waving.png", 4, 8, False),
    ("jumping", "pingu_jumping.png", 5, 10, False),
    ("failed", "pingu_failed.png", 8, 8, False),
    ("waiting", "pingu_waiting.png", 6, 6, True),
    ("running", "pingu_running.png", 6, 8, True),
    ("review", "pingu_review.png", 6, 6, True),
]


def default_source_atlas() -> Path:
    local_2x_source = Path("src/renderer/assets/pingu/spritesheet-2x.png")
    if local_2x_source.is_file():
        return local_2x_source

    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    return codex_home / "pets" / "dough-penguin" / "spritesheet.webp"


def alpha_nonzero_count(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    return sum(alpha.histogram()[1:])


def transparent_rgb_residue_count(image: Image.Image) -> int:
    rgba = image.convert("RGBA")
    data = rgba.tobytes()
    count = 0
    for index in range(0, len(data), 4):
        red, green, blue, alpha = data[index : index + 4]
        if alpha == 0 and (red or green or blue):
            count += 1
    return count


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        if data[index + 3] == 0:
            data[index] = 0
            data[index + 1] = 0
            data[index + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def get_source_cell_size(image: Image.Image) -> tuple[int, int]:
    if image.width % COLUMNS != 0 or image.height % ROWS != 0:
        raise ValueError(
            f"expected a hatch-pet atlas grid divisible by {COLUMNS}x{ROWS}, "
            f"got {image.width}x{image.height}"
        )

    return image.width // COLUMNS, image.height // ROWS


def validate_source_atlas(
    image: Image.Image,
    source_mode: str,
    source_cell_width: int,
    source_cell_height: int,
) -> list[str]:
    errors: list[str] = []
    if image.size not in {
        (BASE_ATLAS_WIDTH, BASE_ATLAS_HEIGHT),
        (BASE_ATLAS_WIDTH * 2, BASE_ATLAS_HEIGHT * 2),
    }:
        errors.append(
            f"expected hatch-pet atlas {BASE_ATLAS_WIDTH}x{BASE_ATLAS_HEIGHT} "
            f"or {BASE_ATLAS_WIDTH * 2}x{BASE_ATLAS_HEIGHT * 2}, "
            f"got {image.width}x{image.height}"
        )

    if "A" not in source_mode:
        errors.append("source atlas must have an alpha channel")

    for row_index, (state, _file, frame_count, _fps, _loop) in enumerate(ROW_SPECS):
        for column_index in range(COLUMNS):
            left = column_index * source_cell_width
            top = row_index * source_cell_height
            cell = image.crop(
                (left, top, left + source_cell_width, top + source_cell_height)
            )
            nontransparent = alpha_nonzero_count(cell)
            if column_index < frame_count and nontransparent < 50:
                errors.append(
                    f"{state} row {row_index} column {column_index} is empty or too sparse"
                )
            if column_index >= frame_count and nontransparent != 0:
                errors.append(
                    f"{state} row {row_index} unused column {column_index} is not transparent"
                )

    return errors


def write_row_sprites(
    atlas: Image.Image,
    output_dir: Path,
    source_cell_width: int,
    source_cell_height: int,
) -> dict[str, dict[str, object]]:
    states: dict[str, dict[str, object]] = {}
    for row_index, (state, file_name, frame_count, fps, loop) in enumerate(ROW_SPECS):
        strip = Image.new(
            "RGBA",
            (frame_count * source_cell_width, source_cell_height),
            (0, 0, 0, 0),
        )
        for column_index in range(frame_count):
            left = column_index * source_cell_width
            top = row_index * source_cell_height
            frame = atlas.crop(
                (left, top, left + source_cell_width, top + source_cell_height)
            )
            strip.alpha_composite(frame, (column_index * source_cell_width, 0))

        strip = clear_transparent_rgb(strip)
        strip.save(output_dir / file_name)
        states[state] = {
            "file": file_name,
            "frameCount": frame_count,
            "fps": fps,
            "loop": loop,
        }
    return states


def write_manifest(
    output_dir: Path,
    states: dict[str, dict[str, object]],
    source_cell_width: int,
    source_cell_height: int,
) -> None:
    manifest = {
        "id": "dough-penguin",
        "displayName": "Dough Penguin",
        "description": (
            "A small stop-motion clay penguin baker pet with a paper chef hat, "
            "mixing bowl, and flour props."
        ),
        "license": "custom",
        "source": {
            "type": "hatch-pet-atlas",
            "atlasFile": "spritesheet-2x.png",
            "cell": {
                "width": source_cell_width,
                "height": source_cell_height,
            },
            "outputScale": 1,
        },
        "frame": {
            "width": DISPLAY_CELL_WIDTH,
            "height": DISPLAY_CELL_HEIGHT,
        },
        "states": states,
    }
    (output_dir / "pet.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-atlas",
        default=str(default_source_atlas()),
        help="Path to a transparent hatch-pet atlas PNG or WebP.",
    )
    parser.add_argument(
        "--output-dir",
        default="src/renderer/assets/pingu",
        help="Directory where renderer assets are written.",
    )
    args = parser.parse_args()

    source_atlas = Path(args.source_atlas).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()

    if not source_atlas.is_file():
        print(f"missing source atlas: {source_atlas}", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    with Image.open(source_atlas) as opened:
        source_mode = opened.mode
        atlas = opened.convert("RGBA")

    try:
        source_cell_width, source_cell_height = get_source_cell_size(atlas)
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return 1

    errors = validate_source_atlas(
        atlas,
        source_mode,
        source_cell_width,
        source_cell_height,
    )
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    atlas = clear_transparent_rgb(atlas)
    atlas.save(output_dir / "spritesheet-2x.png")
    if source_atlas.suffix.lower() == ".webp":
        shutil.copyfile(source_atlas, output_dir / "spritesheet.webp")

    states = write_row_sprites(atlas, output_dir, source_cell_width, source_cell_height)
    write_manifest(output_dir, states, source_cell_width, source_cell_height)
    print(f"wrote hatch-pet assets to {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
