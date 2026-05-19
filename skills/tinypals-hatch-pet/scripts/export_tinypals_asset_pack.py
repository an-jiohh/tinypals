#!/usr/bin/env python3
"""Export a transparent hatch-pet atlas as a TinyPals renderer asset pack."""

from __future__ import annotations

import argparse
import json
import re
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

BASE_ATLAS_SIZE = (COLUMNS * BASE_CELL_WIDTH, ROWS * BASE_CELL_HEIGHT)
DOUBLE_ATLAS_SIZE = (BASE_ATLAS_SIZE[0] * 2, BASE_ATLAS_SIZE[1] * 2)

ROW_SPECS = [
    ("idle", 6, 6, True),
    ("running-right", 8, 10, True),
    ("running-left", 8, 10, True),
    ("waving", 4, 8, False),
    ("jumping", 5, 10, False),
    ("failed", 8, 8, False),
    ("waiting", 6, 6, True),
    ("running", 6, 8, True),
    ("review", 6, 6, True),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        default=".",
        help="TinyPals repository root. Defaults to the current directory.",
    )
    parser.add_argument(
        "--source-atlas",
        required=True,
        help="Transparent 8x9 hatch-pet atlas PNG or WebP. Do not pass a QA contact sheet.",
    )
    parser.add_argument(
        "--asset-id",
        required=True,
        help="Hyphen-case asset pack id, for example dough-penguin.",
    )
    parser.add_argument("--display-name", required=True, help="User-facing character name.")
    parser.add_argument("--description", required=True, help="One-sentence pet description.")
    parser.add_argument(
        "--license",
        default="custom",
        help="License label to write into pet.json. Defaults to custom.",
    )
    parser.add_argument(
        "--output-dir",
        help=(
            "Output directory. Defaults to "
            "<repo-root>/src/renderer/assets/<asset-id>."
        ),
    )
    parser.add_argument(
        "--write-webp",
        action="store_true",
        help="Also write spritesheet.webp when the source atlas is not already WebP.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite generated files in a non-empty output directory.",
    )
    return parser.parse_args()


def resolve_path(path_value: str, base: Path) -> Path:
    path = Path(path_value).expanduser()
    if not path.is_absolute():
        path = base / path
    return path.resolve()


def validate_asset_id(asset_id: str) -> None:
    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", asset_id):
        raise ValueError(
            "asset-id must be hyphen-case with lowercase letters, digits, and hyphens"
        )


def file_prefix(asset_id: str) -> str:
    return asset_id.replace("-", "_")


def row_file_name(asset_id: str, state: str) -> str:
    return f"{file_prefix(asset_id)}_{state.replace('-', '_')}.png"


def alpha_nonzero_count(image: Image.Image) -> int:
    alpha = image.getchannel("A")
    return sum(alpha.histogram()[1:])


