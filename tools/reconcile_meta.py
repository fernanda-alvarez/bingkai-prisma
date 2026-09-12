"""Reconcile the PRISMA flow diagram against the actual meta-analysis dataset.

The most common reviewer-flagged inconsistency is "the flow diagram says N
studies but the forest plot has M". This tool compares the `total_studies_ma`
box of an exported PRISMA CSV against the number of distinct studies in the
R meta-analysis datasets (05_R Meta-analysis/data_derived/*_analysis_ready.csv).

Usage:
  python reconcile_meta.py
  python reconcile_meta.py --export exports/PRISMA_20260803_145100.csv
  python reconcile_meta.py --r-dir ../05_R Meta-analysis/data_derived
  python reconcile_meta.py --expected 12
Exit code: 0 = reconciled (or --warn), 1 = mismatch.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

import prisma_common as pc

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_R_DIR = DEFAULT_DIR.parent / "05_R Meta-analysis" / "data_derived"
DEFAULT_EXPORTS = DEFAULT_DIR / "exports"

STUDY_ID_COL = "study_id"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--export", default=None,
                   help="PRISMA export CSV (default: newest file in exports/)")
    p.add_argument("--output-dir", default=str(DEFAULT_EXPORTS))
    p.add_argument("--r-dir", default=str(DEFAULT_R_DIR),
                   help="folder with *_analysis_ready.csv datasets")
    p.add_argument("--expected", type=int, default=None,
                   help="override the expected number of studies in meta-analysis")
    p.add_argument("--warn", action="store_true",
                   help="exit 0 even on mismatch (report only)")
    return p.parse_args(argv)


def distinct_studies(csv_path: Path) -> set[str]:
    """Distinct study_id values in a dataset CSV."""
    ids: set[str] = set()
    with open(csv_path, "r", encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        if STUDY_ID_COL not in (reader.fieldnames or []):
            print(f"WARNING: {csv_path.name} has no '{STUDY_ID_COL}' column; "
                  f"columns: {reader.fieldnames}", file=sys.stderr)
            return ids
        for row in reader:
            v = (row.get(STUDY_ID_COL) or "").strip()
            if v:
                ids.add(v)
    return ids


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pc.main_argv("reconcile PRISMA totals with the R meta-analysis dataset")

    export_path = Path(args.export) if args.export else pc.find_latest_export(args.output_dir)
    if export_path is None or not export_path.is_file():
        print(f"ERROR: no PRISMA export found (run export_prisma_csv.py first "
              f"or pass --export)", file=sys.stderr)
        return 2

    rows = pc.load_csv(export_path)
    if pc.structure_errors(rows):
        print("ERROR: export file is not a valid 35x8 PRISMA CSV.", file=sys.stderr)
        return 2
    by_id = pc.by_data_id(rows)

    def n(id_):
        row = by_id.get(id_)
        return pc.n_total(row[pc.N_COL]) if row else None

    diagram_ma = n("total_studies_ma")
    diagram_total = n("total_studies")
    print(f"diagram  : total_studies={diagram_total if diagram_total is not None else '?'}, "
          f"total_studies_ma={diagram_ma if diagram_ma is not None else '?'}")
    print(f"source   : {export_path.resolve()}")

    # Distinct studies across all *_analysis_ready.csv datasets.
    r_dir = Path(args.r_dir)
    datasets = sorted(r_dir.glob("*_analysis_ready.csv")) if r_dir.is_dir() else []
    if not datasets:
        print(f"ERROR: no *_analysis_ready.csv files in {r_dir}", file=sys.stderr)
        return 2
    per_file: dict[str, int] = {}
    combined: set[str] = set()
    for ds in datasets:
        ids = distinct_studies(ds)
        per_file[ds.name] = len(ids)
        combined |= ids
    print(f"datasets : " + "; ".join(f"{k}={v}" for k, v in per_file.items()))
    print(f"distinct studies in meta-analysis datasets: {len(combined)}")

    expected = args.expected if args.expected is not None else len(combined)
    mismatch = False
    if diagram_ma is not None and diagram_ma != expected:
        print(f"MISMATCH: diagram total_studies_ma ({diagram_ma:g}) != "
              f"dataset count ({expected})")
        mismatch = True
    elif diagram_ma is not None:
        print(f"OK      : total_studies_ma ({diagram_ma:g}) matches dataset count "
              f"({expected})")
    else:
        print(f"WARNING : diagram total_studies_ma is empty/non-numeric; cannot compare")
        mismatch = True

    if diagram_total is not None and len(combined) > diagram_total:
        print(f"MISMATCH: dataset has more distinct studies ({len(combined)}) than "
              f"the diagram's total_studies ({diagram_total:g})")
        mismatch = True

    if mismatch and not args.warn:
        print("RECONCILIATION FAILED.", file=sys.stderr)
        return 1
    if mismatch:
        print("RECONCILIATION FAILED (--warn: reporting only).")
        return 0
    print("RECONCILIATION PASSED.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
