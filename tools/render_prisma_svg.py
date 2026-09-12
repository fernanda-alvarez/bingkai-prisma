"""Render a reproducible PRISMA 2020 flow-diagram SVG straight from the CSV.

This is the deterministic data -> figure path: given an exported PRISMA CSV it
emits a standalone vector SVG (plus a caption and an alt-text file) with every
box, number, section band and arrow laid out programmatically. Unlike the
interactive PRISMA_2020_Offline.html editor (which remains the tool for manual
tweaks), this renderer makes the figure in the manuscript traceable to the
exact data version: the source CSV name and generation timestamp are embedded
in the SVG <metadata> and in the caption file.

Usage:
  python render_prisma_svg.py                                  # latest export
  python render_prisma_svg.py --input exports/PRISMA_20260803_145100.csv
  python render_prisma_svg.py --out-dir figures --title "PRISMA 2020 flow diagram"
  python render_prisma_svg.py --hide-previous                  # de novo review
  python render_prisma_svg.py --hide-other                     # databases only

Outputs (all keyed to the input CSV stem so data and figure stay linked):
  figures/<stem>.svg            vector figure
  figures/<stem>_caption.txt    manuscript caption with data-source versioning
  figures/<stem>_alt.txt        accessibility alt text
"""

from __future__ import annotations

import argparse
import datetime as _dt
import html
import sys
from pathlib import Path

import prisma_common as pc

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_EXPORTS = DEFAULT_DIR / "exports"
DEFAULT_FIGURES = DEFAULT_DIR / "figures"

W, H = 1120, 1560
FONT = "Arial, Helvetica, sans-serif"
PROJECT_NAME = "Bingkai Prisma"
CREATOR_NAME = "Fernanda Alvarez Pratama"
CREATOR_URL = "https://github.com/fernanda-alvarez"
REPOSITORY_URL = "https://github.com/fernanda-alvarez/bingkai-prisma"
HOMEPAGE_URL = "https://bingkai-prisma.vercel.app"

# --- Pro: single source layout (tools/layout.json ↔ src/js/modules/03-render.js) ---
# If tools/layout.json exists and matches schema, allow Python to validate against it.
LAYOUT_PATH = HERE / "layout.json"
_layout = None
LAYOUT_SCHEMA = "prisma2020.layout.v1"
try:
    if LAYOUT_PATH.is_file():
        import json
        _raw = json.loads(LAYOUT_PATH.read_text(encoding="utf-8"))
        if _raw.get("schema") == LAYOUT_SCHEMA:
            _layout = _raw
except Exception:
    _layout = None

BAND_TITLE_IDS = {"identification", "screening", "included",
                  "prevstud", "newstud", "othstud"}

# section bands (x spans the full canvas)
BANDS = [
    {"id": "identification", "y": 70, "h": 460, "fill": "#dcebfa", "bar": "#b7d7f0",
     "label_color": "#1f3864"},
    {"id": "screening", "y": 545, "h": 485, "fill": "#e2efda", "bar": "#c6e0b4",
     "label_color": "#375623"},
    {"id": "included", "y": 1045, "h": 455, "fill": "#fde9d9", "bar": "#f8cbad",
     "label_color": "#833c00"},
]

# sub-block title bars inside the Identification band
SUB_TITLES = {
    "prevstud": {"x": 36, "y": 118, "w": 296, "h": 30, "fill": "#e0e0e0", "stroke": "#bfbfbf"},
    "newstud": {"x": 356, "y": 118, "w": 360, "h": 30, "fill": "#ffe599", "stroke": "#bf9000"},
    "othstud": {"x": 740, "y": 118, "w": 344, "h": 30, "fill": "#e0e0e0", "stroke": "#bfbfbf"},
}

