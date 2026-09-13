# Source-of-truth numbers — where every flow-diagram number comes from

The PRISMA flow diagram must be traceable back to the screening process.
Fill `PRISMA_Editable.xlsx` from the sources below, **not** from memory. Every
row has a `data` identifier; this map says which project file is the evidence
for its `n` value.

| `data` id (box) | Value comes from | Project location |
|---|---|---|
| `database_results`, `register_results` | Per-database hit counts from the executed searches | the private protocol/search workspace |
| `duplicates` | Rayyan duplicate-removal count | `02_Screening/` (Rayyan exports) |
| `records_screened`, `records_excluded` | Title/abstract screening decisions | the private screening workspace |
| `dbr_sought_reports`, `dbr_notretrieved_reports` | Full-text retrieval log (available vs not) | the private screening workspace |
| `dbr_assessed`, `dbr_excluded` | Full-text eligibility decisions | the private extraction workspace plus this folder's `ExcludedStudies.tsv` |
| `new_studies`, `total_studies` | Final included-studies list | the private analysis workspace (reconcile with `tools/reconcile_meta.py`) |
| `total_studies_ma` | Studies actually pooled | the private analysis workspace (must match `reconcile_meta.py`) |
| `previous_studies`, `previous_reports` | 0 for a *de novo* review | — (leave `0`, never blank) |
| `website_results`, `organisation_results`, `citations_results` | Citation searching / hand-searching log | `02_Screening/`, PRISMA guidance (leave `0` if not done) |

## ExcludedStudies.tsv (this folder)

Lists every full-text report excluded at eligibility, one row per report:
`study_id  first_author  year  reason  branch` (tab-separated; `#` = comment).
It is the single source for the diagram's "Reports excluded (n)" reasons:

```bash
python tools/build_excluded_reasons.py --dry-run    # preview the strings
python tools/build_excluded_reasons.py              # write a new export with them
```

Keeping reasons here (instead of typing them into the spreadsheet) guarantees
the reasons column and the excluded-studies table can never drift apart.

## Guard rail

`tools/export_prisma_csv.py` (and every renderer) runs the PRISMA 2020 flow
arithmetic automatically: screened = identified − duplicates − excluded,
assessed = sought − not retrieved, total = previous + new, etc. Any mismatch is
reported before the export is written (`--strict` makes it fail hard).
