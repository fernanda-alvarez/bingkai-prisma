// geometry.ts — Pro single source for layout (TS-checked, JS-runtime is 03-render.js)
// This file is the TYPE-SAFE mirror of POSITIONS / BOXES.
// Keep it in sync with src/js/modules/03-render.js and tools/layout.json.
// Run `npm run check:layout` to verify drift.

export const VIEWBOX_WIDTH = 2140;
export const VIEWBOX_HEIGHT = 1500;

export type Position = { x: number; y: number; w: number; h?: number };

// JS positions (live preview) — must match 03-render.js POSITIONS
export const POSITIONS: Record<string, Position> = {
  prevTitle: { x: 100, y: 50, w: 350, h: 70 },
  prevBox: { x: 100, y: 145, w: 350 },
  newTitle: { x: 500, y: 50, w: 760, h: 70 },
  databaseBox: { x: 500, y: 145, w: 350 },
  otherTitle: { x: 1320, y: 50, w: 700, h: 70 },
  otherBox: { x: 1320, y: 145, w: 350 },
  duplicates: { x: 900, y: 145, w: 350 },
  screened: { x: 500, y: 560, w: 350 },
  screenedExcluded: { x: 900, y: 560, w: 350 },
  sought: { x: 500, y: 680, w: 350 },
  notRetrieved: { x: 900, y: 680, w: 350 },
  assessed: { x: 500, y: 800, w: 350 },
  databaseExcluded: { x: 900, y: 800, w: 350 },
  otherSought: { x: 1320, y: 680, w: 350 },
  otherNotRetrieved: { x: 1700, y: 680, w: 350 },
  otherAssessed: { x: 1320, y: 800, w: 350 },
  otherExcluded: { x: 1700, y: 800, w: 350 },
  newIncluded: { x: 500, y: 955, w: 350 },
  totalIncluded: { x: 500, y: 1110, w: 350 },
  metaAnalysis: { x: 500, y: 1265, w: 350 },
};

// Python boxes (figure kit) — must match tools/render_prisma_svg.py BOXES
export const PYTHON_BOXES: Record<string, [number, number, number, number]> = {
  previous_studies: [36, 158, 296, 40],
  previous_reports: [36, 212, 296, 40],
  database_results: [356, 158, 166, 40],
  register_results: [546, 158, 170, 40],
  duplicates: [546, 300, 170, 40],
  excluded_automatic: [546, 354, 170, 34],
  excluded_other: [546, 402, 170, 34],
  website_results: [740, 158, 166, 40],
  organisation_results: [926, 158, 158, 40],
  citations_results: [740, 222, 344, 40],
  records_screened: [356, 595, 360, 40],
  records_excluded: [740, 595, 344, 40],
  dbr_sought_reports: [356, 656, 360, 40],
  dbr_notretrieved_reports: [740, 656, 344, 40],
  dbr_assessed: [356, 717, 360, 40],
  dbr_excluded: [740, 717, 344, 40],
  other_sought_reports: [740, 778, 344, 40],
  other_notretrieved_reports: [740, 839, 344, 40],
  other_assessed: [740, 900, 344, 40],
  other_excluded: [740, 961, 344, 40],
  new_studies: [356, 1095, 360, 40],
  new_reports: [740, 1095, 344, 40],
  total_studies: [356, 1156, 360, 40],
  total_reports: [740, 1156, 344, 40],
  total_studies_ma: [356, 1217, 360, 40],
  total_reports_ma: [740, 1217, 344, 40],
};

// Utility: generate layout.json payload (used by tools/build_offline_html.js if needed)
export function toLayoutJson() {
  return {
    schema: "prisma2020.layout.v1",
    generated: new Date().toISOString(),
    viewBox: { width: VIEWBOX_WIDTH, height: VIEWBOX_HEIGHT },
    positions: POSITIONS,
    python: { boxes: PYTHON_BOXES },
  };
}
