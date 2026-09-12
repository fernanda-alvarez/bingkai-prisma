"""Shared helpers for the PRISMA 2020 pipeline.

One schema, one validation truth: the 35-row x 8-column PRISMA CSV template
(PRISMA.csv) is the structural reference; this module implements loading,
RFC 4180 CSV I/O, workbook reading, and the PRISMA 2020 flow arithmetic
checks used by every tool in this folder.

Python >= 3.9, stdlib only (openpyxl is required only by
export_prisma_csv.py's workbook reader).
"""

from __future__ import annotations

import csv
import datetime as _dt
import re
import sys
from pathlib import Path

HEADER = ["data", "node", "box", "description", "boxtext", "tooltips", "url", "n"]
EXPECTED_ROWS = 35
EXPECTED_COLS = 8
SHEET_NAME = "PRISMA"
N_COL = HEADER.index("n")        # 7
DATA_COL = HEADER.index("data")  # 0


# ---------------------------------------------------------------- timestamp

def timestamp(now: _dt.datetime | None = None) -> str:
    """Local timestamp used for export filenames: YYYYMMDD_HHMMSS."""
    now = now or _dt.datetime.now()
    return now.strftime("%Y%m%d_%H%M%S")


# ---------------------------------------------------------------- CSV I/O

def load_csv(path: str | Path) -> list[list[str]]:
    """Read a PRISMA CSV, preserving every cell exactly (RFC 4180)."""
    with open(path, "r", encoding="utf-8-sig", newline="") as fh:
        return [row for row in csv.reader(fh)]


def save_csv(path: str | Path, rows: list[list[str]]) -> None:
    """Write rows as UTF-8 (no BOM), CRLF, minimal quoting."""
    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh, delimiter=",", quoting=csv.QUOTE_MINIMAL,
                            lineterminator="\r\n")
        writer.writerows(rows)


# ---------------------------------------------------------------- schema checks

def structure_errors(rows: list[list[str]]) -> list[str]:
    """Structural validation against the fixed 35 x 8 schema. Returns errors."""
    errs: list[str] = []
    if len(rows) != EXPECTED_ROWS:
        errs.append(f"Expected {EXPECTED_ROWS} rows, found {len(rows)}")
    if rows and rows[0] != HEADER:
        errs.append(f"Header mismatch: expected {HEADER!r}, found {rows[0]!r}")
    for i, row in enumerate(rows):
        if len(row) != EXPECTED_COLS:
            errs.append(f"Row {i + 1} has {len(row)} columns, expected {EXPECTED_COLS}")
    return errs


def by_data_id(rows: list[list[str]]) -> dict[str, list[str]]:
    """Map first-column data identifiers to rows (repeated ids allowed)."""
    return {row[DATA_COL]: row for row in rows if row[DATA_COL]}


def data_id_order(rows: list[list[str]]) -> list[str]:
    return [row[DATA_COL] for row in rows]


# ---------------------------------------------------------------- workbook reader

def read_workbook_values(xlsx_path: str | Path) -> list[list[str]]:
    """Read sheet `PRISMA`, range A1:H35, as literal strings.

    Raises ValueError if the sheet name, dimensions, header, or any cell
    containing a formula violates the export spec.
    """
    try:
        import openpyxl
    except ImportError as exc:  # pragma: no cover
        raise SystemExit("openpyxl is required:  pip install openpyxl") from exc

    wb = openpyxl.load_workbook(str(xlsx_path), data_only=False)
    if SHEET_NAME not in wb.sheetnames:
        raise ValueError(f"Workbook {xlsx_path} has no sheet named '{SHEET_NAME}' "
                         f"(sheets: {wb.sheetnames})")
    ws = wb[SHEET_NAME]
    if ws.max_row != EXPECTED_ROWS or ws.max_column != EXPECTED_COLS:
        raise ValueError(
            f"Sheet '{SHEET_NAME}' must contain exactly {EXPECTED_ROWS} used rows "
            f"and {EXPECTED_COLS} used columns; found {ws.max_row} x {ws.max_column}")

    out: list[list[str]] = []
    for r in range(1, EXPECTED_ROWS + 1):
        row: list[str] = []
        for c in range(1, EXPECTED_COLS + 1):
            cell = ws.cell(row=r, column=c)
            if cell.data_type == "f":
                raise ValueError(
                    f"Cell {cell.coordinate} contains a formula; only literal "
                    f"values are allowed")
            row.append("" if cell.value is None else str(cell.value))
        out.append(row)
    return out