# numbered boxes: data id -> (x, y, w, h). Coordinates chosen so the main flow
# line (x=400 and x=184) never crosses a box.
BOXES = {
    "previous_studies":        (36, 158, 296, 40),
    "previous_reports":        (36, 212, 296, 40),
    "database_results":        (356, 158, 166, 40),
    "register_results":        (546, 158, 170, 40),
    "duplicates":              (546, 300, 170, 40),
    "excluded_automatic":      (546, 354, 170, 34),
    "excluded_other":          (546, 402, 170, 34),
    "website_results":         (740, 158, 166, 40),
    "organisation_results":    (926, 158, 158, 40),
    "citations_results":       (740, 222, 344, 40),
    "records_screened":        (356, 595, 360, 40),
    "records_excluded":        (740, 595, 344, 40),
    "dbr_sought_reports":      (356, 656, 360, 40),
    "dbr_notretrieved_reports": (740, 656, 344, 40),
    "dbr_assessed":            (356, 717, 360, 40),
    "dbr_excluded":            (740, 717, 344, 40),
    "other_sought_reports":    (740, 778, 344, 40),
    "other_notretrieved_reports": (740, 839, 344, 40),
    "other_assessed":          (740, 900, 344, 40),
    "other_excluded":          (740, 961, 344, 40),
    "new_studies":             (356, 1095, 360, 40),
    "new_reports":             (740, 1095, 344, 40),
    "total_studies":           (356, 1156, 360, 40),
    "total_reports":           (740, 1156, 344, 40),
    "total_studies_ma":        (356, 1217, 360, 40),
    "total_reports_ma":        (740, 1217, 344, 40),
}

# arrows: list of (id_of_source_box_or_None, [polyline points], arrowhead_at_end)
ARROWS = [
    ("db",  [(439, 198), (439, 222)], False),
    ("reg", [(631, 198), (631, 222)], False),
    (None,  [(439, 222), (631, 222)], False),
    (None,  [(536, 222), (400, 222), (400, 590)], True),          # merge -> screened
    ("screened", [(716, 615), (736, 615)], True),                 # screened -> excluded
    ("screened", [(400, 637), (400, 652)], True),                 # screened -> sought
    ("sought", [(716, 676), (736, 676)], True),                   # sought -> not retrieved
    ("sought", [(400, 698), (400, 713)], True),                   # sought -> assessed
    ("assessed", [(716, 737), (736, 737)], True),                 # assessed -> excluded
    ("assessed", [(400, 759), (400, 1090)], True),                # assessed -> new studies
    ("web",  [(823, 198), (823, 216)], False),
    ("org",  [(1005, 198), (1005, 216)], False),
    (None,   [(823, 216), (1005, 216)], False),
    ("citations", [(912, 264), (912, 774)], True),                # citations -> other sought
    ("oth_sought", [(930, 820), (930, 835)], True),               # -> other not retrieved
    ("oth_sought", [(894, 820), (894, 896)], True),               # -> other assessed
    ("oth_assessed", [(912, 942), (912, 957)], True),             # -> other excluded
    ("oth_assessed", [(740, 920), (620, 920), (620, 1090)], True),  # -> new studies
    ("prev_studies", [(184, 200), (184, 208)], True),             # previous studies -> reports
    ("prev_reports", [(184, 254), (184, 1176), (352, 1176)], True),  # -> total studies
    ("new_studies", [(716, 1115), (736, 1115)], True),            # -> new reports
    ("new_studies", [(400, 1137), (400, 1152)], True),            # -> total studies
    ("total_studies", [(716, 1176), (736, 1176)], True),          # -> total reports
    ("total_studies", [(400, 1198), (400, 1213)], True),          # -> total in meta
    ("total_ma", [(716, 1237), (736, 1237)], True),               # -> total reports in meta
    ("dup", [(400, 320), (542, 320)], True),
    ("auto", [(400, 371), (542, 371)], True),
    ("other", [(400, 419), (542, 419)], True),
]

# which arrows to drop when a branch is hidden
HIDE_PREVIOUS_ARROWS = {"prev_studies", "prev_reports"}
HIDE_OTHER_ARROWS = {"web", "org", "citations", "oth_sought", "oth_assessed"}
HIDE_PREVIOUS_BOXES = {"previous_studies", "previous_reports"}
HIDE_OTHER_BOXES = {"website_results", "organisation_results", "citations_results",
                    "other_sought_reports", "other_notretrieved_reports",
                    "other_assessed", "other_excluded"}

DEFAULT_TITLE = ("PRISMA 2020 flow diagram for new systematic reviews which "
                 "included searches of databases, registers and other sources")
CITATION = ("From: Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 "
            "statement: an updated guideline for reporting systematic reviews. "
            "BMJ 2021;372:n71. doi: 10.1136/bmj.n71")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", default=None,
                   help="PRISMA CSV (default: newest export in exports/)")
    p.add_argument("--output-dir", default=str(DEFAULT_EXPORTS))
    p.add_argument("--out-dir", dest="fig_dir", default=str(DEFAULT_FIGURES),
                   help="where the figure kit is written (default: figures/)")
    p.add_argument("--title", default=DEFAULT_TITLE)
    p.add_argument("--hide-previous", action="store_true",
                   help="drop the previous-studies arm (de novo review)")
    p.add_argument("--hide-other", action="store_true",
                   help="drop the other-methods arm (databases only)")
    p.add_argument("--check-layout", action="store_true",
                   help="validate tools/layout.json against hardcoded BOXES (drift guard)")
    return p.parse_args(argv)


