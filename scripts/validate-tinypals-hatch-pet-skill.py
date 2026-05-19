#!/usr/bin/env python3
"""Validate the repo-local tinypals-hatch-pet skill and any installed copy."""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

SKILL_NAME = "tinypals-hatch-pet"
EXPECTED_FILES = [
    "SKILL.md",
    "LICENSE.txt",
    "agents/openai.yaml",
    "references/animation-rows.md",
    "references/codex-pet-contract.md",
    "references/qa-rubric.md",
    "scripts/compose_atlas.py",
    "scripts/derive_running_left_from_running_right.py",
    "scripts/export_tinypals_asset_pack.py",
    "scripts/extract_strip_frames.py",
    "scripts/inspect_frames.py",
    "scripts/make_contact_sheet.py",
    "scripts/prepare_pet_run.py",
    "scripts/render_animation_previews.py",
    "scripts/validate_atlas.py",
]


def codex_home() -> Path:
    return Path(os.environ.get("CODEX_HOME", Path.home() / ".codex")).expanduser()


def default_target_root() -> Path:
    return codex_home() / "skills"


def default_quick_validate() -> Path:
    return codex_home() / "skills" / ".system" / "skill-creator" / "scripts" / "quick_validate.py"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--target",
        default=str(default_target_root()),
        help=(
            "Installed skills root to check. If omitted, uses "
            "${CODEX_HOME:-$HOME/.codex}/skills."
        ),
    )
    parser.add_argument(
        "--require-installed",
        action="store_true",
        help="Fail when <target>/tinypals-hatch-pet is not present.",
    )
    parser.add_argument(
        "--quick-validate",
        default=str(default_quick_validate()),
        help="Path to skill-creator quick_validate.py.",
    )
    return parser.parse_args()


def run_quick_validate(skill_dir: Path, quick_validate: Path) -> bool:
    result = subprocess.run(
        [sys.executable, str(quick_validate), str(skill_dir)],
        check=False,
        text=True,
        capture_output=True,
    )
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.returncode == 0:
        return True

    if "No module named 'yaml'" in result.stderr:
        print("quick_validate.py is missing PyYAML; using embedded validator fallback")
        return run_embedded_quick_validate(skill_dir)

    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    return False


def parse_simple_frontmatter(text: str) -> dict[str, str]:
    match = re.match(r"^---\n(.*?)\n---", text, re.DOTALL)
    if not match:
        raise ValueError("Invalid frontmatter format")

    frontmatter: dict[str, str] = {}
    for raw_line in match.group(1).splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if ":" not in line:
            raise ValueError(f"Invalid frontmatter line: {raw_line}")
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip("\"'")
    return frontmatter


def run_embedded_quick_validate(skill_dir: Path) -> bool:
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file():
        print("SKILL.md not found", file=sys.stderr)
        return False

    try:
        frontmatter = parse_simple_frontmatter(skill_md.read_text(encoding="utf-8"))
    except ValueError as error:
        print(str(error), file=sys.stderr)
        return False

    allowed_properties = {"name", "description", "license", "allowed-tools", "metadata"}
    unexpected_keys = set(frontmatter.keys()) - allowed_properties
    if unexpected_keys:
        print(
            "Unexpected key(s) in SKILL.md frontmatter: "
            + ", ".join(sorted(unexpected_keys)),
            file=sys.stderr,
        )
        return False

    name = frontmatter.get("name", "")
    description = frontmatter.get("description", "")
    if not name:
        print("Missing 'name' in frontmatter", file=sys.stderr)
        return False
    if not description:
        print("Missing 'description' in frontmatter", file=sys.stderr)
        return False
    if not re.fullmatch(r"[a-z0-9-]+", name):
        print(f"Name '{name}' should be hyphen-case", file=sys.stderr)
        return False
    if name.startswith("-") or name.endswith("-") or "--" in name:
        print(f"Name '{name}' has invalid hyphen placement", file=sys.stderr)
        return False
    if len(name) > 64:
        print("Name is too long", file=sys.stderr)
        return False
    if "<" in description or ">" in description:
        print("Description cannot contain angle brackets", file=sys.stderr)
        return False
    if len(description) > 1024:
        print("Description is too long", file=sys.stderr)
        return False

    print("Skill is valid! (embedded fallback)")
    return True


def validate_skill_contents(skill_dir: Path) -> list[str]:
    errors: list[str] = []
    for relative in EXPECTED_FILES:
        if not (skill_dir / relative).is_file():
            errors.append(f"missing {relative}")

    skill_md = skill_dir / "SKILL.md"
    if skill_md.is_file():
        text = skill_md.read_text(encoding="utf-8")
        if "name: tinypals-hatch-pet" not in text:
            errors.append("SKILL.md frontmatter name is not tinypals-hatch-pet")
        if "TinyPals Project Export Workflow" not in text:
            errors.append("SKILL.md is missing the TinyPals export workflow")
        if "export_tinypals_asset_pack.py" not in text:
            errors.append("SKILL.md does not mention export_tinypals_asset_pack.py")

    agent_yaml = skill_dir / "agents" / "openai.yaml"
    if agent_yaml.is_file():
        text = agent_yaml.read_text(encoding="utf-8")
        if "$tinypals-hatch-pet" not in text:
            errors.append("agents/openai.yaml does not reference $tinypals-hatch-pet")

    return errors


def validate_one(label: str, skill_dir: Path, quick_validate: Path) -> bool:
    print(f"validating {label}: {skill_dir}")
    if not skill_dir.is_dir():
        print(f"missing {label} skill: {skill_dir}", file=sys.stderr)
        return False

    ok = run_quick_validate(skill_dir, quick_validate)
    for error in validate_skill_contents(skill_dir):
        print(error, file=sys.stderr)
        ok = False
    return ok


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    repo_skill = repo_root / "skills" / SKILL_NAME
    installed_skill = Path(args.target).expanduser().resolve() / SKILL_NAME
    quick_validate = Path(args.quick_validate).expanduser().resolve()

    if not quick_validate.is_file():
        print(f"missing quick_validate.py: {quick_validate}", file=sys.stderr)
        return 1

    ok = validate_one("repo", repo_skill, quick_validate)
    if installed_skill.is_dir():
        ok = validate_one("installed", installed_skill, quick_validate) and ok
    elif args.require_installed:
        print(f"installed skill not found: {installed_skill}", file=sys.stderr)
        ok = False
    else:
        print(f"installed skill not found, skipping: {installed_skill}")

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
