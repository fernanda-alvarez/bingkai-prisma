"""Generate the PRISMA "Reports excluded" reason strings from a structured TSV.

The reasons column of the flow diagram is the #1 place where the count in the
diagram drifts from the excluded-studies table. This tool keeps them in sync:
the TSV (source_numbers/ExcludedStudies.tsv) is the single source for which
full-text reports were excluded at eligibility and why.

Input  --tsv    source_numbers/ExcludedStudies.tsv
                 columns (tab-separated, lines starting with '#' ignored):
                   study_id  first_author  year  reason  branch
                 branch is one of: databases | other
Input  --input  an exported PRISMA CSV (default: newest file in exports/)
Output          exports/PRISMA_<timestamp>_reasons.csv — a full copy of the
                input CSV with the `n` cells of rows `dbr_excluded` and
                `other_excluded` replaced by the generated strings.

Validation: the sum of the generated reasons must equal the flow-derived
exclusions (assessed - included per branch); mismatches fail (--strict) or warn.

Usage:
  python build_excluded_reasons.py
  python build_excluded_reasons.py --tsv source_numbers/ExcludedStudies.tsv
  python build_excluded_reasons.py --dry-run
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import prisma_common as pc

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_TSV = DEFAULT_DIR / "source_numbers" / "ExcludedStudies.tsv"
DEFAULT_EXPORTS = DEFAULT_DIR / "exports"

REASON_COL = 3   # 0-based column index in the TSV
BRANCH_COL = 4


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--tsv", default=str(DEFAULT_TSV),
                   help="excluded-studies TSV (default: source_numbers/ExcludedStudies.tsv)")
    p.add_argument("--input", default=None,
                   help="input PRISMA CSV (default: newest export in exports/)")
    p.add_argument("--out", default=None,
                   help="output path (default: exports/PRISMA_<ts>_reasons.csv)")
    p.add_argument("--output-dir", default=str(DEFAULT_EXPORTS))
    p.add_argument("--dry-run", action="store_true",
                   help="print the generated strings without writing a file")
    p.add_argument("--strict", action="store_true",
                   help="exit non-zero when reason totals do not match the flow")
    return p.parse_args(argv)


def load_excluded(tsv_path: Path) -> list[dict]:
    """Read the TSV into records; skip blank/comment lines."""
    records: list[dict] = []
    with open(tsv_path, "r", encoding="utf-8-sig", newline="") as fh:
        for line_no, raw in enumerate(fh, start=1):
            line = raw.rstrip("\r\n")
            if not line.strip() or line.lstrip().startswith("#"):
                continue
            cells = line.split("\t")
            if len(cells) < 5:
                print(f"WARNING: line {line_no} has {len(cells)} fields "
                      f"(expected >= 5), skipped: {line[:80]}", file=sys.stderr)
                continue
            study_id, first_author, year, reason, branch = (
                c.strip() for c in cells[:5])
            branch = branch.lower()
            if branch not in ("databases", "other"):
                print(f"WARNING: line {line_no} has unknown branch {branch!r}; "
                      f"treated as 'databases'", file=sys.stderr)
                branch = "databases"
            records.append({"study_id": study_id, "first_author": first_author,
                            "year": year, "reason": reason, "branch": branch})
    return records


def reasons_string(records: list[dict]) -> str:
    """Aggregate counts per reason into 'Reason, n; Reason2, n2' (template style)."""
    counts: dict[str, int] = {}
    for r in records:
        reason = r["reason"].strip() or "Other"
        counts[reason] = counts.get(reason, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return "; ".join(f"{reason}, {n}" for reason, n in ordered)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pc.main_argv("link excluded-studies table to the PRISMA reasons column")

    tsv_path = Path(args.tsv)
    if not tsv_path.is_file():
        print(f"ERROR: excluded-studies TSV not found: {tsv_path}", file=sys.stderr)
        return 2

    records = load_excluded(tsv_path)
    if not records:
        print("WARNING: TSV contains no records (all comments/blank).", file=sys.stderr)

    dbr = [r for r in records if r["branch"] == "databases"]
    other = [r for r in records if r["branch"] == "other"]
    print(f"excluded records : {len(records)} total "
          f"({len(dbr)} databases, {len(other)} other)")

    dbr_str = reasons_string(dbr)
    other_str = reasons_string(other)
    print(f"generated reasons (databases): {dbr_str or '(none)'}")
    print(f"generated reasons (other)    : {other_str or '(none)'}")

    # Locate the input CSV.
    input_path = Path(args.input) if args.input else pc.find_latest_export(args.output_dir)
    if input_path is None or not input_path.is_file():
        print(f"ERROR: no input CSV (set --input or run export_prisma_csv.py "
              f"first)", file=sys.stderr)
        return 2
    rows = pc.load_csv(input_path)
    struct_errs = pc.structure_errors(rows)
    if struct_errs:
        print("ERROR: input CSV is not a valid 35x8 PRISMA file:\n  "
              + "\n  ".join(struct_errs), file=sys.stderr)
        return 2

    # Replace the two reason cells.
    out_rows = [list(r) for r in rows]
    by_id = pc.by_data_id(out_rows)
    for data_id, reason_str in (("dbr_excluded", dbr_str), ("other_excluded", other_str)):
        row = by_id.get(data_id)
        if row is None:
            print(f"ERROR: row '{data_id}' not found in input CSV", file=sys.stderr)
            return 2
        row[pc.N_COL] = reason_str

    # Flow validation against the updated rows.
    issues = pc.validate_flow(out_rows)
    has_errors = pc.print_issues(issues, verbose=not args.dry_run)
    if has_errors and args.strict:
        print("REJECTED: reason totals do not reconcile with the flow (--strict).",
              file=sys.stderr)
        return 1

    # Reconciliation of the excluded table with the diagram's assessed/included.
    g = pc.by_data_id(out_rows)
    def n(id_):
        row = g.get(id_)
        return pc.n_total(row[pc.N_COL]) if row else None
    assessed = (n("dbr_assessed") or 0) + (n("other_assessed") or 0)
    included = n("new_studies")
    excluded_total = len(dbr) + len(other)
    print(f"flow check: assessed={assessed:g}, new studies={included if included is not None else '?'}, "
          f"excluded-table records={excluded_total}")
    if included is not None and abs((assessed - included) - excluded_total) > 1e-6:
        print(f"  WARNING: table total ({excluded_total}) != flow-derived "
              f"exclusions ({assessed - included:g}); check branch split or "
              f"missing records", file=sys.stderr)

    if args.dry_run:
        print("DRY RUN — no file written.")
        return 0

    # Write a new timestamped file (never overwrite the input).
    out_path = Path(args.out) if args.out else (
        Path(args.output_dir) / f"PRISMA_{pc.timestamp()}_reasons.csv")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    counter = 1
    while out_path.exists():
        out_path = out_path.with_name(f"{out_path.stem}_{counter:02d}{out_path.suffix}")
        counter += 1
    pc.save_csv(out_path, out_rows)
    print(f"EXPORTED: {out_path.resolve()}")
    print(f"  source   : {input_path.resolve()}")
    print(f"  modified : n of 'dbr_excluded' and 'other_excluded' only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