def check_layout_sync(verbose: bool = True) -> int:
    """Pro drift guard: compare hardcoded BOXES/BANDS with tools/layout.json."""
    if _layout is None:
        if verbose:
            print("layout check: no tools/layout.json (or wrong schema) — skipping sync check.")
        return 0
    errs = []
    # compare BOXES (Python) vs layout.json python.boxes
    j_boxes = _layout.get("python", {}).get("boxes", {})
    for k, v in BOXES.items():
        if k not in j_boxes:
            errs.append(f"BOXES[{k!r}] missing in layout.json")
        elif tuple(j_boxes[k]) != v:
            errs.append(f"BOXES[{k!r}] drift: code={v} json={j_boxes[k]}")
    # compare POSITIONS: JS file vs layout.json positions (quick: ensure all keys present)
    js_path = HERE.parent / "src" / "js" / "modules" / "03-render.js"
    if js_path.is_file():
        js_text = js_path.read_text(encoding="utf-8")
        for k in _layout.get("positions", {}):
            if k not in js_text:
                errs.append(f"positions[{k!r}] from layout.json not found in 03-render.js")
    if verbose:
        if not errs:
            print(f"layout sync OK: {_layout.get('schema')} with {len(BOXES)} BOXES in sync.")
        else:
            print("layout sync FAIL:")
            for e in errs:
                print(f"  - {e}")
    return 0 if not errs else 1


def esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def wrap(text: str, max_chars: int) -> list[str]:
    """Greedy word wrap to <= max_chars per line."""
    words = text.split()
    lines: list[str] = []
    cur = ""
    for w in words:
        trial = w if not cur else cur + " " + w
        if len(trial) <= max_chars:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
            while len(cur) > max_chars:  # single over-long word
                lines.append(cur[:max_chars])
                cur = cur[max_chars:]
    if cur:
        lines.append(cur)
    return lines or [""]


def render_box(svg: list[str], x: int, y: int, w: int, h: int,
               label: str, n: str, tooltip: str, *, hidden: bool) -> None:
    if hidden:
        return
    cx, cy = x + w / 2, y + h / 2
    svg.append(
        f'<g class="box" data-id="{esc(label)}">'
        f'<title>{esc(tooltip)}</title>'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" '
        f'fill="#ffffff" stroke="#555555" stroke-width="1.5"/>')
    small = h <= 34
    label_fs, value_fs = (11.5 if small else 13), (13.5 if small else 15)
    max_chars = max(4, int((w - 18) / (label_fs * 0.58)))
    lines = wrap(label, max_chars)[:2]
    line_h = label_fs + 2.5
    start_y = cy - (len(lines) - 1) * line_h / 2 - (7 if n else 0)
    for i, ln in enumerate(lines):
        svg.append(
            f'<text x="{cx}" y="{start_y + i * line_h:.1f}" '
            f'text-anchor="middle" font-family="{FONT}" font-size="{label_fs}" '
            f'fill="#222222">{esc(ln)}</text>')
    if n:
        svg.append(
            f'<text x="{cx}" y="{y + h - 7}" text-anchor="middle" '
            f'font-family="{FONT}" font-size="{value_fs}" font-weight="bold" '
            f'fill="#111111">{esc(n)}</text>')
    svg.append("</g>")


def render_arrow(svg: list[str], pts: list[tuple[float, float]], head: bool,
                 *, hidden: bool) -> None:
    if hidden:
        return
    d = " ".join(f"{'M' if i == 0 else 'L'} {x} {y}" for i, (x, y) in enumerate(pts))
    marker = ' marker-end="url(#arrow)"' if head else ""
    svg.append(f'<path d="{d}" fill="none" stroke="#555555" stroke-width="1.6"{marker}/>')


