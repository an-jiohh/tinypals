#!/usr/bin/env python3
"""Install the repo-local tinypals-hatch-pet skill into a Codex skills directory."""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

SKILL_NAME = "tinypals-hatch-pet"


def default_target_root() -> Path:
    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    return codex_home / "skills"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        default=str(default_target_root()),
        help=(
            "Target skills root. The skill is copied to "
            "<target>/tinypals-hatch-pet."
        ),
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    source = repo_root / "skills" / SKILL_NAME
    target_root = Path(args.target).expanduser().resolve()
    destination = target_root / SKILL_NAME

    if not source.is_dir():
        print(f"missing source skill: {source}", file=sys.stderr)
        return 1
    if not (source / "SKILL.md").is_file():
        print(f"source skill is missing SKILL.md: {source}", file=sys.stderr)
        return 1

    target_root.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if not destination.is_dir():
            print(f"destination exists but is not a directory: {destination}", file=sys.stderr)
            return 1
        shutil.rmtree(destination)

    ignore = shutil.ignore_patterns("__pycache__", "*.pyc", ".DS_Store")
    shutil.copytree(source, destination, ignore=ignore)
    print(f"installed {SKILL_NAME} to {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
