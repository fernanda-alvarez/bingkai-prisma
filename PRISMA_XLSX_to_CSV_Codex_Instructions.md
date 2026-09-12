# PRISMA XLSX → CSV Export Instructions for Codex

## Objective

Generate a **new CSV file** from the edited Excel workbook while preserving the original `PRISMA.csv` template structure exactly.

The source of the exported values is the edited workbook. The original CSV is an immutable structural reference and must never be overwritten.

## Required files

Place these files in the same working directory:

- `PRISMA.csv` — original immutable template
- `PRISMA_Editable.xlsx` — editable workbook containing the data to export
- This instruction file

The workbook contains one data sheet named exactly:

```text
PRISMA
```

## Output naming convention

Create the output in an `exports` subdirectory using:

```text
PRISMA_YYYYMMDD_HHMMSS.csv
```

Example:

```text
exports/PRISMA_20260803_145100.csv
```

Use the computer's local date and time. Never overwrite an existing output. In the unlikely event of a filename collision, append `_01`, `_02`, and so forth.

## Non-negotiable preservation rules

1. Do not modify or overwrite `PRISMA.csv`.
2. Do not modify or overwrite `PRISMA_Editable.xlsx`.
3. Read data only from the worksheet named `PRISMA`.
4. Export exactly 35 rows and 8 columns, including the header row.
5. The header must remain exactly, in this order:

```text
data,node,box,description,boxtext,tooltips,url,n
```

6. Preserve the existing row order.
7. Preserve every cell value exactly as displayed in the workbook.
8. Do not trim whitespace, change capitalization, correct spelling, translate text, normalize punctuation, or replace literal `NA` values.
9. Preserve empty cells as empty CSV fields. Do not convert empty cells to `NA`, `0`, or `None`.
10. Do not add an index column.
11. Do not add extra rows, columns, comments, metadata, formulas, or summaries to the CSV.
12. Values in the `n` column may be either simple numbers or text such as:

```text
Database 1, xxx; Database 2, xxx; Database 3, xxx
```

These values must be exported as one CSV field with standards-compliant quoting.
13. Export using:
    - comma delimiter
    - UTF-8 encoding without BOM
    - CRLF line endings
    - minimal RFC 4180-compatible quoting
    - one header row

## Structural validation before export

Load `PRISMA.csv` and use it only to validate the schema.

The export must stop with a clear error if any of these checks fail:

- `PRISMA.csv` is missing.
- `PRISMA_Editable.xlsx` is missing.
- The workbook does not contain a `PRISMA` sheet.
- The worksheet does not contain exactly 35 used rows and 8 used columns.
- The workbook header differs from the template header.
- The template itself does not contain exactly 35 rows and 8 columns.
- Any workbook cell contains an Excel formula instead of a literal value.

Do **not** require the edited body cells to equal the original template body cells. The workbook is deliberately editable; only the structure, dimensions, header, and row order must be preserved.

Use the first-column `data` identifiers from the template as a row-order guard:

- Compare the workbook's `data` column to the template's `data` column.
- Stop with a clear error if the sequence differs.
- Literal repeated values such as `NA` must remain in their original positions.

## Export procedure

1. Read `PRISMA.csv` with Python's `csv` module using UTF-8 and `newline=""`.
2. Read `PRISMA_Editable.xlsx` with `openpyxl`.
3. Select the `PRISMA` worksheet.
4. Read the exact range `A1:H35`.
5. Reject formulas. Use literal cell values only.
6. Convert `None` values to empty strings.
7. Convert all other values to strings without modifying their content.
8. Run all structural checks.
9. Create the `exports` directory if it does not exist.
10. Generate the timestamped output filename.
11. Write the rows with Python's `csv.writer` using:

```python
delimiter=","
quoting=csv.QUOTE_MINIMAL
lineterminator="\r\n"
```

12. Reopen the generated CSV and validate that:
    - it has 35 rows;
    - every row has 8 columns;
    - the header is exact;
    - every parsed output value equals the corresponding workbook value after `None` has been converted to an empty string.
13. Print the final absolute output path and a concise validation summary.

## Recommended implementation

Create a reusable script named:

```text
export_prisma_csv.py
```

The default command should be:

```bash
python export_prisma_csv.py
```

Optional command-line arguments may be supported:

```bash
python export_prisma_csv.py \
  --template PRISMA.csv \
  --workbook PRISMA_Editable.xlsx \
  --sheet PRISMA \
  --output-dir exports
```

Defaults must match the filenames and sheet name stated above.

## Acceptance criteria

The task is complete only when:

- a new timestamped CSV exists in `exports`;
- neither source file was changed;
- the generated CSV can be parsed into exactly 35 × 8 fields;
- all workbook values are represented exactly;
- commas and semicolons inside individual values remain inside the correct CSV field;
- the output passes the post-write validation;
- the final terminal message identifies the generated file.

## Important interpretation

The original CSV is the **schema and row-order template**.

The edited Excel workbook is the **authoritative source of exported data**.
