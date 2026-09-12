"""Export PRISMA_Editable.xlsx -> exports/PRISMA_YYYYMMDD_HHMMSS.csv.

Implements the spec in PRISMA_XLSX_to_CSV_Codex_Instructions.md verbatim:

  - PRISMA.csv          immutable structural template (never touched)
  - PRISMA_Editable.xlsx authoritative data source (never touched)
  - output              exports/PRISMA_<timestamp>.csv (RFC 4180, UTF-8 no BOM,
                        CRLF, minimal quoting, exactly 35 rows x 8 columns)
  - structural checks   stop with a clear error on any violation
  - flow checks         PRISMA 2020 arithmetic + zero-fill (warnings by default;
                        --strict turns arithmetic mismatches into failures)

Usage:
  python export_prisma_csv.py
  python export_prisma_csv.py --template PRISMA.csv --workbook PRISMA_Editable.xlsx
  python export_prisma_csv.py --validate-only
  python export_prisma_csv.py --strict
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import prisma_common as pc

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_TEMPLATE = DEFAULT_DIR / "PRISMA.csv"
DEFAULT_WORKBOOK = DEFAULT_DIR / "PRISMA_Editable.xlsx"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--template", default=str(DEFAULT_TEMPLATE),
                   help="original immutable PRISMA.csv (schema reference)")
    p.add_argument("--workbook", default=str(DEFAULT_WORKBOOK),
                   help="edited workbook containing the PRISMA sheet")
    p.add_argument("--sheet", default=pc.SHEET_NAME,
                   help="worksheet name (default: PRISMA)")
    p.add_argument("--output-dir", default=str(DEFAULT_DIR / "exports"),
                   help="directory for timestamped exports")
    p.add_argument("--validate-only", action="store_true",
                   help="run all checks but write no file")
    p.add_argument("--strict", action="store_true",
                   help="exit non-zero on flow-arithmetic mismatches too")
    p.add_argument("--quiet", action="store_true", help="suppress per-issue output")
    return p.parse_args(argv)


def structural_check(template_rows: list[list[str]],
                     workbook_rows: list[list[str]]) -> None:
    """All checks from the spec's 'Structural validation before export'."""
    errs = pc.structure_errors(template_rows)
    if errs:
        raise ValueError("Template PRISMA.csv is not a valid 35x8 schema:\n  "
                         + "\n  ".join(errs))
    errs = pc.structure_errors(workbook_rows)
    if errs:
        raise ValueError("Workbook sheet does not match the 35x8 schema:\n  "
                         + "\n  ".join(errs))
    if pc.data_id_order(template_rows) != pc.data_id_order(workbook_rows):
        raise ValueError(
            "Workbook 'data' column order differs from the template. Stop.")


def post_write_validation(path: Path, workbook_rows: list[list[str]]) -> list[str]:
    """Re-open the generated CSV and verify round-trip integrity."""
    out = pc.load_csv(path)
    errs: list[str] = []
    errs += pc.structure_errors(out)
    if len(out) != len(workbook_rows):
        errs.append("row count differs after write")
        return errs
    for i, (a, b) in enumerate(zip(out, workbook_rows)):
        if a != b:
            for c, (va, vb) in enumerate(zip(a, b)):
                if va != vb:
                    errs.append(f"cell (row {i + 1}, col {c + 1}) changed: "
                                f"{vb!r} -> {va!r}")
    return errs


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pc.main_argv("export validated PRISMA CSV from the editable workbook")

    template_path = Path(args.template)
    workbook_path = Path(args.workbook)

    # 1-2. Required files must exist.
    if not template_path.is_file():
        print(f"ERROR: template not found: {template_path}", file=sys.stderr)
        return 2
    if not workbook_path.is_file():
        print(f"ERROR: workbook not found: {workbook_path}", file=sys.stderr)
        return 2

    # 3. Read template and workbook.
    template_rows = pc.load_csv(template_path)
    workbook_rows = pc.read_workbook_values(workbook_path)

    # 4. Structural validation (spec section 'Structural validation before export').
    structural_check(template_rows, workbook_rows)

    # 5. Flow arithmetic + zero-fill checks.
    issues = pc.validate_flow(workbook_rows)
    has_errors = pc.print_issues(issues, verbose=not args.quiet)
    if has_errors and args.strict:
        print("EXPORT ABORTED: flow-arithmetic errors (--strict). "
              "Fix PRISMA_Editable.xlsx first.", file=sys.stderr)
        return 1

    if args.validate_only:
        print("Validation only — no file written.")
        return 0

    # 6. Timestamped output, never overwriting.
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"PRISMA_{pc.timestamp()}"
    out_path = out_dir / f"{stem}.csv"
    counter = 1
    while out_path.exists():
        out_path = out_dir / f"{stem}_{counter:02d}.csv"
        counter += 1

    # 7-11. Write with exact formatting.
    pc.save_csv(out_path, workbook_rows)

    # 12. Post-write validation.
    pv = post_write_validation(out_path, workbook_rows)
    if pv:
        print("POST-WRITE VALIDATION FAILED:\n  " + "\n  ".join(pv), file=sys.stderr)
        out_path.unlink(missing_ok=True)
        return 1

    print(f"EXPORTED: {out_path.resolve()}")
    print(f"  rows x cols : {len(workbook_rows)} x {len(workbook_rows[0])}")
    print(f"  header      : {'exact match' if workbook_rows[0] == pc.HEADER else 'WARNING: differs'}")
    print("  validation  : structure OK, flow checks reported above, "
          "post-write round-trip OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
