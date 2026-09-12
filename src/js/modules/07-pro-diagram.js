// src/js/modules/07-pro-diagram.js — Pro diagram enhancements: badges + inline label edit + topbar sync
// Shares globals: rows, settings, computeChecks, renderDiagram, etc.

(function(){
  "use strict";
  if(window.__prismaProDiagramInit) return;
  window.__prismaProDiagramInit = true;

  function escapeHtmlLocal(s){ return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }

  // ── badges overlay ──
  function renderBadges(){
    const host = document.getElementById("diagramBadges");
    const navBadge = document.getElementById("navChecksBadge");
    const topbarSubtitle = document.getElementById("topbarProjectSubtitle");
    if(!host) return;
    // sync topbar subtitle from current project
    try{
      const cur = (typeof getCurrentProject==="function" ? getCurrentProject() : null);
      if(cur && topbarSubtitle) topbarSubtitle.textContent = `${cur.name}${cur.meta?.prosperoId?` · PROSPERO ${cur.meta.prosperoId}`:""} · ${new Date(cur.updatedAt).toLocaleDateString()}`;
    }catch(_){}

    // compute checks and render nav badge
    let checks=[];
    try{ checks = (typeof computeChecks==="function" ? computeChecks() : []); }catch(_){}
    const warns = checks.filter(c=>!c.ok);
    if(navBadge){
      if(!checks.length){ navBadge.textContent=""; navBadge.className="badge badge--muted"; navBadge.style.display="none"; }
      else if(warns.length){ navBadge.textContent = `${warns.length} warn`; navBadge.className="badge badge--warn"; navBadge.style.display=""; }
      else { navBadge.textContent = "ok"; navBadge.className="badge badge--ok"; navBadge.style.display=""; }
    }

    // place dots near affected boxes (best-effort: derive from box positions)
    // We add a small floating legend instead of per-box precise placement (which would need exact SVG coords)
    // Keep host non-interactive but show a legend at top-right of viewport
    if(!warns.length && checks.length){
      host.innerHTML = `<div style="position:absolute;right:8px;top:8px;display:flex;gap:6px;align-items:center;background:rgba(255,255,255,.92);border:1px solid var(--line);border-radius:var(--radius-full);padding:4px 8px;font-size:11px;box-shadow:var(--shadow-soft);pointer-events:none;"><span style="width:7px;height:7px;border-radius:50%;background:#2f9e6f;display:inline-block;"></span> Balanced · ${checks.length} checks</div>`;
    } else if(warns.length){
      const lines = warns.slice(0,3).map(w=> `<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:7px;height:7px;border-radius:50%;background:#d85c42;display:inline-block;"></span>${escapeHtmlLocal(w.message.slice(0,72))}</span>`).join("<br>");
      host.innerHTML = `<div style="position:absolute;right:8px;top:8px;max-width:min(420px, calc(100% - 16px));background:rgba(255,255,255,.96);border:1px solid #e8c4bc;border-radius:10px;padding:8px 10px;font-size:11px;box-shadow:var(--shadow);pointer-events:auto;line-height:1.4;">
        <div style="font-weight:800;color:#9b3d2c;margin-bottom:4px;">${warns.length} check${warns.length===1?"":"s"} need attention</div>
        <div style="color:#31546b;">${lines}</div>
        <div style="margin-top:6px;display:flex;gap:6px;">
          <button class="secondary small" type="button" id="badgeGoChecks" style="padding:4px 8px;font-size:11px;">Open Checks</button>
          <button class="secondary small" type="button" id="badgeAutoFill" style="padding:4px 8px;font-size:11px;">Auto-fill</button>
        </div>
      </div>`;
      // wire badge buttons after render
      setTimeout(()=>{
        document.getElementById("badgeGoChecks")?.addEventListener("click", ()=> showEditorSection("checks"));
        document.getElementById("badgeAutoFill")?.addEventListener("click", ()=> { if(typeof autoFillDerived==="function") autoFillDerived(); });
      }, 0);
    } else {
      host.innerHTML = "";
    }
  }

  // Wrap renderDiagram to also render badges + keep preview live dot pulsing
  function wrapRender(){
    if(typeof renderDiagram!=="function") return;
    const orig = renderDiagram;
    // We can't reassign let renderDiagram, but we can monkey-patch by wrapping the global function reference
    // Since modules are concatenated, renderDiagram is a function declaration in shared scope — we replace it via property
    try{
      // Try to patch via window if exposed, otherwise use after-hook via MutationObserver on diagram
      const desc = Object.getOwnPropertyDescriptor(window, "renderDiagram");
      // Fallback: poll and render badges after any diagram change
    }catch(_){}
    // Use MutationObserver on #diagram to re-render badges whenever it changes
    const diagram = document.getElementById("diagram");
    if(diagram){
      const obs = new MutationObserver(()=>{ renderBadges(); });
      obs.observe(diagram, {childList:true, subtree:true, attributes:true});
    }
    // Also hook after known call sites: scheduleSave -> renderDiagram already calls badges via observer
    // Initial render
    renderBadges();
  }

  // ── inline label edit — click a diagram label to edit boxtext ──
  let inlineTargetIndex = -1;
  function openInlineEdit(index){
    const row = (typeof rows!=="undefined" ? rows[index] : null);
    if(!row) return;
    if(/^(prevstud|newstud|othstud|identification|screening|included)$/.test(row.box)) return; // structural titles not inline-editable
    const wrap = document.getElementById("inlineEditWrap");
    const inp = document.getElementById("inlineEditInput");
    if(!wrap || !inp) return;
    inlineTargetIndex = index;
    inp.value = row.boxtext || row.description || "";
    wrap.hidden = false;
    // position near diagram center (simple: 50% 40%)
    wrap.style.left = "50%";
    wrap.style.top = "18%";
    wrap.style.transform = "translateX(-50%)";
    setTimeout(()=>{ inp.focus(); inp.select(); }, 10);
  }
  function commitInlineEdit(){
    const inp = document.getElementById("inlineEditInput");
    const wrap = document.getElementById("inlineEditWrap");
    if(inlineTargetIndex<0 || !inp) return;
    const val = inp.value;
    // update both boxtext and description? Keep description as tooltip source, boxtext is display label
    if(typeof rows!=="undefined" && rows[inlineTargetIndex]){
      rows[inlineTargetIndex].boxtext = val;
      // also sync to labelEditor input if present
      const lab = document.querySelector(`#labelEditor [data-row-index="${inlineTargetIndex}"][data-column="boxtext"]`);
      if(lab) lab.value = val;
      if(typeof renderDiagram==="function") renderDiagram();
      if(typeof renderLabelEditor==="function") renderLabelEditor();
      if(typeof setStatus==="function") setStatus(`Label updated for “${rows[inlineTargetIndex].data}”.`);
    }
    if(wrap) wrap.hidden = true;
    inlineTargetIndex = -1;
  }
  function cancelInlineEdit(){
    const wrap = document.getElementById("inlineEditWrap");
    if(wrap) wrap.hidden = true;
    inlineTargetIndex = -1;
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    wrapRender();
    // badge initial
    setTimeout(renderBadges, 600);
    // also re-render badges after any input that triggers renderDiagram
    document.addEventListener("input", ()=> setTimeout(renderBadges, 400));
    document.getElementById("showPrevious")?.addEventListener("change", ()=> setTimeout(renderBadges, 300));
    document.getElementById("showDatabases")?.addEventListener("change", ()=> setTimeout(renderBadges, 300));
    document.getElementById("showOther")?.addEventListener("change", ()=> setTimeout(renderBadges, 300));

    // inline edit wiring — delegate from diagram
    const diagram = document.getElementById("diagram");
    if(diagram){
      diagram.addEventListener("dblclick", (e)=>{
        const t = e.target.closest?.("[data-row-index]");
        if(!t) return;
        const idx = Number(t.getAttribute("data-row-index"));
        if(Number.isInteger(idx)) {
          e.preventDefault();
          openInlineEdit(idx);
        }
      });
      // single click hint: add title attribute dynamically
      diagram.addEventListener("mouseover", (e)=>{
        const t = e.target.closest?.("[data-row-index]");
        if(t) t.setAttribute("title", "Double-click to edit label · Enter adds line · Click focuses field");
      });
    }
    document.getElementById("inlineEditSave")?.addEventListener("click", commitInlineEdit);
    document.getElementById("inlineEditCancel")?.addEventListener("click", cancelInlineEdit);
    document.getElementById("inlineEditInput")?.addEventListener("keydown", (e)=>{
      if(e.key==="Enter"){ e.preventDefault(); commitInlineEdit(); }
      if(e.key==="Escape"){ e.preventDefault(); cancelInlineEdit(); }
    });
    // keep autosave status live
    setInterval(renderBadges, 4000);
  });

  // expose
  window.__prismaProDiagram = { renderBadges, openInlineEdit };
})();
