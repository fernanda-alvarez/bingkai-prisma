// src/js/modules/08-pro-patches.js — Pro patches for solo edition (importBundleInput3, topbar sync, etc.)
// Keep as small post-patch layer so we don't churn 01-storage.js
(function(){
  "use strict";
  if(window.__prismaProPatchesInit) return;
  window.__prismaProPatchesInit = true;

  function patchImportBundle(){
    // Support new importBundleInput3 added in Pro template (keeps old 2 working)
    const el = document.getElementById("importBundleInput3");
    if(el && !el.dataset.bound){
      el.dataset.bound="1";
      el.addEventListener("change", (e)=>{
        const f=e.target.files?.[0];
        if(f && typeof importProjectBundleFile==="function") importProjectBundleFile(f);
        e.target.value="";
      });
    }
  }

  function patchUpdateProjectUI(){
    // Wrap updateProjectUI to also sync topbar subtitle and project count badges
    if(typeof updateProjectUI!=="function") return;
    const orig = updateProjectUI;
    // Replace the local function by attaching to window and reassigning in scope is not possible for let,
    // so we poll and update DOM directly whenever projects change (decoupled).
    // Instead, we observe localStorage and also wrap via monkey-patching window.updateProjectUI if exposed.
    if(window.updateProjectUI && window.updateProjectUI!==orig){
      // already patched
    }
    // For our concatenated scope, we can't reassign the let, but we can add a side-effect observer:
    const applyTopbar = ()=>{
      try{
        const cur = (typeof getCurrentProject==="function" ? getCurrentProject() : null);
        const sub = document.getElementById("topbarProjectSubtitle");
        if(sub && cur) sub.textContent = `${cur.name}${cur.meta?.prosperoId?` · PROSPERO ${cur.meta.prosperoId}`:""} · ${new Date(cur.updatedAt).toLocaleDateString()}`;
        const cnt = document.getElementById("toolbarProjectCount");
        if(cnt){
          const n = (typeof getProjects==="function" ? getProjects().length : 0);
          cnt.textContent = String(n);
        }
      }catch(_){}
    };
    // run initially and on any storage change / click
    document.addEventListener("DOMContentLoaded", ()=> setTimeout(applyTopbar, 800));
    setInterval(applyTopbar, 2000);
    document.addEventListener("click", ()=> setTimeout(applyTopbar, 200));
    window.addEventListener("storage", applyTopbar);
    // also patch the global alias if present
    if(window.updateProjectUI){
      const wOrig = window.updateProjectUI;
      window.updateProjectUI = function(){ try{ wOrig.apply(this, arguments); }catch(_){ orig(); } applyTopbar(); };
    }
  }

  function injectAutosavePicker(){
    const host = document.getElementById("checkpointSummary")?.parentElement;
    const indicator = document.getElementById("autosaveIndicator");
    if(!host || !indicator || document.getElementById("pickAutosaveFolderBtn")) return;
    const row = document.createElement("div");
    row.className = "action-row";
    row.style.marginTop = "8px";
    row.innerHTML = `<button id="pickAutosaveFolderBtn" class="secondary small" type="button" title="Pick a folder for automatic .prisma.json saves (File System Access, optional)">Pick autosave folder</button>
      <button id="autosaveNowBtn" class="secondary small" type="button">Save to folder now</button>
      <span class="helper" style="align-self:center;">Solo · optional · stays offline</span>`;
    indicator.after(row);
    document.getElementById("pickAutosaveFolderBtn")?.addEventListener("click", async ()=>{
      if(window.__prismaProStorage?.pickAutosaveFolder){
        const ok = await window.__prismaProStorage.pickAutosaveFolder();
        if(ok && typeof setStatus==="function") setStatus("Autosave folder set — will save every 60s + on hide.");
      }
    });
    document.getElementById("autosaveNowBtn")?.addEventListener("click", async ()=>{
      const ok = await window.__prismaProStorage?.autosaveToFolder?.();
      if(typeof setStatus==="function") setStatus(ok ? "Saved bundle to autosave folder." : "No autosave folder set — pick one first.", !ok);
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    patchImportBundle();
    patchUpdateProjectUI();
    setTimeout(injectAutosavePicker, 900);
  });

  // Also ensure split menu hides on Escape
  document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape"){
      const m=document.getElementById("exportSplitMenu");
      if(m && !m.hasAttribute("hidden")) m.setAttribute("hidden","");
      const ow=document.getElementById("cmdPaletteOverlay");
      if(ow && !ow.hidden) {/* let palette handle it */}
    }
  });

})();