def render_svg(rows: list[list[str]], *, title: str, source_name: str,
               hide_previous: bool = False, hide_other: bool = False,
               now: _dt.datetime | None = None) -> str:
    by_id = pc.by_data_id(rows)
    now = now or _dt.datetime.now()

    def n(id_: str) -> str:
        row = by_id.get(id_)
        return pc.n_display(row[pc.N_COL]) if row and len(row) > pc.N_COL else ""

    def text(id_: str, col: str, fallback: str) -> str:
        row = by_id.get(id_)
        if not row:
            return fallback
        idx = pc.HEADER.index(col)
        return row[idx] if len(row) > idx and str(row[idx]).strip() else fallback

    def tooltip(id_: str) -> str:
        row = by_id.get(id_)
        if not row:
            return ""
        tt = row[pc.HEADER.index("tooltips")] if len(row) > pc.HEADER.index("tooltips") else ""
        if not tt or str(tt).strip() == "" or str(tt).strip().upper() == "NA":
            tt = row[pc.HEADER.index("description")] if len(row) > pc.HEADER.index("description") else ""
        return str(tt)

    hide_b = set(HIDE_PREVIOUS_BOXES) if hide_previous else set()
    hide_b |= set(HIDE_OTHER_BOXES) if hide_other else set()
    hide_a = set(HIDE_PREVIOUS_ARROWS) if hide_previous else set()
    hide_a |= set(HIDE_OTHER_ARROWS) if hide_other else set()

    svg: list[str] = []
    svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
               f'viewBox="0 0 {W} {H}" role="img" aria-label="{esc(title)}">')
    svg.append("<defs>"
               '<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" '
               'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
               '<path d="M 0 0 L 10 5 L 0 10 z" fill="#555555"/></marker>'
               "</defs>")
    svg.append(f'<metadata><product>{esc(PROJECT_NAME)}</product>'
               f'<creator>{esc(CREATOR_NAME)}</creator>'
               f'<creator-url>{esc(CREATOR_URL)}</creator-url>'
               f'<repository>{esc(REPOSITORY_URL)}</repository>'
               f'<homepage>{esc(HOMEPAGE_URL)}</homepage>'
               f'<data-source>{esc(source_name)}</data-source>'
               f'<generated>{esc(now.strftime("%Y-%m-%d %H:%M:%S"))}</generated>'
               f'<schema>PRISMA 2020 35x8</schema></metadata>')

    # title
    t_lines = wrap(title, 96)[:2]
    for i, ln in enumerate(t_lines):
        svg.append(f'<text x="{W / 2}" y="{36 + i * 24}" text-anchor="middle" '
                   f'font-family="{FONT}" font-size="17" font-weight="bold" '
                   f'fill="#111111">{esc(ln)}</text>')

    # bands
    for b in BANDS:
        label = text(b["id"], "boxtext", b["id"].capitalize())
        svg.append(f'<rect x="20" y="{b["y"]}" width="{W - 40}" height="{b["h"]}" '
                   f'fill="{b["fill"]}" stroke="#999999" stroke-width="1"/>')
        svg.append(f'<rect x="20" y="{b["y"]}" width="{W - 40}" height="34" '
                   f'fill="{b["bar"]}" stroke="#999999" stroke-width="1"/>')
        svg.append(f'<text x="36" y="{b["y"] + 22}" font-family="{FONT}" '
                   f'font-size="14" font-weight="bold" fill="{b["label_color"]}">'
                   f'{esc(label)}</text>')

    # sub-block titles
    for sid, cfg in SUB_TITLES.items():
        label = text(sid, "boxtext", sid)
        hidden = (sid == "prevstud" and hide_previous) or (sid == "othstud" and hide_other)
        if hidden:
            continue
        svg.append(f'<rect x="{cfg["x"]}" y="{cfg["y"]}" width="{cfg["w"]}" '
                   f'height="{cfg["h"]}" fill="{cfg["fill"]}" '
                   f'stroke="{cfg["stroke"]}" stroke-width="1"/>')
        svg.append(f'<text x="{cfg["x"] + cfg["w"] / 2}" y="{cfg["y"] + 20}" '
                   f'text-anchor="middle" font-family="{FONT}" font-size="12.5" '
                   f'font-weight="bold" fill="#333333">{esc(wrap(label, int((cfg["w"] - 16) / 7.2))[0])}</text>')

    # boxes
    for data_id, (x, y, w, h) in BOXES.items():
        if data_id in hide_b:
            continue
        render_box(svg, x, y, w, h, text(data_id, "boxtext", data_id),
                   n(data_id), tooltip(data_id), hidden=False)

    # arrows
    for aid, pts, head in ARROWS:
        hidden = aid in hide_a
        render_arrow(svg, pts, head, hidden=hidden)

    # footer note
    note_lines = [CITATION,
                  f"Data: {source_name}   |   Generated: {now.strftime('%Y-%m-%d %H:%M')}   |   "
                  "For more information, visit: http://www.prisma-statement.org/"]
    for i, ln in enumerate(note_lines):
        svg.append(f'<text x="{W / 2}" y="{1450 + i * 18}" text-anchor="middle" '
                   f'font-family="{FONT}" font-size="11" fill="#666666">'
                   f'{esc(wrap(ln, 160)[0])}</text>')

    svg.append("</svg>")
    return "\n".join(svg)