# ---------------------------------------------------------------- n-field parsing

_PAIR_RE = re.compile(r"^\s*([^,]+?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")

def parse_n(value: str | None):
    """Parse a cell from the `n` column.

    Returns one of:
      ("num", float)                - a plain number
      ("sum", float, [(label, n)])  - 'Label, n; Label2, n' style text
      ("text", None)                - anything else (not usable in arithmetic)
      ("empty", None)               - empty / whitespace
    """
    if value is None:
        return ("empty", None)
    s = str(value).strip()
    if s == "":
        return ("empty", None)
    if re.fullmatch(r"-?\d+(?:\.\d+)?", s):
        return ("num", float(s))
    parts = [p for p in s.split(";") if p.strip()]
    if parts and all(_PAIR_RE.match(p) for p in parts):
        pairs = []
        total = 0.0
        for p in parts:
            m = _PAIR_RE.match(p)
            label, num = m.group(1).strip(), float(m.group(2))
            pairs.append((label, num))
            total += num
        return ("sum", total, pairs)
    return ("text", None)


def n_total(value: str | None) -> float | None:
    """Numeric total of an n-cell, or None if not parseable."""
    kind, val = parse_n(value)[:2]
    return val if kind in ("num", "sum") else None


def n_display(value: str | None) -> str:
    """Short display form used inside diagram boxes."""
    kind, val = parse_n(value)[:2]
    if kind == "empty":
        return ""
    if kind == "num":
        return str(int(val)) if float(val).is_integer() else str(val)
    if kind == "sum":
        total = int(val) if float(val).is_integer() else val
        return str(total)
    return str(value).strip()


# ---------------------------------------------------------------- flow arithmetic

def _add(*vals) -> float | None:
    nums = [n_total(v) for v in vals]
    return None if any(x is None for x in nums) else sum(nums)  # type: ignore[arg-type]


def _sub(*vals) -> float | None:
    nums = [n_total(v) for v in vals]
    if any(x is None for x in nums):
        return None
    out = nums[0]
    for x in nums[1:]:
        out = out - x
    return out  # type: ignore[return-value]


# (data id, human description, fn(getter) -> (actual, computed))
# The getter maps a data id to the raw n-cell string. Only checked when both
# sides are numeric; reason-style strings ('Label, n; ...') are summed.
FLOW_RELATIONS: list[tuple[str, str, object]] = [
    ("records_screened",
     "records_screened = database_results + register_results - duplicates "
     "- excluded_automatic - excluded_other",
     lambda g: (n_total(g("records_screened")),
                _add(g("database_results"), g("register_results"))
                - _sub(g("duplicates")) - _sub(g("excluded_automatic"))
                - _sub(g("excluded_other")))),
    ("dbr_sought_reports",
     "dbr_sought_reports = records_screened - records_excluded",
     lambda g: (n_total(g("dbr_sought_reports")),
                _sub(g("records_screened"), g("records_excluded")))),
    ("dbr_assessed",
     "dbr_assessed = dbr_sought_reports - dbr_notretrieved_reports",
     lambda g: (n_total(g("dbr_assessed")),
                _sub(g("dbr_sought_reports"), g("dbr_notretrieved_reports")))),
    ("other_sought_reports",
     "other_sought_reports = website_results + organisation_results + citations_results",
     lambda g: (n_total(g("other_sought_reports")),
                _add(g("website_results"), g("organisation_results"),
                     g("citations_results")))),
    ("other_assessed",
     "other_assessed = other_sought_reports - other_notretrieved_reports",
     lambda g: (n_total(g("other_assessed")),
                _sub(g("other_sought_reports"), g("other_notretrieved_reports")))),
    ("new_studies",
     "new_studies = (dbr_assessed - dbr_excluded) + (other_assessed - other_excluded)",
     lambda g: (_sub(g("dbr_assessed"), g("dbr_excluded"), g("other_assessed"),
                     g("other_excluded")))),
    ("total_studies",
     "total_studies = previous_studies + new_studies",
     lambda g: (n_total(g("total_studies")),
                _add(g("previous_studies"), g("new_studies")))),
    ("total_reports",
     "total_reports = previous_reports + new_reports",
     lambda g: (n_total(g("total_reports")),
                _add(g("previous_reports"), g("new_reports")))),
]


