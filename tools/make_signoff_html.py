"""Generate a self-contained co-author sign-off page for the PRISMA figure.

One HTML file with everything reviewers/co-authors need to approve the flow
diagram in a single scroll: the rendered figure, the validation summary, the
full 35 x 8 data table, and the data-source version stamps. Print to PDF from
the browser (the page has a print button and print CSS).

Usage:
  python make_signoff_html.py                        # latest export
  python make_signoff_html.py --input exports/PRISMA_20260803_145100.csv
  python make_signoff_html.py --out-dir signoff
"""

from __future__ import annotations

import argparse
import datetime as _dt
import html
from pathlib import Path

import prisma_common as pc
from render_prisma_svg import render_svg, caption_text, DEFAULT_TITLE

HERE = Path(__file__).resolve().parent
DEFAULT_DIR = HERE.parent
DEFAULT_EXPORTS = DEFAULT_DIR / "exports"
DEFAULT_SIGNOFF = DEFAULT_DIR / "signoff"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--input", default=None,
                   help="PRISMA CSV (default: newest export in exports/)")
    p.add_argument("--output-dir", default=str(DEFAULT_EXPORTS))
    p.add_argument("--out-dir", dest="sig_dir", default=str(DEFAULT_SIGNOFF))
    p.add_argument("--title", default=DEFAULT_TITLE)
    return p.parse_args(argv)


def build_html(rows: list[list[str]], *, title: str, source_name: str,
               now: _dt.datetime) -> str:
    issues = pc.validate_flow(rows)
    errors = [i for i in issues if i["severity"] == "ERROR"]
    warnings = [i for i in issues if i["severity"] == "WARNING"]
    status = ("PASS" if not errors else
              "FAIL — fix the issues below before submitting")
    status_color = "#1a7f37" if not errors else "#cf222e"

    svg = render_svg(rows, title=title, source_name=source_name, now=now)

    table_rows = []
    for r in rows:
        cells = "".join(f"<td>{html.escape(c)}</td>" for c in r)
        table_rows.append(f"<tr>{cells}</tr>")
    table = ("<table><thead><tr>" +
             "".join(f"<th>{html.escape(h)}</th>" for h in pc.HEADER) +
             f"</tr></thead><tbody>{''.join(table_rows)}</tbody></table>")

    issue_html = ""
    if issues:
        items = "".join(
            f'<li class="{i["severity"].lower()}"><code>{html.escape(i["data"])}</code> — '
            f"{html.escape(i['message'])}</li>" for i in issues)
        issue_html = f"<ul class='issues'>{items}</ul>"
    else:
        issue_html = "<p class='ok'>All flow-arithmetic and zero-fill checks passed.</p>"

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PRISMA 2020 flow diagram — co-author sign-off</title>
<style>
  body {{ font-family: Arial, Helvetica, sans-serif; margin: 0 auto; max-width: 1080px;
         padding: 24px; color: #222; }}
  h1 {{ font-size: 20px; }} h2 {{ font-size: 15px; margin-top: 28px;
       border-bottom: 1px solid #ccc; padding-bottom: 4px; }}
  .meta {{ color: #555; font-size: 12px; }}
  .status {{ display: inline-block; font-weight: bold; color: {status_color}; }}
  svg {{ width: 100%; height: auto; border: 1px solid #ddd; background: #fff; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 11px; }}
  th, td {{ border: 1px solid #ccc; padding: 3px 6px; text-align: left;
           word-break: break-word; }}
  th {{ background: #f0f0f0; }} tr:nth-child(even) td {{ background: #fafafa; }}
  ul.issues {{ list-style: none; padding: 0; }}
  li.error {{ color: #cf222e; }} li.warning {{ color: #9a6700; }}
  p.ok {{ color: #1a7f37; font-weight: bold; }}
  .footer {{ margin-top: 32px; font-size: 11px; color: #777; }}
  @media print {{ .noprint {{ display: none; }} }}
</style>
</head>
<body>
<button class="noprint" onclick="window.print()">Print / Save as PDF</button>
<h1>PRISMA 2020 flow diagram — co-author sign-off</h1>
<p class="meta">Data source: <code>{html.escape(source_name)}</code><br>
Generated: {now.strftime('%Y-%m-%d %H:%M:%S')} by
<code>tools/make_signoff_html.py</code><br>
Validation: <span class="status">{status}</span>
({len(errors)} error(s), {len(warnings)} warning(s))</p>

<h2>1. Figure</h2>
{svg}

<h2>2. Validation summary</h2>
{issue_html}

<h2>3. Data table (35 rows x 8 columns)</h2>
{table}

<p class="footer">Approval check — please confirm: (a) every number in the
figure matches the screening log; (b) the exclusion reasons are complete and
specific; (c) total studies in review / in meta-analysis match the analysis
dataset. Reply with any corrections.</p>
</body>
</html>"""


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    pc.main_argv("build the co-author sign-off page")

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

    now = _dt.datetime.now()
    sig_dir = Path(args.sig_dir)
    sig_dir.mkdir(parents=True, exist_ok=True)
    out = sig_dir / f"PRISMA_signoff_{now.strftime('%Y%m%d_%H%M%S')}.html"
    out.write_text(build_html(rows, title=args.title, source_name=src.name,
                              now=now), encoding="utf-8")
    print(f"SIGNOFF PAGE: {out.resolve()}")
    print("Open in a browser and use the Print button to make a PDF for co-authors.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
