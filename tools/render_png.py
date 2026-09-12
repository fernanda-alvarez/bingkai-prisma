"""Rasterize the PRISMA figure to a high-resolution PNG (default 300 DPI).

Uses Microsoft Edge in headless mode to screenshot a wrapper HTML page that
contains the vector SVG at exact physical size — no extra Python packages, no
browser automation libraries. Page size defaults to A4 portrait (8.27 in wide),
so a 300 DPI export is ~2481 x 3456 px, exactly what journals ask for.

Usage:
  python render_png.py                              # latest export, 300 DPI
  python render_png.py --input exports/PRISMA_20260803_145100.csv
  python render_png.py --dpi 600 --page-width-in 11
  python render_png.py --out-dir figures

Output: figures/<stem>_<dpi>dpi.png
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

import prisma_common as pc
from render_prisma_svg import render_svg, DEFAULT_TITLE

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_EXPORTS = DEFAULT_DIR / "exports"
DEFAULT_FIGURES = DEFAULT_DIR / "figures"

EDGE_CANDIDATES = [
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
]
CHROME_CANDIDATES = [
    Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    Path("C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"),
]

SVG_W, SVG_H = 1120, 1560


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", default=None,
                   help="PRISMA CSV (default: newest export in exports/)")
    p.add_argument("--output-dir", default=str(DEFAULT_EXPORTS))
    p.add_argument("--out-dir", dest="fig_dir", default=str(DEFAULT_FIGURES))
    p.add_argument("--title", default=DEFAULT_TITLE)
    p.add_argument("--dpi", type=int, default=300)
    p.add_argument("--page-width-in", type=float, default=8.27,
                   help="physical page width in inches (A4 portrait = 8.27)")
    p.add_argument("--browser", default=None,
                   help="path to Edge/Chrome executable (auto-detected otherwise)")
    return p.parse_args(argv)


def find_browser(explicit: str | None) -> Path:
    if explicit:
        p = Path(explicit)
        if p.is_file():
            return p
        raise SystemExit(f"Browser not found at: {explicit}")
    for cand in EDGE_CANDIDATES + CHROME_CANDIDATES:
        if cand.is_file():
            return cand
    raise SystemExit("No Edge/Chrome executable found; pass --browser <path>")


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pc.main_argv(f"render a {args.dpi} DPI PNG of the PRISMA figure")

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

    browser = find_browser(args.browser)
    svg = render_svg(rows, title=args.title, source_name=src.name)

    px_w = int(round(args.page_width_in * args.dpi))
    px_h = int(round(px_w * SVG_H / SVG_W))
    if max(px_w, px_h) > 16000:
        print("ERROR: target size exceeds the headless-browser window limit "
              "(16000 px); lower --dpi or --page-width-in", file=sys.stderr)
        return 2

    html_doc = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  html, body {{ margin: 0; padding: 0; background: #fff; width: {px_w}px; height: {px_h}px; }}
  svg {{ width: {px_w}px; height: {px_h}px; }}
</style></head><body>{svg}</body></html>"""

    fig_dir = Path(args.fig_dir)
    fig_dir.mkdir(parents=True, exist_ok=True)
    # Edge resolves --screenshot relative to its own cwd, so always use an
    # absolute path (the first 300 DPI run only worked by luck of cwd).
    out_png = (fig_dir / f"{src.stem}_{args.dpi}dpi.png").resolve()

    with tempfile.TemporaryDirectory(prefix="prisma_png_") as tmp:
        tmp = Path(tmp)
        page = tmp / "figure.html"
        page.write_text(html_doc, encoding="utf-8")
        profile = tmp / "profile"
        cmd = [
            str(browser), "--headless=new", "--disable-gpu", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--no-first-run", "--no-default-browser-check",
            f"--user-data-dir={profile}",
            f"--window-size={px_w},{px_h}",
            f"--screenshot={out_png}",
            page.as_uri(),
        ]
        print("running: " + " ".join(str(c) for c in cmd))
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if proc.returncode != 0:
            print("Edge stderr:", proc.stderr[-2000:], file=sys.stderr)
            print("ERROR: screenshot failed", file=sys.stderr)
            return 1

    if not out_png.is_file() or out_png.stat().st_size == 0:
        print("ERROR: Edge produced no screenshot output.", file=sys.stderr)
        return 1

    kb = out_png.stat().st_size / 1024
    print(f"PNG      : {out_png.resolve()}")
    print(f"  size   : {px_w} x {px_h} px @ {args.dpi} DPI "
          f"(page {args.page_width_in:g} in wide), {kb:.0f} KB")
    print("Tip: journals often also want the vector SVG — see "
          "tools/render_prisma_svg.py.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
