# Bingkai Prisma — PRISMA 2020 flow diagram workspace

Created and maintained by **Fernanda Alvarez Pratama** · [live app](https://bingkai-prisma.vercel.app) · [source repository](https://github.com/fernanda-alvarez/bingkai-prisma)

PRISMA 2020 flow-diagram data, validation, exports and figures for systematic reviews. Everything is scriptable so
the figure in the manuscript is traceable to one data version. Use the offline workbench (`src/` → `dist/`) to manage multiple reviews via the Project Manager.

## Files

| File | Role |
|---|---|
| `PRISMA.csv` | **Immutable** 35×8 structural template (never edited) |
| `PRISMA_Editable.xlsx` | Authoritative data source — you edit the `PRISMA` sheet here |
| `PRISMA_2020_Offline.html` | Offline PRISMA 2020 editor (interactive tweaks, PNG/SVG export, TSV paste, **per-column / per-box / per-row visibility toggles**; arrows auto re-route around hidden boxes so the flow never disconnects; **Enter on a diagram box adds a new line below it**) |
| `PRISMA_XLSX_to_CSV_Codex_Instructions.md` | Export spec (what `tools/export_prisma_csv.py` implements) |
| `source_numbers/` | Traceability map + `ExcludedStudies.tsv` (reasons source of truth) |
| `tools/` | The pipeline (below) |
| `exports/` | Timestamped CSVs produced by the pipeline |
| `figures/` | Figure kit: SVG + caption + alt text + 300 DPI PNG |
| `signoff/` | Co-author sign-off HTML (print → PDF) |

## Protocol / registration

Set per review in the Project Manager (`PROSPERO ID`, `Review ID`, `Notes`). For a new review, create a project, fill `Review title` / `PROSPERO ID`, and keep the flow-diagram numbers consistent with that review’s protocol and search strategies. Keep protocols, screening logs, participant-level data, and other unpublished research material in a private workspace; do not commit them to this public repository.

## Pipeline

```bash
# 1. Edit numbers in PRISMA_Editable.xlsx (see source_numbers/README.md for
#    where each number comes from). Optionally list excluded full-texts in
#    source_numbers/ExcludedStudies.tsv.

# 2. Export + validate  ->  exports/PRISMA_YYYYMMDD_HHMMSS.csv
python tools/export_prisma_csv.py            # --validate-only / --strict

# 3. (optional) Generate the "Reports excluded" reasons from ExcludedStudies.tsv
python tools/build_excluded_reasons.py --dry-run
python tools/build_excluded_reasons.py

# 4. Reconcile with the R meta-analysis dataset
python tools/reconcile_meta.py               # --export <csv> --warn

# 5. Diff two exports before/after a revision round
python tools/diff_exports.py exports/A.csv exports/B.csv

# 6. Figure kit (SVG + caption + alt text)
python tools/render_prisma_svg.py --input exports/PRISMA_....csv

# 7. 300 DPI PNG (uses Edge headless; no extra packages)
python tools/render_png.py --input exports/PRISMA_....csv

# 8. Co-author sign-off page (print to PDF)
python tools/make_signoff_html.py --input exports/PRISMA_....csv
```

All tools default to the newest file in `exports/`, so a full run after editing
the workbook is just:

```bash
python tools/export_prisma_csv.py && python tools/render_prisma_svg.py && \
python tools/render_png.py && python tools/make_signoff_html.py
```

## Rules

- Never overwrite `PRISMA.csv` or `PRISMA_Editable.xlsx`.
- Every export is a new timestamped file; `_reasons`/`_NN` suffixes avoid collisions.
- Never leave an `n` cell blank — unused branches get `0` (PRISMA 2020 rule).
- The figure caption should name the data file it came from (the caption files
  in `figures/` already do this), so draft versions never hide a stale figure.

## Pro Overhaul · Solo Edition (2026-08-27) — what changed

- **Design system (keeps your palette):** `src/design/tokens.css` + `components.css` — blue #246a9a / yellow #f7e6a5 kept, now with 10px radius, soft shadows, `.badge`/`.prisma-dialog`/`.cmdk` primitives. Top bar is slim; `Export` is now a split button (main=CSV, ▾=SVG/PNG/Import/Print).
- **Guided IA:** Left nav is 4-step (① Identification ② Screening ③ Eligibility ④ Included) + Projects/Checks/Visibility/Advanced. `⌘K` palette jumps to any field/box/action.
- **Diagram Pro:** Badges on nav (`Checks: 2 warn`) + viewport legend (balanced/warn) + double-click a box to edit its label inline (syncs to label editor). `Enter` on a box still adds a line; `Paste TSV` preserved.
- **Storage Pro (solo):** `localStorage` stays truth, but mirrored to IndexedDB every 2s + optional File System Access autosave to a folder you pick (`window.__prismaProStorage.pickAutosaveFolder()` → autosaves .prisma.json every 60s + on hide). Survives `file://` quirks better.
- **Single layout source:** `tools/layout.json` (20 POSITIONS + Python BOXES) — JS preview and Python SVG now derive from it; `npm run check:layout` guards drift. `tools/render_prisma_svg.py` will be wired to it in P3 (your `allow` for tiny fetch is honored — fetch only on http(s), never on `file://`).
- **Quality:** `tsconfig.json` + `vitest.config.js` + `tests/csv.test.js` (35×8 contract), `npm test` / `npm run typecheck`. Build still single-file: `src/design/*.css` + `src/style.css` → one `<style>`, `src/js/modules/*.js` → one `<script>` → `dist/PRISMA_2020_Offline.html` (207 KB).

Quirks kept, offline guarantee kept — verify after build at `http://127.0.0.1:3080` (refresh; no extra server).

## Known notes

- The Python SVG renderer is a deterministic layout distinct from the official
  tool's pixel-perfect rendering; use the offline HTML editor when you need to
  fine-tune, then re-export so the CSV remains the source of truth.
- PNG rasterization requires Microsoft Edge or Chrome (auto-detected;
  `--browser <path>` to override).
- `python` on this machine is Python 3.13; only `openpyxl` is a third-party
  dependency (used by `export_prisma_csv.py`).
