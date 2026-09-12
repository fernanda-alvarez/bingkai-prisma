// src/js/modules/05-command-palette.js — Pro command palette (Cmd+K)
// Global scope: shares rows, settings, FIELD_GROUPS, etc. from earlier modules.
// Keep palette offline, no deps, fuzzy search in-memory.

(function(){
  "use strict";

  // Avoid double-init if build concatenates twice
  if (window.__prismaCmdkInit) return;
  window.__prismaCmdkInit = true;

  const overlay = () => document.getElementById("cmdPaletteOverlay");
  const input   = () => document.getElementById("cmdPaletteInput");
  const listEl  = () => document.getElementById("cmdPaletteList");

  let selectedIndex = 0;
  let currentItems = [];

  function allCommands(){
    const cur = (typeof getCurrentProject === "function" ? getCurrentProject() : null);
    const checks = (typeof computeChecks === "function" ? computeChecks() : []);
    const hasWarn = checks.some(c=>!c.ok);
    const cmds = [];

    // navigation
    cmds.push({ id:"nav-identification", label:"Go to Identification", hint:"Section ①", action:()=> showEditorSection("identification"), keys:"g i" });
    cmds.push({ id:"nav-screening", label:"Go to Screening", hint:"Section ②", action:()=> showEditorSection("screening"), keys:"g s" });
    cmds.push({ id:"nav-eligibility", label:"Go to Eligibility", hint:"Section ③", action:()=> showEditorSection("eligibility"), keys:"g e" });
    cmds.push({ id:"nav-included", label:"Go to Included", hint:"Section ④", action:()=> showEditorSection("included"), keys:"g c" });
    cmds.push({ id:"nav-checks", label:"Go to Checks", hint:hasWarn?`${checks.filter(c=>!c.ok).length} warnings`:"All balanced", action:()=> showEditorSection("checks") });
    cmds.push({ id:"nav-visibility", label:"Go to Visibility", hint:"Show/hide columns", action:()=> showEditorSection("visibility") });
    cmds.push({ id:"nav-advanced", label:"Go to Advanced", hint:"Bulk table & labels", action:()=> showEditorSection("advanced") });
    cmds.push({ id:"nav-projects", label:"Go to Projects", hint:`${(typeof getProjects==="function"?getProjects().length:0)} projects`, action:()=> showEditorSection("projects") });
    cmds.push({ id:"nav-settings", label:"Go to Settings", hint:"Title, note, toggles", action:()=> showEditorSection("settings") });

    // field jump — each FIELD_GROUPS row
    try {
      const flat = (typeof FIELD_GROUPS!=="undefined" ? FIELD_GROUPS.flatMap(g=>g.rows) : []);
      flat.forEach(f=>{
        const row = (typeof rowById==="function" ? rowById(f.id) : null);
        const val = row ? String(row.n||"").slice(0,18) : "";
        cmds.push({
          id:`field-${f.id}`,
          label:`Go to field: ${f.label}`,
          hint: `${f.hint}${val?` · ${val}`:""}`,
          action:()=>{
            const idx = (typeof rowIndex==="function" ? rowIndex(f.id) : -1);
            if(idx>=0) showEditorSection(f.id.startsWith("previous")?"identification": f.id.startsWith("database")||f.id.startsWith("register")?"identification": f.id.startsWith("website")||f.id.startsWith("organisation")||f.id.startsWith("citations")?"identification": f.id.includes("screen")||f.id.startsWith("duplicates")?"screening": f.id.startsWith("dbr")||f.id.startsWith("other")?"eligibility":"included");
            setTimeout(()=>{ if(idx>=0 && typeof focusRow==="function") focusRow(idx); }, 40);
          },
          keys: f.id
        });
      });
    } catch(_){}

    // box jump
    try {
      if(typeof BOX_OF!=="undefined"){
        Object.entries(BOX_OF).forEach(([key, box])=>{
          if(box==="prevstud"||box==="newstud"||box==="othstud") return;
          const label = (typeof visibilityLabel==="function" ? visibilityLabel(key) : key);
          cmds.push({ id:`box-${key}`, label:`Jump to box: ${label}`, hint:`Box ${box}`, action:()=>{
            // try to find a row for this box and focus
            const items = (typeof rowsForBox==="function" ? rowsForBox(box) : []);
            if(items.length && typeof focusRow==="function") focusRow(items[0].index);
          }});
        });
      }
    } catch(_){}

    // actions
    cmds.push({ id:"export-csv", label:"Export CSV", hint:"PRISMA_2020_edited.csv", action:()=> document.getElementById("downloadCsv")?.click(), keys:"e c" });
    cmds.push({ id:"export-svg", label:"Download SVG", hint:"Vector diagram", action:()=> document.getElementById("downloadSvg")?.click(), keys:"e s" });
    cmds.push({ id:"export-png", label:"Download PNG", hint:"3× large text", action:()=> document.getElementById("downloadPng")?.click(), keys:"e p" });
    cmds.push({ id:"export-bundle", label:"Export project bundle", hint: cur?cur.name:"current project", action:()=> { if(typeof exportCurrentProjectBundle==="function") exportCurrentProjectBundle(); } });
    cmds.push({ id:"import-csv", label:"Import CSV…", hint:"Replace 35×8 data", action:()=> document.getElementById("csvInput")?.click() });
    cmds.push({ id:"save-checkpoint", label:"Save checkpoint", hint:"Freeze current edits", action:()=> { if(typeof createCheckpoint==="function") createCheckpoint(); } });
    cmds.push({ id:"manage-checkpoints", label:"Manage checkpoints", hint:"Restore / delete", action:()=> { const b=document.getElementById("manageCheckpointsButton"); b?.click(); } });
    cmds.push({ id:"autofill", label:"Auto-fill derived counts", hint:"Fill empty/zero from flow arithmetic", action:()=> { if(typeof autoFillDerived==="function") autoFillDerived(); } });
    cmds.push({ id:"show-all", label:"Show all columns & boxes", hint:"Reset visibility", action:()=> document.getElementById("showAllVisibilityButton")?.click() });
    cmds.push({ id:"toggle-previous", label: (settings.showPrevious?"Hide previous studies arm":"Show previous studies arm"), hint:"Column toggle", action:()=>{ const el=document.getElementById("showPrevious"); if(el){ el.checked=!el.checked; el.dispatchEvent(new Event("change",{bubbles:true})); } } });
    cmds.push({ id:"toggle-databases", label: (settings.showDatabases?"Hide databases & registers":"Show databases & registers"), hint:"Column toggle", action:()=>{ const el=document.getElementById("showDatabases"); if(el){ el.checked=!el.checked; el.dispatchEvent(new Event("change",{bubbles:true})); } } });
    cmds.push({ id:"toggle-other", label: (settings.showOther?"Hide other methods":"Show other methods"), hint:"Column toggle", action:()=>{ const el=document.getElementById("showOther"); if(el){ el.checked=!el.checked; el.dispatchEvent(new Event("change",{bubbles:true})); } } });
    cmds.push({ id:"projects-manage", label:"Open Project Manager", hint:`${(typeof getProjects==="function"?getProjects().length:0)} projects`, action:()=> document.getElementById("openProjectsButton")?.click() });
    cmds.push({ id:"new-project", label:"New project…", hint:"Create empty review", action:()=> { if(typeof createProjectFlow==="function") createProjectFlow(); } });
    cmds.push({ id:"print", label:"Print diagram", hint:"Browser print", action:()=> window.print() });
    cmds.push({ id:"fullscreen", label:"Toggle full screen", hint:"Diagram only", action:()=> document.getElementById("fullscreenButton")?.click() });
    cmds.push({ id:"paste-tsv", label:"Paste TSV…", hint:"Spreadsheet bulk edit", action:()=> document.getElementById("pasteTsvButton")?.click() });

    return cmds;
  }

  function fuzzyScore(q, text){
    q = q.toLowerCase().trim();
    text = text.toLowerCase();
    if(!q) return 1;
    if(text.includes(q)) return 10 + q.length;
    // subsequence score
    let qi=0, score=0;
    for(let i=0;i<text.length && qi<q.length;i++){
      if(text[i]===q[qi]){ qi++; score+=2; }
    }
    return qi===q.length ? score : 0;
  }

  function renderList(filter){
    const q = (filter||"").trim();
    const cmds = allCommands();
    let scored = cmds.map(c=>{
      const hay = `${c.label} ${c.hint||""} ${c.keys||""} ${c.id}`;
      return { c, s: q ? fuzzyScore(q, hay) : 1 };
    }).filter(x=> x.s>0);
    if(q) scored.sort((a,b)=> b.s - a.s);
    scored = scored.slice(0, 12);
    currentItems = scored.map(x=>x.c);
    const el = listEl();
    if(!el) return;
    if(!scored.length){
      el.innerHTML = `<div class="helper" style="padding:10px;text-align:center;">No commands match “${escapeHtml(q)}”. Try “export”, “duplicates”, “checks”…</div>`;
      return;
    }
    el.innerHTML = scored.map((x,i)=>{
      const isSel = i===selectedIndex;
      return `<button class="cmdk__item" role="option" aria-selected="${isSel}" data-cmd-index="${i}">
        <span style="min-width:0;text-align:left;">
          <span style="font-weight:800;">${escapeHtml(x.c.label)}</span>
          <span class="helper" style="margin-left:8px;">${escapeHtml(x.c.hint||"")}</span>
        </span>
        <kbd>${escapeHtml(x.c.keys||"↵")}</kbd>
      </button>`;
    }).join("");

    // keep selected in view
    const sel = el.querySelector(`[data-cmd-index="${selectedIndex}"]`);
    if(sel) sel.scrollIntoView({block:"nearest"});
  }

  function openPalette(prefill){
    const ov = overlay();
    const inp = input();
    if(!ov || !inp) return;
    selectedIndex = 0;
    ov.hidden = false;
    document.body.classList.add("overlay-open");
    renderList(prefill||"");
    // defer focus to next tick to avoid key event swallowing
    setTimeout(()=>{ inp.value = prefill||""; inp.focus(); inp.select(); renderList(inp.value); }, 10);
  }
  function closePalette(){
    const ov = overlay();
    if(!ov) return;
    ov.hidden = true;
    document.body.classList.remove("overlay-open");
  }
  function isOpen(){ const ov=overlay(); return ov && !ov.hidden; }

  function commitSelected(){
    const item = currentItems[selectedIndex];
    if(!item) return;
    closePalette();
    try{ item.action(); }catch(e){ console.error(e); }
  }

  // wiring
  document.addEventListener("DOMContentLoaded", ()=>{
    // buttons
    document.getElementById("cmdPaletteButton")?.addEventListener("click", ()=> openPalette(""));
    // split button main → export csv (quick), toggle → palette prefill export
    document.getElementById("exportSplitMain")?.addEventListener("click", ()=> document.getElementById("downloadCsv")?.click());
    const toggle = document.getElementById("exportSplitToggle");
    const menu = document.getElementById("exportSplitMenu");
    if(toggle && menu){
      toggle.addEventListener("click", (e)=>{
        e.stopPropagation();
        const isHidden = menu.hasAttribute("hidden");
        if(isHidden) menu.removeAttribute("hidden"); else menu.setAttribute("hidden","");
      });
      document.addEventListener("click", (e)=>{
        if(!menu.contains(e.target) && e.target!==toggle) menu.setAttribute("hidden","");
      });
      // selecting an option closes the menu (download/print/file actions still run)
      menu.addEventListener("click", (e)=>{
        if(e.target.closest("button,label")) menu.setAttribute("hidden","");
      });
    }

    const inp = input();
    const ov = overlay();
    if(inp) inp.addEventListener("input", ()=>{ selectedIndex=0; renderList(inp.value); });
    if(inp) inp.addEventListener("keydown", (e)=>{
      if(e.key==="ArrowDown"){ e.preventDefault(); selectedIndex = Math.min(selectedIndex+1, currentItems.length-1); renderList(inp.value); }
      else if(e.key==="ArrowUp"){ e.preventDefault(); selectedIndex = Math.max(selectedIndex-1, 0); renderList(inp.value); }
      else if(e.key==="Enter"){ e.preventDefault(); commitSelected(); }
      else if(e.key==="Escape"){ e.preventDefault(); closePalette(); }
    });
    if(ov) ov.addEventListener("click", (e)=>{ if(e.target===ov) closePalette(); });
    listEl()?.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-cmd-index]");
      if(!btn) return;
      selectedIndex = Number(btn.getAttribute("data-cmd-index"))||0;
      commitSelected();
    });
  });

  // global hotkey
  document.addEventListener("keydown", (e)=>{
    const isK = (e.key==="k"||e.key==="K");
    const mod = e.ctrlKey || e.metaKey;
    if(mod && isK){
      e.preventDefault();
      if(isOpen()) closePalette(); else openPalette("");
      return;
    }
    if(e.key==="/" && !e.ctrlKey && !e.metaKey && !e.altKey){
      // "/" quick open when not typing in input/textarea
      const tag = document.activeElement?.tagName?.toLowerCase();
      if(tag!=="input" && tag!=="textarea"){
        e.preventDefault();
        openPalette("");
      }
    }
    if(e.key==="Escape" && isOpen()){
      e.preventDefault();
      closePalette();
    }
  });

  // expose for other modules / console
  window.__prismaCmdk = { open: openPalette, close: closePalette, allCommands };
})();
