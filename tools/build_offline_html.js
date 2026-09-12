#!/usr/bin/env node
// Build src/ -> dist/PRISMA_2020_Offline.html (single-file) + dist/PRISMA_Projects.html
// No deps, Node 18+. Keeps offline guarantee: dist is still one HTML with no external requests.
// Usage: node tools/build_offline_html.js [--watch] (watch not yet, run manually)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, "utf8"); console.log(`wrote ${path.relative(ROOT, p)} (${(s.length/1024).toFixed(1)} KB)`); }

function buildOffline() {
  const templatePath = path.join(SRC, "template.html");
  const stylePath = path.join(SRC, "style.css");
  const appPath = path.join(SRC, "js", "app.js");
  const modulesDir = path.join(SRC, "js", "modules");

  if (!fs.existsSync(templatePath)) throw new Error(`missing ${templatePath}`);
  if (!fs.existsSync(stylePath)) throw new Error(`missing ${stylePath}`);

  const template = read(templatePath);
  // Pro: concatenate design tokens + components + main style into one sheet
  const cssParts = [];
  const tokensPath = path.join(SRC, "design", "tokens.css");
  const componentsPath = path.join(SRC, "design", "components.css");
  if (fs.existsSync(tokensPath)) cssParts.push(read(tokensPath).trim());
  if (fs.existsSync(componentsPath)) cssParts.push(read(componentsPath).trim());
  cssParts.push(read(stylePath).trim());
  const css = cssParts.join("\n\n");

  // Prefer modules if they have real code (>500 chars total), otherwise use app.js
  let js = "";
  if (fs.existsSync(modulesDir)) {
    const mods = fs.readdirSync(modulesDir).filter(f=>f.endsWith(".js")).sort();
    const combined = mods.map(f=> read(path.join(modulesDir,f)).trim()).join("\n\n");
    // heuristic: placeholder files are <500 chars each, real split will be >2k
    const real = combined.replace(/\/\/.*$/gm,"").replace(/\s/g,"").length > 2000;
    if (real) {
      console.log(`using modules: ${mods.join(", ")}`);
      js = combined;
    }
  }
  if (!js) {
    if (!fs.existsSync(appPath)) throw new Error(`missing ${appPath} and no real modules`);
    js = read(appPath).trim();
    console.log(`using src/js/app.js (${(js.length/1024).toFixed(1)} KB)`);
  }

  // Inject style
  let out = template;
  if (!out.includes("<!-- INJECT_STYLE -->")) throw new Error("template missing <!-- INJECT_STYLE -->");
  if (!out.includes("<!-- INJECT_SCRIPT -->")) throw new Error("template missing <!-- INJECT_SCRIPT -->");
  out = out.replace("<!-- INJECT_STYLE -->", `<style>\n${css}\n  </style>`);
  out = out.replace("<!-- INJECT_SCRIPT -->", `<script>\n${js}\n</script>`);

  // Add build stamp
  const stamp = new Date().toISOString().slice(0,19).replace("T"," ");
  out = out.replace("</title>", `</title>\n  <!-- built ${stamp} from src/ -->`);

  write(path.join(DIST, "PRISMA_2020_Offline.html"), out);
  // Also copy current single-file as root for backwards compat (optional)
  write(path.join(ROOT, "PRISMA_2020_Offline.html"), out);
}

function buildProjects() {
  const srcProj = path.join(ROOT, "PRISMA_Projects.html");
  const distProj = path.join(DIST, "PRISMA_Projects.html");
  if (!fs.existsSync(srcProj)) {
    console.log("no PRISMA_Projects.html at root, skipping projects build");
    return;
  }
  const html = read(srcProj);
  // Projects dashboard is already single-file; just copy to dist
  write(distProj, html);
  // also ensure src copy exists for future modularization
  const srcCopy = path.join(SRC, "projects.html");
  if (!fs.existsSync(srcCopy)) write(srcCopy, html);
}

function main() {
  fs.mkdirSync(DIST, { recursive: true });
  buildOffline();
  buildProjects();
  console.log("build done. Open dist/PRISMA_2020_Offline.html or dist/PRISMA_Projects.html");
}

main();
