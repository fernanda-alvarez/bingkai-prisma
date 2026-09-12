// src/js/modules/01-storage.js — split from app.js — do not edit header order
let EXPECTED_DATA_KEYS = null;
    const DEFAULT_ROWS = rowsFromCSV(DEFAULT_CSV);
    EXPECTED_DATA_KEYS = DEFAULT_ROWS.map((row) => row.data);

    const STORAGE_KEY = "prisma2020.offline.v1"; // legacy single-project key (kept for migration)
    const CHECKPOINT_KEY_LEGACY = "prisma2020.offline.checkpoints.v1";
    const PROJECTS_KEY = "prisma2020.projects.v1";
    const CURRENT_PID_KEY = "prisma2020.currentProjectId.v1";
    const DEFAULT_SETTINGS = {
      title: "PRISMA 2020 Flow Diagram",
      note: "",
      showPrevious: true,
      showDatabases: true,
      showOther: true,
      boxHidden: {},
      rowHidden: {}
    };
    const DEFAULT_PROJECT_META = { reviewTitle: "New systematic review", prosperoId: "", reviewId: "", notes: "" };

    let diagramZoom = 1;

    function loadSavedState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const saved = JSON.parse(raw);
        if (!saved || !Array.isArray(saved.rows) || saved.rows.length !== DEFAULT_ROWS.length) return null;
        for (let index = 0; index < saved.rows.length; index += 1) {
          if (!saved.rows[index] || saved.rows[index].data !== EXPECTED_DATA_KEYS[index]) return null;
        }
        return saved;
      } catch (error) {
        return null;
      }
    }
    function uid(prefix) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
    function makeDefaultProject(name, metaOverride) {
      return {
        id: uid("proj"),
        name: name || `Project ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meta: { ...DEFAULT_PROJECT_META, ...(metaOverride||{}) },
        rows: cloneRows(DEFAULT_ROWS),
        settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
        checkpoints: []
      };
    }
    function loadProjectsRaw() {
      try {
        const raw = window.localStorage.getItem(PROJECTS_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.projects)) return null;
        return data;
      } catch (_) { return null; }
    }
    function saveProjectsRaw(data) {
      try { window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(data)); } catch (_) {}
    }
    function ensureProjects() {
      // User chose "Discard current memory and start with clean template" — so we ignore legacy STORAGE_KEY.
      // If projects already exist, keep them; otherwise seed one clean project.
      let data = loadProjectsRaw();
      if (data && data.projects.length) return data;
      // discard legacy: do not migrate STORAGE_KEY, just start clean
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      try { window.localStorage.removeItem(CHECKPOINT_KEY_LEGACY); } catch (_) {}
      const first = makeDefaultProject("New review — clean template");
      data = { version: 1, projects: [first] };
      saveProjectsRaw(data);
      try { window.localStorage.setItem(CURRENT_PID_KEY, first.id); } catch (_) {}
      return data;
    }
    let _projectsData = ensureProjects();
    function healProject(p){
      let healed=false;
      if (!p.rows || !Array.isArray(p.rows) || p.rows.length !== DEFAULT_ROWS.length) { p.rows = cloneRows(DEFAULT_ROWS); healed=true; }
      else {
        for (let i=0;i<p.rows.length;i++) if (!p.rows[i] || p.rows[i].data !== EXPECTED_DATA_KEYS[i]) { p.rows = cloneRows(DEFAULT_ROWS); healed=true; break; }
      }
      if (!p.settings || typeof p.settings !== "object") { p.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); healed=true; }
      if (!p.meta) { p.meta = { ...DEFAULT_PROJECT_META, reviewTitle: p.name }; healed=true; }
      if (!Array.isArray(p.checkpoints)) { p.checkpoints=[]; healed=true; }
      return healed;
    }
    // heal all on load
    (function(){ let h=false; getProjects().forEach(p=>{ if(healProject(p)) h=true; }); if(h) saveProjectsRaw(_projectsData); })();
    // one-time: remove HOPECARDIS project(s) — user confirmed 2026-08-27 that HOPECARDIS is done
    (function(){
      try{
        const has = getProjects().some(p => /HOPECARDIS/i.test(p.name) || /HOPECARDIS/i.test(p.meta?.reviewTitle||""));
        if(!has) return;
        const before=getProjects().length;
        _projectsData.projects = getProjects().filter(p => !/HOPECARDIS/i.test(p.name) && !/HOPECARDIS/i.test(p.meta?.reviewTitle||""));
        if(_projectsData.projects.length===0){
          const fresh=makeDefaultProject("New review — clean template");
          _projectsData.projects=[fresh];
          try{ window.localStorage.setItem(CURRENT_PID_KEY, fresh.id);}catch(_){}
        } else if(!getProjects().some(p=>p.id===getCurrentProjectId())){
          try{ window.localStorage.setItem(CURRENT_PID_KEY, getProjects()[0].id);}catch(_){}
        }
        saveProjectsRaw(_projectsData);
        console.log(`Removed HOPECARDIS project(s): ${before} -> ${getProjects().length}`);
      }catch(_){}
    })();
    // honor ?project= query param for cross-file dashboard → workbench handoff (file:// isolation workaround)
    (function(){
      try {
        const m = location.hash.match(/project=([^&]+)/) || location.search.match(/project=([^&]+)/);
        if (m) {
          const pid = decodeURIComponent(m[1]);
          if (getProjects().some(p=>p.id===pid)) setCurrentProjectId(pid);
        }
      } catch (_) {}
    })();
    function getProjects() { return _projectsData.projects; }
    function getCurrentProjectId() {
      try {
        const pid = window.localStorage.getItem(CURRENT_PID_KEY);
        if (pid && getProjects().some(p=>p.id===pid)) return pid;
      } catch (_) {}
      return getProjects()[0]?.id || null;
    }
    function setCurrentProjectId(pid) { try { window.localStorage.setItem(CURRENT_PID_KEY, pid); } catch (_) {} }
    function getCurrentProject() {
      const pid = getCurrentProjectId();
      return getProjects().find(p=>p.id===pid) || getProjects()[0] || null;
    }
    function persistCurrentProject() {
      const cur = getCurrentProject();
      if (!cur) return;
      cur.updatedAt = new Date().toISOString();
      cur.rows = cloneRows(rows);
      cur.settings = JSON.parse(JSON.stringify(settings));
      // checkpoints are already mutated via per-project helpers
      saveProjectsRaw(_projectsData);
    }
    // legacy alias for scheduleSave to call
    function persistCurrentProjectDebounced() { persistCurrentProject(); }

    let _cur = getCurrentProject();
    if (_cur) healProject(_cur);
    let rows = cloneRows(_cur && _cur.rows && _cur.rows.length===DEFAULT_ROWS.length ? _cur.rows : DEFAULT_ROWS);
    let settings = _cur && _cur.settings ? JSON.parse(JSON.stringify(_cur.settings)) : JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    // expose for per-project checkpoint helpers
    let _currentProject = _cur;

    // ---- checkpoints / memory --------------------------------------------
    // Per-project checkpoints (migrated from global CHECKPOINT_KEY)
    const CHECKPOINT_KEY = "prisma2020.offline.checkpoints.v1"; // legacy, kept for cleanup
    function loadCheckpoints() {
      const cur = getCurrentProject();
      return cur && Array.isArray(cur.checkpoints) ? cur.checkpoints : [];
    }
    function saveCheckpoints(list) {
      const cur = getCurrentProject();
      if (!cur) return;
      cur.checkpoints = list;
      persistCurrentProject();
    }
    // One-time migration: if global checkpoints exist and current project has none, move them
    (function migrateGlobalCheckpoints(){
      try {
        const raw = window.localStorage.getItem(CHECKPOINT_KEY);
        if (!raw) return;
        const glist = JSON.parse(raw);
        if (!Array.isArray(glist) || !glist.length) return;
        const cur = getCurrentProject();
        if (cur && (!cur.checkpoints || !cur.checkpoints.length)) {
          cur.checkpoints = glist.slice(-20);
          persistCurrentProject();
        }
        // do not auto-delete legacy key yet — clearAllMemory will
      } catch (_) {}
    })();
    function checkpointSummaryText() {
      const cps = loadCheckpoints();
      if (!cps.length) return "No checkpoints yet — save one before experimenting.";
      const last = cps[cps.length-1];
      return `${cps.length} checkpoint${cps.length===1?"":"s"} — latest: “${last.name}” ${new Date(last.ts).toLocaleString()}.`;
    }
    function updateCheckpointUI() {
      const btn = document.getElementById("manageCheckpointsButton");
      const btn2 = document.getElementById("manageCheckpointsButton2");
      const summary = document.getElementById("checkpointSummary");
      const cps = loadCheckpoints();
      const label = cps.length ? `Checkpoints (${cps.length})` : "Checkpoints";
      if (btn) btn.textContent = label;
      if (btn2) btn2.textContent = label;
      if (summary) summary.textContent = checkpointSummaryText();
    }
    function createCheckpoint(explicitName) {
      let name = explicitName;
      if (name === undefined) {
        const def = `Checkpoint ${new Date().toLocaleString()}`;
        name = window.prompt("Name this checkpoint:", def);
        if (name === null) return;
        name = name.trim() || def;
      }
      const list = loadCheckpoints();
      list.push({ id: `cp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, name, ts: new Date().toISOString(), rows: cloneRows(rows), settings: JSON.parse(JSON.stringify(settings)) });
      while (list.length > 20) list.shift();
      saveCheckpoints(list);
      updateCheckpointUI(); updateProjectUI();
      setStatus(`Checkpoint saved: “${name}” (${list.length} total).`);
    }
    function restoreCheckpoint(id) {
      const list = loadCheckpoints();
      const cp = list.find(c => c.id === id);
      if (!cp) { setStatus("Checkpoint not found.", true); return; }
      rows = cloneRows(cp.rows);
      settings = JSON.parse(JSON.stringify(cp.settings));
      persistCurrentProject();
      renderEditor(); renderLabelEditor(); renderBulkTable(); renderVisibilityPanel(); syncSettingsControls(); renderDiagram();
      setStatus(`Restored checkpoint: “${cp.name}”.`);
    }
    function deleteCheckpoint(id) {
      let list = loadCheckpoints();
      const before = list.length;
      list = list.filter(c => c.id !== id);
      if (list.length === before) return;
      saveCheckpoints(list);
      updateCheckpointUI(); updateProjectUI();
      if (typeof renderCheckpointDialog === "function") renderCheckpointDialog();
      setStatus("Checkpoint deleted.");
    }
    function clearAllMemory() {
      const cps = loadCheckpoints();
      const projectName = getCurrentProject()?.name || "this project";
      const msg = cps.length
        ? `Clear memory for “${projectName}”?\n\nThis will remove:\n• auto-saved edits for this project\n• ${cps.length} checkpoint${cps.length===1?"":"s"} in this project\n\nThe project will reset to the clean template. Other projects are not affected.\n\nTip: Use “Clear ALL projects” in the Projects dashboard to wipe everything.`
        : `Clear auto-saved edits for “${projectName}” and reset to the clean template? This cannot be undone.`;
      if (!window.confirm(msg)) return;
      const cur = getCurrentProject();
      if (!cur) return;
      cur.rows = cloneRows(DEFAULT_ROWS);
      cur.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      cur.checkpoints = [];
      rows = cloneRows(cur.rows);
      settings = JSON.parse(JSON.stringify(cur.settings));
      persistCurrentProject();
      renderEditor(); renderLabelEditor(); renderBulkTable(); renderVisibilityPanel(); syncSettingsControls(); renderDiagram();
      updateCheckpointUI(); updateProjectUI();
      setStatus("Memory cleared for this project — reset to clean template. Checkpoints removed.");
    }
    function clearAllProjectsMemory() {
      if (!window.confirm("Clear ALL projects and checkpoints from this browser?\n\nThis removes every project, all checkpoints, and all auto-saved edits. The page will reset to a single clean template project. This cannot be undone.")) return;
      try { window.localStorage.removeItem(PROJECTS_KEY); } catch (_) {}
      try { window.localStorage.removeItem(CURRENT_PID_KEY); } catch (_) {}
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      try { window.localStorage.removeItem(CHECKPOINT_KEY); } catch (_) {}
      _projectsData = ensureProjects();
      const cur2 = getCurrentProject();
      rows = cloneRows(cur2.rows);
      settings = JSON.parse(JSON.stringify(cur2.settings));
      _currentProject = cur2;
      renderEditor(); renderLabelEditor(); renderBulkTable(); renderVisibilityPanel(); syncSettingsControls(); renderDiagram();
      updateCheckpointUI(); updateProjectUI();
      if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
      setStatus("All projects cleared — reset to clean template.");
    }

    // ---- project CRUD + bundle -------------------------------------------
    function switchProject(pid) {
      const target = getProjects().find(p=>p.id===pid);
      if (!target) { setStatus("Project not found.", true); return; }
      // persist current before leaving
      persistCurrentProject();
      setCurrentProjectId(pid);
      _currentProject = target;
      rows = cloneRows(target.rows);
      settings = JSON.parse(JSON.stringify(target.settings));
      renderEditor(); renderLabelEditor(); renderBulkTable(); renderVisibilityPanel(); syncSettingsControls(); renderDiagram();
      updateProjectUI(); updateCheckpointUI();
      setStatus(`Switched to project “${target.name}”.`);
    }
    function createProjectFlow() {
      const defName = `Project ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
      const name = window.prompt("New project name:", defName);
      if (name === null) return;
      const trimmed = (name.trim() || defName);
      const meta = { reviewTitle: trimmed, prosperoId: "", reviewId: "", notes: "" };
      const proj = makeDefaultProject(trimmed, meta);
      _projectsData.projects.push(proj);
      saveProjectsRaw(_projectsData);
      switchProject(proj.id);
      if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
    }
    function renameCurrentProject() {
      const cur = getCurrentProject();
      if (!cur) return;
      const name = window.prompt("Rename project:", cur.name);
      if (name === null) return;
      const trimmed = name.trim();
      if (!trimmed) { setStatus("Project name cannot be empty.", true); return; }
      cur.name = trimmed;
      cur.meta.reviewTitle = trimmed;
      persistCurrentProject(); saveProjectsRaw(_projectsData); updateProjectUI();
      setStatus(`Renamed to “${trimmed}”.`);
    }
    function duplicateCurrentProject() {
      const cur = getCurrentProject();
      if (!cur) return;
      const name = window.prompt("Duplicate as:", `${cur.name} — copy`);
      if (name === null) return;
      const trimmed = (name.trim() || `${cur.name} — copy`);
      const dup = {
        id: uid("proj"),
        name: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        meta: JSON.parse(JSON.stringify(cur.meta)),
        rows: cloneRows(rows),
        settings: JSON.parse(JSON.stringify(settings)),
        checkpoints: JSON.parse(JSON.stringify(cur.checkpoints||[]))
      };
      _projectsData.projects.push(dup);
      saveProjectsRaw(_projectsData);
      switchProject(dup.id);
      if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
    }
    function deleteCurrentProject() {
      const cur = getCurrentProject();
      if (!cur) return;
      if (getProjects().length <= 1) { setStatus("Cannot delete the last project.", true); return; }
      if (!window.confirm(`Delete project “${cur.name}”?\n\nThis removes its numbers, settings, and ${cur.checkpoints.length} checkpoint(s). This cannot be undone.`)) return;
      _projectsData.projects = _projectsData.projects.filter(p=>p.id!==cur.id);
      saveProjectsRaw(_projectsData);
      const next = _projectsData.projects[0];
      setCurrentProjectId(next.id);
      _currentProject = next;
      rows = cloneRows(next.rows);
      settings = JSON.parse(JSON.stringify(next.settings));
      renderEditor(); renderLabelEditor(); renderBulkTable(); renderVisibilityPanel(); syncSettingsControls(); renderDiagram();
      updateProjectUI(); updateCheckpointUI();
      if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
      setStatus(`Deleted. Switched to “${next.name}”.`);
    }
    function exportCurrentProjectBundle() {
      const cur = getCurrentProject();
      if (!cur) return;
      // ensure latest edits are captured
      persistCurrentProject();
      const bundle = {
        kind: "prisma2020.project-bundle.v1",
        exportedAt: new Date().toISOString(),
        project: JSON.parse(JSON.stringify(cur)),
        csv: rowsToCSV()
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {type:"application/json"});
      const safe = cur.name.replace(/[^a-z0-9\-_ ]/ig,"_").slice(0,40) || "project";
      downloadBlob(`${safe}_${new Date().toISOString().slice(0,10)}.prisma.json`, JSON.stringify(bundle,null,2), "application/json");
      setStatus(`Project bundle exported: “${cur.name}”.`);
    }
    function exportCurrentProjectCSVOnly() {
      // legacy: also offer CSV via toolbar Export CSV
      downloadBlob(`${(getCurrentProject()?.name||"PRISMA").replace(/[^a-z0-9\-_ ]/ig,"_")}.csv`, rowsToCSV(), "text/csv;charset=utf-8");
      setStatus("CSV exported for current project.");
    }
    function importProjectBundleFile(file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const bundle = JSON.parse(String(reader.result||""));
          let proj = null;
          if (bundle && bundle.kind && bundle.project) proj = bundle.project;
          else if (bundle && bundle.rows && bundle.settings) {
            // bare legacy {rows, settings} import
            proj = makeDefaultProject(bundle.name||file.name.replace(/\.json$/,""), bundle.meta||{});
            proj.rows = bundle.rows;
            proj.settings = bundle.settings;
            proj.checkpoints = bundle.checkpoints||[];
          } else { throw new Error("Unrecognized bundle format."); }
          // validate rows
          if (!Array.isArray(proj.rows) || proj.rows.length !== DEFAULT_ROWS.length) throw new Error("Bundle rows invalid (expected 35).");
          // ensure data keys match
          for (let i=0;i<proj.rows.length;i++) if (proj.rows[i].data !== EXPECTED_DATA_KEYS[i]) throw new Error(`Row ${i+1} data key mismatch in bundle.`);
          proj.id = uid("proj");
          proj.createdAt = new Date().toISOString();
          proj.updatedAt = new Date().toISOString();
          if (!proj.name) proj.name = file.name.replace(/\.json$/,"") || "Imported project";
          _projectsData.projects.push(proj);
          saveProjectsRaw(_projectsData);
          switchProject(proj.id);
          if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
          updateProjectUI();
          setStatus(`Imported project “${proj.name}”.`);
        } catch (e) {
          setStatus(`Import failed: ${e.message||e}`, true);
        }
      };
      reader.onerror = () => setStatus("Import failed: could not read file.", true);
      reader.readAsText(file);
    }
    function updateProjectMetaFromUI() {
      const cur = getCurrentProject();
      if (!cur) return;
      const nameEl = document.getElementById("projectNameInput");
      const titleEl = document.getElementById("projectReviewTitle");
      const prospEl = document.getElementById("projectProspero");
      const notesEl = document.getElementById("projectNotes");
      if (nameEl) cur.name = nameEl.value.trim() || cur.name;
      if (titleEl) cur.meta.reviewTitle = titleEl.value;
      if (prospEl) cur.meta.prosperoId = prospEl.value;
      if (notesEl) cur.meta.notes = notesEl.value;
      cur.settings.title = cur.meta.reviewTitle || cur.settings.title;
      // keep rows/settings in sync via scheduleSave already, but also persist meta
      persistCurrentProject(); saveProjectsRaw(_projectsData); updateProjectUI();
    }
    // UI wiring for project switcher + dashboard
    let _projectUIBound = false;
    function updateProjectUI() {
      const cur = getCurrentProject();
      const projs = getProjects();
      // toolbar select (hidden compat)
      const sel = document.getElementById("projectSelect");
      const sel2 = document.getElementById("projectSelect2");
      [sel, sel2].forEach(el=>{
        if (!el) return;
        el.innerHTML = projs.map(p=>`<option value="${escapeHtml(p.id)}" ${p.id===cur?.id?"selected":""}>${escapeHtml(p.name)} · ${escapeHtml(p.meta.prosperoId||"no PROSPERO")} · ${new Date(p.updatedAt).toLocaleDateString()}</option>`).join("");
      });
      // toolbar single button label
      const tLabel = document.getElementById("toolbarProjectLabel");
      if (tLabel && cur) tLabel.textContent = cur.name;
      const tCount = document.getElementById("toolbarProjectCount");
      if (tCount) tCount.textContent = `${projs.length}`;
      const pmCount = document.getElementById("pmProjectCount");
      if (pmCount) pmCount.textContent = `${projs.length} project${projs.length===1?"":"s"} in this browser`;
      const navCount = document.getElementById("navProjectsCount");
      if (navCount) navCount.textContent = `${projs.length}`;
      const nameEl = document.getElementById("projectNameInput");
      if (nameEl && cur) nameEl.value = cur.name;
      const titleEl = document.getElementById("projectReviewTitle");
      if (titleEl && cur) titleEl.value = cur.meta.reviewTitle||"";
      const prospEl = document.getElementById("projectProspero");
      if (prospEl && cur) prospEl.value = cur.meta.prosperoId||"";
      const revEl = document.getElementById("projectReviewId");
      if (revEl && cur) revEl.value = cur.meta.reviewId||"";
      const notesEl = document.getElementById("projectNotes");
      if (notesEl && cur) notesEl.value = cur.meta.notes||"";
      // stats
      const countEl = document.getElementById("projectCount");
      if (countEl) countEl.textContent = `${projs.length} project${projs.length===1?"":"s"} in this browser`;
      const countEl2 = document.getElementById("projectCount2");
      if (countEl2) countEl2.textContent = `${projs.length} project${projs.length===1?"":"s"}`;
      // delete button enablement
      const delBtn = document.getElementById("deleteProjectButton");
      const delBtn2 = document.getElementById("deleteProjectButton2");
      [delBtn, delBtn2].forEach(b=>{ if(b) b.disabled = projs.length<=1; });
      // dashboard + separate window
      if (typeof renderProjectsDashboard === "function") renderProjectsDashboard();
      if (typeof renderPmProjectList === "function") renderPmProjectList();
      if (typeof renderPmDetail === "function" && window._pmSelectedId) renderPmDetail(window._pmSelectedId);
    }
    function renderProjectsDashboard() {
      const host = document.getElementById("projectsDashboardGrid");
      if (!host) return;
      const projs = getProjects();
      const curId = getCurrentProjectId();
      host.innerHTML = projs.map(p=>{
        const isCur = p.id===curId;
        const populated = p.rows.filter(r=>r.n!=="" && r.n!=="0").length;
        const cps = (p.checkpoints||[]).length;
        // quick validation count for badge
        let errs=0, warns=0;
        try {
          // inline light validation: count non-zero numeric screens etc is heavy — reuse computeChecks if available
          // we approximate: show last updated
        } catch(_){}
        const when = new Date(p.updatedAt).toLocaleString();
        return `<div class="panel-card" style="${isCur?"border-color:#246a9a;box-shadow:0 0 0 2px rgba(36,106,154,0.12)":""};padding:14px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:start">
            <div style="min-width:0">
              <div style="font-weight:800;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(p.name)} ${isCur?'<span style="background:#246a9a;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;vertical-align:middle">current</span>':""}</div>
              <div class="helper" style="margin:2px 0 0;font-size:11px">${escapeHtml(p.meta.reviewTitle||"")}${p.meta.prosperoId?` · PROSPERO ${escapeHtml(p.meta.prosperoId)}`:""}</div>
              <div class="helper" style="margin:0;font-size:11px">Updated ${escapeHtml(when)} · ${populated} fields · ${cps} checkpoint${cps===1?"":"s"}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end">
              ${isCur?"":`<button class="secondary small" data-proj-open="${escapeHtml(p.id)}">Open</button>`}
              <button class="secondary small" data-proj-export="${escapeHtml(p.id)}">Export</button>
              <button class="secondary small" data-proj-dup="${escapeHtml(p.id)}">Duplicate</button>
              <button class="secondary small" data-proj-del="${escapeHtml(p.id)}" ${projs.length<=1?"disabled":""}>Delete</button>
            </div>
          </div>
          ${p.meta.notes?`<div class="helper" style="background:#f8fbfc;border:1px solid #e6edf1;padding:8px;font-size:12px;white-space:pre-wrap">${escapeHtml(p.meta.notes)}</div>`:""}
        </div>`;
      }).join("") || '<p class="helper">No projects.</p>';
    }
