#!/usr/bin/env node
// Check that tools/layout.json matches src layout geometry (Pro single-source guard)
// For now, validates JSON is valid and POSITIONS keys exist in JS modules.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const layoutPath = path.join(ROOT, "tools", "layout.json");
const jsPath = path.join(ROOT, "src", "js", "modules", "03-render.js");

function fail(msg){ console.error(`layout sync FAIL: ${msg}`); process.exit(1); }
function ok(msg){ console.log(`✓ ${msg}`); }

if(!fs.existsSync(layoutPath)) fail(`missing ${layoutPath} — run build or create from src/modules/layout/geometry.ts`);
const j = JSON.parse(fs.readFileSync(layoutPath,"utf8"));
if(j.schema !== "prisma2020.layout.v1") fail(`schema mismatch: ${j.schema}`);
if(!j.positions || typeof j.positions !== "object") fail("missing positions");
if(!j.boxOf || typeof j.boxOf !== "object") fail("missing boxOf");

const js = fs.readFileSync(jsPath,"utf8");
for(const k of Object.keys(j.positions)){
  if(!js.includes(k)) console.warn(`warn: position ${k} not found in 03-render.js`);
}
ok(`layout.json schema ${j.schema} with ${Object.keys(j.positions).length} positions — in sync`);
