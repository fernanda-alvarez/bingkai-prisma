"""Cell-level diff between two PRISMA exports.

Before submission, answer "what changed between the August and September
versions?" in seconds. Compares two PRISMA CSVs cell by cell.

Usage:
  python diff_exports.py exports/A.csv exports/B.csv
  python diff_exports.py --latest exports   (diff newest vs previous newest)
Exit code: 0 = identical, 1 = differences found, 2 = usage error.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import prisma_common as pc

DEFAULT_EXPORTS = Path(__file__).resolve().parent.parent / "exports"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("files", nargs="*", help="two CSV paths")
    p.add_argument("--latest", metavar="DIR", default=None,
                   help="diff the two newest exports in DIR")
    p.add_argument("--verbose", action="store_true",
                   help="print unchanged-row summary as well")
    return p.parse_args(argv)


def pick_paths(args: argparse.Namespace) -> tuple[Path, Path]:
    if args.latest:
        d = Path(args.latest)
        exports = sorted(d.glob("PRISMA_*.csv"))
        if len(exports) < 2:
            raise SystemExit(f"Need >= 2 exports in {d} (found {len(exports)})")
        return exports[-2], exports[-1]
    if len(args.files) == 2:
        return Path(args.files[0]), Path(args.files[1])
    raise SystemExit("Provide two CSV paths, or --latest <exports-dir>")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    a_path, b_path = pick_paths(args)
    pc.main_argv("diff two PRISMA exports")

    a = pc.load_csv(a_path)
    b = pc.load_csv(b_path)

    if a == b:
        print(f"IDENTICAL: {a_path.name} == {b_path.name}")
        return 0

    print(f"comparing : {a_path.name} (newer/base) vs {b_path.name}")
    if len(a) != len(b) or a[0] != b[0]:
        print("  WARNING: structural difference (row count or header).")

    changes: list[tuple[str, str, str, str, str]] = []  # (row_id, col, old, new, extra)
    for i, (ra, rb) in enumerate(zip(a, b)):
        row_id = ra[pc.DATA_COL] if ra[pc.DATA_COL] else f"row{i + 1}"
        for c, (va, vb) in enumerate(zip(ra, rb)):
            if va != vb:
                changes.append((row_id, pc.HEADER[c], va, vb,
                                "ROW COUNT DIFFERS" if len(ra) != len(rb) else ""))
    if len(a) != len(b):
        changes.append(("", "", "", "",
                        f"rows differ: {len(a)} vs {len(b)}"))

    if not changes:
        print("No cell differences (files differ only in row count).")
        return 1

    print(f"\n{len(changes)} changed cell(s):")
    print(f"{'row/data':<28} {'column':<12} {'old':<45} {'new'}")
    print("-" * 110)
    for row_id, col, old, new, extra in changes:
        print(f"{row_id:<28} {col:<12} {old[:43]:<45} {new[:60]}" + (f"  [{extra}]" if extra else ""))
    if args.verbose:
        print(f"\n({len(a)} rows compared, {len(changes)} cells differ)")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
