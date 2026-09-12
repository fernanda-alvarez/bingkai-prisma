// src/js/modules/06-pro-storage.js — Pro storage layer: IndexedDB + File System Access (solo edition)
// Keeps your localStorage as source of truth, adds IDB mirror + autosave + file handoff.
// No deps, graceful fallback if IDB unavailable (private mode, file://).

(function(){
  "use strict";
  if(window.__prismaProStorageInit) return;
  window.__prismaProStorageInit = true;

  const DB_NAME = "prisma2020.pro.v1";
  const STORE = "projects";
  const META = "meta";
  let dbPromise = null;
  let lastAutosave = null;
  let autosaveTimer = null;

  function idbAvailable(){
    try{ return "indexedDB" in window && !!window.indexedDB; }catch(_){ return false; }
  }

  function openDB(){
    if(dbPromise) return dbPromise;
    if(!idbAvailable()) return Promise.resolve(null);
    dbPromise = new Promise((resolve)=>{
      try{
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = ()=>{
          const db = req.result;
          if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, {keyPath:"id"});
          if(!db.objectStoreNames.contains(META)) db.createObjectStore(META);
        };
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> resolve(null);
        req.onblocked = ()=> resolve(null);
      }catch(_){ resolve(null); }
    });
    return dbPromise;
  }

  async function idbPut(store, value, key){
    const db = await openDB();
    if(!db) return;
    return new Promise((res)=>{
      try{
        const tx = db.transaction(store, "readwrite");
        const os = tx.objectStore(store);
        if(store===META && key) os.put(value, key);
        else os.put(value);
        tx.oncomplete = ()=> res(true);
        tx.onerror = ()=> res(false);
      }catch(_){ res(false); }
    });
  }

  async function idbGetAll(store){
    const db = await openDB();
    if(!db) return null;
    return new Promise((res)=>{
      try{
        const tx = db.transaction(store, "readonly");
        const os = tx.objectStore(store);
        const req = os.getAll();
        req.onsuccess = ()=> res(req.result||[]);
        req.onerror = ()=> res(null);
      }catch(_){ res(null); }
    });
  }

  // mirror current localStorage projects into IDB (debounced)
  function scheduleIdbMirror(){
    if(!idbAvailable()) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(async ()=>{
      try{
        const raw = window.localStorage.getItem("prisma2020.projects.v1");
        if(!raw) return;
        const data = JSON.parse(raw);
        if(!data || !Array.isArray(data.projects)) return;
        for(const p of data.projects){
          await idbPut(STORE, { id:p.id, name:p.name, updatedAt:p.updatedAt, project: p });
        }
        await idbPut(META, new Date().toISOString(), "lastMirror");
        lastAutosave = new Date();
        const el = document.getElementById("autosaveStatus");
        if(el) el.textContent = `mirrored ${lastAutosave.toLocaleTimeString()}`;
      }catch(_){}
    }, 1200);
  }

  // autosave indicator + File System Access handoff (solo)
  async function tryFileAutosave(){
    // Offer File System Access only if page was opened via File System API previously.
    // We keep it opt-in: user picks a folder once, we reuse the handle from IDB.
    try{
      if(!("showDirectoryPicker" in window)) return;
      const db = await openDB();
      if(!db) return;
      // we store directory handle in IDB meta if user granted
      // For now, just expose a helper on window for manual pick
    }catch(_){}
  }

  window.__prismaProStorage = {
    available: idbAvailable(),
    scheduleMirror: scheduleIdbMirror,
    getLastAutosave: ()=> lastAutosave,
    // manual helpers for console
    dump: async ()=> await idbGetAll(STORE),
    // File System Access: pick folder to autosave bundles
    pickAutosaveFolder: async ()=>{
      if(!("showDirectoryPicker" in window)){
        if(typeof setStatus==="function") setStatus("File System Access not available in this browser — use Export bundle instead.", true);
        return null;
      }
      try{
        const dir = await window.showDirectoryPicker({mode:"readwrite"});
        await idbPut(META, dir, "autosaveDir");
        if(typeof setStatus==="function") setStatus("Autosave folder granted — future bundles can auto-save there.");
        return dir;
      }catch(e){
        if(e && e.name==="AbortError") return null;
        if(typeof setStatus==="function") setStatus(`Folder pick failed: ${e.message||e}`, true);
        return null;
      }
    },
    // try to autosave current project as .prisma.json into the picked folder
    autosaveToFolder: async ()=>{
      try{
        const db = await openDB();
        if(!db) return false;
        const req = await new Promise((res)=>{
          try{
            const tx = db.transaction(META, "readonly");
            const os = tx.objectStore(META);
            const r = os.get("autosaveDir");
            r.onsuccess = ()=> res(r.result);
            r.onerror = ()=> res(null);
          }catch(_){ res(null); }
        });
        const dir = req;
        if(!dir) return false;
        const cur = (typeof getCurrentProject==="function" ? getCurrentProject() : null);
        if(!cur) return false;
        // ensure latest rows/settings captured
        if(typeof persistCurrentProject==="function") persistCurrentProject();
        const bundle = {
          kind:"prisma2020.project-bundle.v1",
          exportedAt: new Date().toISOString(),
          provenance: PROJECT_PROVENANCE,
          project: JSON.parse(JSON.stringify(cur)),
          csv: (typeof rowsToCSV==="function" ? rowsToCSV() : "")
        };
        const safe = (cur.name||"project").replace(/[^a-z0-9\-_ ]/ig,"_").slice(0,40)||"project";
        const filename = `${safe}_${new Date().toISOString().slice(0,10)}.prisma.json`;
        const fh = await dir.getFileHandle(filename, {create:true});
        const writable = await fh.createWritable();
        await writable.write(JSON.stringify(bundle,null,2));
        await writable.close();
        const el=document.getElementById("autosaveStatus");
        if(el) el.textContent = `saved to folder: ${filename}`;
        return true;
      }catch(e){
        console.warn("autosaveToFolder failed", e);
        return false;
      }
    }
  };

  // hook into existing persist flow: wrap persistCurrentProject
  // We patch after DOM ready so original is defined
  document.addEventListener("DOMContentLoaded", ()=>{
    const orig = window.persistCurrentProject || (typeof persistCurrentProject==="function" ? persistCurrentProject : null);
    // wrap global persistCurrentProject if exists
    if(typeof persistCurrentProject==="function"){
      const _orig = persistCurrentProject;
      // replace the function in this concatenated scope by polluting window and re-defining a wrapper
      // Since persisted via let, we hijack scheduleSave's timer to also call mirror
      const _scheduleSave = (typeof scheduleSave==="function" ? scheduleSave : null);
      if(_scheduleSave){
        // monkey patch scheduleSave to also mirror
        // We do it by replacing window.scheduleSave if exposed, and also wrapping the local
        // Simpler: poll every 2s for LS changes and mirror
        setInterval(()=>{
          try{
            const raw = window.localStorage.getItem("prisma2020.projects.v1");
            if(!raw) return;
            if(window.__lastProjectsRaw === raw) return;
            window.__lastProjectsRaw = raw;
            scheduleIdbMirror();
          }catch(_){}
        }, 2000);
      }
    }
    // also schedule on visibility change / beforeunload
    document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="hidden") scheduleIdbMirror(); });
    window.addEventListener("beforeunload", ()=>{ try{ scheduleIdbMirror(); }catch(_){} });
    // initial mirror
    setTimeout(scheduleIdbMirror, 1800);
    // expose autosave folder autosave every 60s if handle exists
    setInterval(()=>{ window.__prismaProStorage.autosaveToFolder(); }, 60000);
  });

  // Layout sync: try fetch layout.json if allowed (pro, allow fetch)
  (async()=>{
    try{
      // Only attempt fetch when running via http(s), not file:// (where fetch fails)
      if(location.protocol==="file:") return;
      const res = await fetch("tools/layout.json", {cache:"no-store"});
      if(!res.ok) return;
      const j = await res.json();
      if(j && j.schema==="prisma2020.layout.v1"){
        window.__prismaLayoutJson = j;
        console.log("[Pro] layout.json loaded, schema", j.schema);
      }
    }catch(_){}
  })();

})();