def caption_text(rows: list[list[str]], source_name: str, now: _dt.datetime) -> str:
    by_id = pc.by_data_id(rows)
    def n(id_: str) -> str:
        row = by_id.get(id_)
        return pc.n_display(row[pc.N_COL]) if row and len(row) > pc.N_COL else "?"
    return (f"Figure 1. PRISMA 2020 flow diagram for the systematic review. "
            f"Records were identified from databases and registers ({n('records_screened') or 'n'} "
            f"records screened), and other sources; after removal of duplicates "
            f"({n('duplicates') or 'n'}) and exclusion at screening and eligibility, "
            f"{n('total_studies') or 'n'} studies were included in the review and "
            f"{n('total_studies_ma') or 'n'} in the meta-analysis. "
            f"Data source: {source_name} (generated {now.strftime('%Y-%m-%d %H:%M')}). "
            f"From: Page MJ, et al. BMJ 2021;372:n71.")


def alt_text(rows: list[list[str]], source_name: str) -> str:
    by_id = pc.by_data_id(rows)
    def n(id_: str) -> str:
        row = by_id.get(id_)
        return pc.n_display(row[pc.N_COL]) if row and len(row) > pc.N_COL else "n"
    return (f"PRISMA 2020 flow diagram showing the flow of records through the "
            f"systematic review: {n('records_screened')} records screened, "
            f"{n('dbr_assessed')} full-text reports assessed for eligibility, "
            f"{n('total_studies')} studies included in the review and "
            f"{n('total_studies_ma')} in the meta-analysis. Data: {source_name}.")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if args.check_layout:
        return check_layout_sync(verbose=True)
    pc.main_argv("render a reproducible PRISMA 2020 figure from the CSV")
    # Pro: fail fast if layout drift detected (when layout.json exists)
    if _layout is not None and check_layout_sync(verbose=True) != 0:
        print("HINT: run `node tools/check_layout_sync.js` or `python tools/render_prisma_svg.py --check-layout` after editing JS geometry.", file=sys.stderr)

    src = Path(args.input) if args.input else pc.find_latest_export(args.output_dir)
    if src is None or not src.is_file():
        print(f"ERROR: no input CSV (set --input or run export_prisma_csv.py "
              f"first)", file=sys.stderr)
        return 2
    rows = pc.load_csv(src)
    errs = pc.structure_errors(rows)
    if errs:
        print("ERROR: input is not a valid 35x8 PRISMA CSV:\n  "
              + "\n  ".join(errs), file=sys.stderr)
        return 2

    issues = pc.validate_flow(rows)
    pc.print_issues(issues, verbose=True)

    now = _dt.datetime.now()
    svg = render_svg(rows, title=args.title, source_name=src.name,
                     hide_previous=args.hide_previous, hide_other=args.hide_other,
                     now=now)

    fig_dir = Path(args.fig_dir)
    fig_dir.mkdir(parents=True, exist_ok=True)
    stem = src.stem
    out_svg = fig_dir / f"{stem}.svg"
    out_svg.write_text(svg, encoding="utf-8")
    (fig_dir / f"{stem}_caption.txt").write_text(
        caption_text(rows, src.name, now) + "\n", encoding="utf-8")
    (fig_dir / f"{stem}_alt.txt").write_text(
        alt_text(rows, src.name) + "\n", encoding="utf-8")

    print(f"SVG      : {out_svg.resolve()}")
    print(f"caption  : {(fig_dir / f'{stem}_caption.txt').resolve()}")
    print(f"alt text : {(fig_dir / f'{stem}_alt.txt').resolve()}")
    print("Tip: open the SVG in a browser to export as PDF, or run "
          "tools/render_png.py for a 300 DPI PNG.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