def _fmt(x: float) -> str:
    return str(int(x)) if float(x).is_integer() else str(round(x, 3))


def validate_flow(rows: list[list[str]]) -> list[dict]:
    """Run every flow-arithmetic check plus zero-fill checks.

    Returns a list of {"severity": "ERROR"|"WARNING", "data": id, "message": str}.
    A relation is checked only when every involved cell is numeric; otherwise a
    WARNING explains why it was skipped.
    """
    by_id = by_data_id(rows)

    def get(id_: str) -> str | None:
        row = by_id.get(id_)
        return None if row is None else (row[N_COL] if len(row) > N_COL else None)

    issues: list[dict] = []
    for data_id, desc, fn in FLOW_RELATIONS:
        try:
            lhs, rhs = fn(get)
        except Exception:
            lhs, rhs = None, None
        if lhs is None and rhs is None:
            issues.append({"severity": "WARNING", "data": data_id,
                           "message": f"skipped (values not numeric): {desc}"})
        elif lhs is None or rhs is None:
            issues.append({"severity": "WARNING", "data": data_id,
                           "message": f"partially numeric, check manually: {desc}"})
        elif abs(lhs - rhs) > 1e-6:
            issues.append({"severity": "ERROR", "data": data_id,
                           "message": f"mismatch: box={_fmt(lhs)} "
                                      f"computed={_fmt(rhs)} ({desc})"})

    # Zero-fill checks (PRISMA 2020 expects 0 for unused branches, never blank).
    for data_id in (
        "previous_studies", "previous_reports", "new_studies", "new_reports",
        "total_studies", "total_reports", "total_studies_ma", "total_reports_ma",
    ):
        val = get(data_id)
        if val is None or str(val).strip() == "":
            issues.append({"severity": "WARNING", "data": data_id,
                           "message": "empty n value (PRISMA 2020 expects 0 for "
                                      "unused branches, never blank)"})

    # total_studies_ma must not exceed total_studies.
    ts, tsma = n_total(get("total_studies")), n_total(get("total_studies_ma"))
    if ts is not None and tsma is not None and tsma > ts + 1e-6:
        issues.append({"severity": "ERROR", "data": "total_studies_ma",
                       "message": f"total_studies_ma ({_fmt(tsma)}) exceeds "
                                  f"total_studies ({_fmt(ts)})"})

    return issues


def print_issues(issues: list[dict], *, verbose: bool = True) -> int:
    """Print validation issues; returns 1 if any ERROR, else 0."""
    errors = [i for i in issues if i["severity"] == "ERROR"]
    warnings = [i for i in issues if i["severity"] == "WARNING"]
    if verbose:
        for i in issues:
            print(f"  [{i['severity']}] {i['data']}: {i['message']}")
        print(f"  -> {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


# ---------------------------------------------------------------- misc

def main_argv(purpose: str) -> None:
    """CLI preamble shared by every pipeline tool."""
    print(f"PRISMA 2020 pipeline tool — {purpose}")
    print(f"python: {sys.version.split()[0]}")


def find_latest_export(exports_dir: str | Path) -> Path | None:
    """Newest exports/PRISMA_*.csv by filename timestamp."""
    d = Path(exports_dir)
    if not d.is_dir():
        return None
    cands = sorted(d.glob("PRISMA_*.csv"))
    return cands[-1] if cands else None


if __name__ == "__main__":
    print("PRISMA 2020 pipeline — shared library (import only)")