def clear_transparent_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        if data[index + 3] == 0:
            data[index] = 0
            data[index + 1] = 0
            data[index + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def get_cell_size(atlas: Image.Image) -> tuple[int, int]:
    if atlas.width % COLUMNS != 0 or atlas.height % ROWS != 0:
        raise ValueError(
            f"expected atlas dimensions divisible by {COLUMNS}x{ROWS}, "
            f"got {atlas.width}x{atlas.height}"
        )
    return atlas.width // COLUMNS, atlas.height // ROWS


def validate_source_atlas(
    atlas: Image.Image,
    source_mode: str,
    cell_width: int,
    cell_height: int,
) -> list[str]:
    errors: list[str] = []

    if atlas.size not in {BASE_ATLAS_SIZE, DOUBLE_ATLAS_SIZE}:
        errors.append(
            f"expected hatch-pet atlas {BASE_ATLAS_SIZE[0]}x{BASE_ATLAS_SIZE[1]} "
            f"or {DOUBLE_ATLAS_SIZE[0]}x{DOUBLE_ATLAS_SIZE[1]}, "
            f"got {atlas.width}x{atlas.height}"
        )

    if "A" not in source_mode:
        errors.append("source atlas must have an alpha channel")

    for row_index, (state, frame_count, _fps, _loop) in enumerate(ROW_SPECS):
        for column_index in range(COLUMNS):
            left = column_index * cell_width
            top = row_index * cell_height
            cell = atlas.crop((left, top, left + cell_width, top + cell_height))
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


def expected_output_files(asset_id: str, write_webp: bool) -> set[str]:
    names = {"pet.json", "spritesheet-2x.png"}
    if write_webp:
        names.add("spritesheet.webp")
    for state, _frame_count, _fps, _loop in ROW_SPECS:
        names.add(row_file_name(asset_id, state))
    return names


def prepare_output_dir(output_dir: Path, asset_id: str, write_webp: bool, force: bool) -> None:
    if output_dir.exists():
        if not output_dir.is_dir():
            raise ValueError(f"output path exists but is not a directory: {output_dir}")
        existing = [path for path in output_dir.iterdir() if path.name != ".DS_Store"]
        if existing and not force:
            raise ValueError(
                f"output directory is not empty: {output_dir}. "
                "Pass --force to overwrite generated files."
            )
        for name in expected_output_files(asset_id, write_webp):
            target = output_dir / name
            if target.exists() and target.is_file():
                target.unlink()
    else:
        output_dir.mkdir(parents=True)


def write_row_sprites(
    atlas: Image.Image,
    output_dir: Path,
    asset_id: str,
    cell_width: int,
    cell_height: int,
) -> dict[str, dict[str, object]]:
    states: dict[str, dict[str, object]] = {}
    for row_index, (state, frame_count, fps, loop) in enumerate(ROW_SPECS):
        strip = Image.new(
            "RGBA",
            (frame_count * cell_width, cell_height),
            (0, 0, 0, 0),
        )
        for column_index in range(frame_count):
            left = column_index * cell_width
            top = row_index * cell_height
            frame = atlas.crop((left, top, left + cell_width, top + cell_height))
            strip.alpha_composite(frame, (column_index * cell_width, 0))

        file_name = row_file_name(asset_id, state)
        clear_transparent_rgb(strip).save(output_dir / file_name)
        states[state] = {
            "file": file_name,
            "frameCount": frame_count,
            "fps": fps,
            "loop": loop,
        }
    return states


def write_manifest(
    output_dir: Path,
    asset_id: str,
    display_name: str,
    description: str,
    license_label: str,
    cell_width: int,
    cell_height: int,
    states: dict[str, dict[str, object]],
) -> None:
    manifest = {
        "id": asset_id,
        "displayName": display_name,
        "description": description,
        "license": license_label,
        "source": {
            "type": "hatch-pet-atlas",
            "atlasFile": "spritesheet-2x.png",
            "cell": {
                "width": cell_width,
                "height": cell_height,
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
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()

    try:
        validate_asset_id(args.asset_id)
        repo_root = resolve_path(args.repo_root, Path.cwd())
        source_atlas = resolve_path(args.source_atlas, repo_root)
        output_dir = (
            resolve_path(args.output_dir, repo_root)
            if args.output_dir
            else repo_root / "src" / "renderer" / "assets" / args.asset_id
        )

        if not source_atlas.is_file():
            raise FileNotFoundError(f"missing source atlas: {source_atlas}")

        with Image.open(source_atlas) as opened:
            source_mode = opened.mode
            atlas = opened.convert("RGBA")

        cell_width, cell_height = get_cell_size(atlas)
        errors = validate_source_atlas(atlas, source_mode, cell_width, cell_height)
        if errors:
            raise ValueError("\n".join(errors))

        write_webp = args.write_webp or source_atlas.suffix.lower() == ".webp"
        prepare_output_dir(output_dir, args.asset_id, write_webp, args.force)

        atlas = clear_transparent_rgb(atlas)
        atlas.save(output_dir / "spritesheet-2x.png")
        if source_atlas.suffix.lower() == ".webp":
            shutil.copyfile(source_atlas, output_dir / "spritesheet.webp")
        elif args.write_webp:
            atlas.save(output_dir / "spritesheet.webp", lossless=True, method=6)

        states = write_row_sprites(
            atlas,
            output_dir,
            args.asset_id,
            cell_width,
            cell_height,
        )
        write_manifest(
            output_dir,
            args.asset_id,
            args.display_name,
            args.description,
            args.license,
            cell_width,
            cell_height,
            states,
        )
    except Exception as error:
        print(str(error), file=sys.stderr)
        return 1

    print(f"wrote TinyPals asset pack to {output_dir}")
    print(f"cell={cell_width}x{cell_height} logical={DISPLAY_CELL_WIDTH}x{DISPLAY_CELL_HEIGHT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
