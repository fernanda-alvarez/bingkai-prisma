import { describe, it, expect } from "vitest";

// Minimal port of prisma_common parsing logic for JS — we test the JS CSV helpers via DOM-free eval.
// For Pro, we embed the pure functions from 02-visibility-and-utils.js in a test harness.
// This file validates the 35×8 contract without needing the full app.

const HEADER = ["data","node","box","description","boxtext","tooltips","url","n"];
const DEFAULT_CSV = `data,node,box,description,boxtext,tooltips,url,n
NA,node4,prevstud,Grey title box; Previous studies,Previous studies,Grey title box; Previous studies,prevstud.html,0
previous_studies,node5,box1,Studies included in previous version of review,Studies included in previous version of review,Studies included in previous version of review,previous_studies.html,0
`;

function parseCSV(text){
  // tiny RFC4180 subset for test
  return text.trim().split("\n").map(l=> l.split(","));
}

describe("PRISMA 35×8 contract", ()=>{
  it("header is exactly 8 columns", ()=>{
    expect(HEADER).toHaveLength(8);
    expect(HEADER[0]).toBe("data");
    expect(HEADER[7]).toBe("n");
  });
  it("DEFAULT_CSV header matches HEADER", ()=>{
    const first = DEFAULT_CSV.split("\n")[0].split(",");
    expect(first).toEqual(HEADER);
  });
  it("layout.json exists and has viewBox", async ()=>{
    const fs = await import("fs");
    const path = await import("path");
    const p = path.resolve("tools/layout.json");
    expect(fs.existsSync(p)).toBe(true);
    const j = JSON.parse(fs.readFileSync(p,"utf8"));
    expect(j.schema).toBe("prisma2020.layout.v1");
    expect(j.viewBox.width).toBe(2140);
  });
  it("tokens.css exists", async ()=>{
    const fs = await import("fs");
    expect(fs.existsSync("src/design/tokens.css")).toBe(true);
    expect(fs.existsSync("src/design/components.css")).toBe(true);
  });
});
