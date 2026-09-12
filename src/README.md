# src/ — modular source, dist/ is the single-file artifact (Pro Overhaul · Solo Edition)

**You use `dist/PRISMA_2020_Offline.html` (or root `PRISMA_2020_Offline.html` after build) — double-click, offline, no deps. You fix in `src/`.**

## Layout (Pro — 2026-08-27)

```
src/
  design/
    tokens.css            # Pro design tokens (keeps blue/grey/yellow, adds radius/shadow/motion)
    components.css        # Pro primitives: .badge, .prisma-dialog, .cmdk, .topbar, .split-button
  template.html           # Pro shell: slim topbar + collapsed Export ▾ + Cmd+K palette + badges
  style.css               # 19 KB base + Pro overrides (still single-file budget)
  js/
    app.js                # 272 B loader — build uses modules/
    app.legacy.js         # 122 KB monolith kept for diff
    modules/
      00-constants.js            # HEADER, VIEWBOX, DEFAULT_CSV, FIELD_GROUPS
      01-storage.js              # projects/checkpoints per-project LS + CRUD + bundle
      02-visibility-and-utils.js # COLUMN_OF, boxVisible, parseCSV, wrapText
      03-render.js               # POSITIONS, SVG_STYLE, getLayout, renderDiagram, checks
      04-ui.js                   # toolbar, dialogs, listeners
      05-command-palette.js      # Pro: Cmd+K palette (fuzzy search, 12 results, all actions)
      06-pro-storage.js          # Pro: IndexedDB mirror + File System Access autosave to folder
      07-pro-diagram.js          # Pro: nav badge, diagram badges, dblclick inline label edit, topbar sync
      08-pro-patches.js          # Pro: importBundleInput3, topbar sync, Escape handling
  projects.html
dist/
  PRISMA_2020_Offline.html  # 207 KB single-file — open this (no external requests)
  PRISMA_Projects.html

tools/
  layout.json             # Single source: JS POSITIONS + Python BOXES — checked by check_layout_sync.js
  build_offline_html.js   # Now concatenates tokens + components + style → single <style>
  check_layout_sync.js    # CI guard: layout.json in sync with 03-render.js
tests/
  csv.test.js             # Vitest: 35×8 contract + layout.json + tokens

Root keeps your palette (blue #246a9a / yellow #f7e6a5) — refined with 10px radius, soft shadows.
Quirks preserved: Enter on diagram box adds line, Paste TSV stays.
```

Build concatenates `src/js/modules/*.js` in numeric order; no bundler required (Vite optional for HMR).

## Workflow (Pro)

```bash
# edit a focused module
code src/design/tokens.css        # palette/radius/motion
code src/js/modules/05-command-palette.js
code src/template.html            # topbar / palette / badges

# build single-file dist (still offline)
npm run build          # → dist/PRISMA_2020_Offline.html (also root)
npm run check:layout   # verify layout.json ↔ 03-render.js
npm run typecheck      # tsc --noEmit
npm test               # vitest (35×8 contract)

# Pro features to try
# - Press Cmd+K / Ctrl+K → “export csv”, “duplicates”, “hide other”, “go to checks”
# - Dblclick a diagram box label → inline edit → Save (syncs to labelEditor)
# - Export ▾ is now a split button (main=CSV, ▾=menu with SVG/PNG/Import/Print)
# - Badges: nav “Checks” shows warn count; diagram viewport shows balanced/warn legend
# - Autosave: IDB mirror every 2s + folder autosave every 60s if you pick a folder:
#   window.__prismaProStorage.pickAutosaveFolder() then .autosaveToFolder()

# validate data
npm run validate
python tools/render_prisma_svg.py --input exports/PRISMA_*.csv

# open (no server, no install)
# file:// .../dist/PRISMA_2020_Offline.html
```

## Why Pro for solo?

* **You (solo, quick):** same single file to double-click. New top bar + palette make 4-step flow (Identification→Screening→Eligibility→Included) obvious; bad defaults are now badges on the diagram, not a hidden list.
* **Us (maintain):** tokens/components are isolated, layout.json is the single geometry source, IDB is a safe mirror (LS stays truth), tests guard the 35×8 schema. Solo autosave to folder is opt-in — no collaborator plumbing.

See `tools/build_offline_html.js` — now ~70 lines, still no deps. `app.legacy.js` kept for diff.
