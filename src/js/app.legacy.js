"use strict";

    const HEADER = ["data", "node", "box", "description", "boxtext", "tooltips", "url", "n"];
    const VIEWBOX_WIDTH = 2140;
    const VIEWBOX_HEIGHT = 1500;
    const PNG_SCALE = 3;
    const STAGE_BAND_X = 18;
    const STAGE_BAND_WIDTH = 70;
    const STAGE_LABEL_X = STAGE_BAND_X + STAGE_BAND_WIDTH / 2;

    // The initial values come from PRISMA_Editable.xlsx, while the CSV schema follows PRISMA.csv.
    const DEFAULT_CSV = `data,node,box,description,boxtext,tooltips,url,n
NA,node4,prevstud,Grey title box; Previous studies,Previous studies,Grey title box; Previous studies,prevstud.html,0
previous_studies,node5,box1,Studies included in previous version of review,Studies included in previous version of review,Studies included in previous version of review,previous_studies.html,0
previous_reports,NA,box1,Reports of studies included in previous version of review,Reports of studies included in previous version of review,NA,previous_reports.html,0
NA,node6,newstud,Yellow title box; Identification of new studies via databases and registers,Identification of new studies via databases and registers,Yellow title box; Identification of new studies via databases and registers,newstud.html,0
database_results,node7,box2,Records identified from: Databases,Databases,Records identified from: Databases and Registers,database_results.html,0
database_specific_results,NA,box2,Records identified from: specific databases,Specific Databases,NA,database_results.html,"Database 1, xxx; Database 2, xxx; Database 3, xxx"
register_results,NA,box2,Records identified from: Registers,Registers,NA,NA,0
register_specific_results,NA,box2,Records identified from: specific registers,Specific Registers,NA,database_results.html,"Register 1, xxx; Register 2, xxx; Register 3, xxx"
NA,node16,othstud,Grey title box; Identification of new studies via other methods,Identification of new studies via other methods,Grey title box; Identification of new studies via other methods,othstud.html,0
website_results,node17,box11,Records identified from: Websites,Websites,"Records identified from: Websites, Organisations and Citation Searching",website_results.html,0
organisation_results,,box11,Records identified from: Organisations,Organisations,NA,NA,0
citations_results,NA,box11,Records identified from: Citation searching,Citation searching,NA,NA,0
duplicates,node8,box3,Duplicate records,Duplicate records,Duplicate records,duplicates.html,0
excluded_automatic,NA,box3,Records marked as ineligible by automation tools,Records marked as ineligible by automation tools,NA,NA,0
excluded_other,NA,box3,Records removed for other reasons,Records removed for other reasons,NA,NA,0
records_screened,node9,box4,Records screened (databases and registers),Records screened,Records screened (databases and registers),records_screened.html,0
records_excluded,node10,box5,Records excluded (databases and registers),Records excluded,Records excluded (databases and registers),records_excluded.html,0
dbr_sought_reports,node11,box6,Reports sought for retrieval (databases and registers),Reports sought for retrieval,Reports sought for retrieval (databases and registers),dbr_sought_reports.html,0
dbr_notretrieved_reports,node12,box7,Reports not retrieved (databases and registers),Reports not retrieved,Reports not retrieved (databases and registers),dbr_notretrieved_reports.html,0
other_sought_reports,node18,box12,Reports sought for retrieval (other),Reports sought for retrieval,Reports sought for retrieval (other),other_sought_reports.html,0
other_notretrieved_reports,node19,box13,Reports not retrieved (other),Reports not retrieved,Reports not retrieved (other),other_notretrieved_reports.html,0
dbr_assessed,node13,box8,Reports assessed for eligibility (databases and registers),Reports assessed for eligibility,Reports assessed for eligibility (databases and registers),dbr_assessed.html,0
dbr_excluded,node14,box9,"Reports excluded (databases and registers): [separate reasons and numbers using ; e.g. Reason1, xxx; Reason2, xxx; Reason3, xxx]",Reports excluded,Reports excluded (databases and registers),dbrexcludedrecords.html,"Reason1, xxx; Reason2, xxx; Reason3, xxx"
other_assessed,node20,box14,Reports assessed for eligibility (other),Reports assessed for eligibility,Reports assessed for eligibility (other),other_assessed.html,0
other_excluded,node21,box15,"Reports excluded (other): [separate reasons and numbers using ; e.g. Reason1, xxx; Reason2, xxx; Reason3, xxx]",Reports excluded,Reports excluded (other),other_excluded.html,"Reason1, xxx; Reason2, xxx; Reason3, xxx"
new_studies,node15,box10,New studies included in review,New studies included in review,New studies included in review,new_studies.html,0
new_reports,NA,box10,Reports of new included studies,Reports of new included studies,NA,NA,0
total_studies,node22,box16,Total studies included in review,Total studies included in review,Total studies included in review,total_studies.html,0
total_reports,NA,box16,Reports of total included studies,Reports of total included studies,NA,NA,0
identification,node1,identification,Blue identification box,Identification,Blue identification box,identification.html,0
screening,node2,screening,Blue screening box,Screening,Blue screening box,screening.html,0
included,node3,included,Blue included box,Included,Blue included box,included.html,0
total_studies_ma,node23,box17,Total studies included in meta-analysis,Total studies included in meta-analysis,Total studies included in meta-analysis,total_studies_meta_analysis.html,0
total_reports_ma,NA,box17,Reports of total included studies in meta-analysis,Reports of total included studies in meta-analysis,NA,NA,0`;

    const FIELD_GROUPS = [
      {
        title: "Previous version",
        help: "The previous review arm is optional.",
        rows: [
          { id: "previous_studies", label: "Studies included", hint: "Previous version", type: "count" },
          { id: "previous_reports", label: "Reports included", hint: "Previous version", type: "count" }
        ]
      },
      {
        title: "Databases and registers",
        help: "Records identified through database and register searching.",
        rows: [
          { id: "database_results", label: "Records from databases", hint: "Total records", type: "count" },
          { id: "database_specific_results", label: "Specific databases", hint: "Example: PubMed, 53; Scopus, 94", type: "text" },
          { id: "register_results", label: "Records from registers", hint: "Total records", type: "count" },
          { id: "register_specific_results", label: "Specific registers", hint: "Optional source details", type: "text" }
        ]
      },
      {
        title: "Other methods",
        help: "Websites, organisations, and citation searching.",
        rows: [
          { id: "website_results", label: "Records from websites", hint: "Total records", type: "count" },
          { id: "organisation_results", label: "Records from organisations", hint: "Total records", type: "count" },
          { id: "citations_results", label: "Records from citation searching", hint: "Total records", type: "count" }
        ]
      },
      {
        title: "Screening",
        help: "Records removed and screened after identification.",
        rows: [
          { id: "duplicates", label: "Duplicate records", hint: "Removed before screening", type: "count" },
          { id: "excluded_automatic", label: "Ineligible by automation", hint: "Removed before screening", type: "count" },
          { id: "excluded_other", label: "Removed for other reasons", hint: "Removed before screening", type: "count" },
          { id: "records_screened", label: "Records screened", hint: "Databases and registers", type: "count" },
          { id: "records_excluded", label: "Records excluded", hint: "Databases and registers", type: "count" }
        ]
      },
      {
        title: "Reports and eligibility",
        help: "Retrieval and eligibility assessment for both arms.",
        rows: [
          { id: "dbr_sought_reports", label: "Reports sought", hint: "Databases and registers", type: "count" },
          { id: "dbr_notretrieved_reports", label: "Reports not retrieved", hint: "Databases and registers", type: "count" },
          { id: "dbr_assessed", label: "Reports assessed", hint: "Databases and registers", type: "count" },
          { id: "dbr_excluded", label: "Reports excluded", hint: "Use reasons separated by semicolons", type: "text" },
          { id: "other_sought_reports", label: "Reports sought", hint: "Other methods", type: "count" },
          { id: "other_notretrieved_reports", label: "Reports not retrieved", hint: "Other methods", type: "count" },
          { id: "other_assessed", label: "Reports assessed", hint: "Other methods", type: "count" },
          { id: "other_excluded", label: "Reports excluded", hint: "Use reasons separated by semicolons", type: "text" }
        ]
      },
      {
        title: "Included",
        help: "Studies and reports included in the review and meta-analysis.",
        rows: [
          { id: "new_studies", label: "New studies included", hint: "New studies", type: "count" },
          { id: "new_reports", label: "Reports of new studies", hint: "New reports", type: "count" },
          { id: "total_studies", label: "Total studies included", hint: "All included studies", type: "count" },
          { id: "total_reports", label: "Reports of total studies", hint: "All included reports", type: "count" },
          { id: "total_studies_ma", label: "Studies in meta-analysis", hint: "Meta-analysis", type: "count" },
          { id: "total_reports_ma", label: "Reports in meta-analysis", hint: "Meta-analysis", type: "count" }
        ]
      }
    ];

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
    const DEFAULT_PROJECT_META = { reviewTitle: "HOPECARDIS — PFO closure devices", prosperoId: "", reviewId: "", notes: "" };

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
      const first = makeDefaultProject("HOPECARDIS — clean template");
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

    // ---- visibility model -------------------------------------------------
    // Every diagram key belongs to one column; each column has a settings flag
    // (showPrevious / showDatabases / showOther). The Included-band totals are
    // their own group: they are never controlled by a column flag, only by
    // per-box toggles (boxHidden).
    const COLUMN_OF = {
      prevTitle: "previous", prevBox: "previous",
      newTitle: "databases", databaseBox: "databases", duplicates: "databases",
      screened: "databases", screenedExcluded: "databases", sought: "databases",
      notRetrieved: "databases", assessed: "databases", databaseExcluded: "databases",
      otherTitle: "other", otherBox: "other", otherSought: "other",
      otherNotRetrieved: "other", otherAssessed: "other", otherExcluded: "other",
      newIncluded: "included", totalIncluded: "included", metaAnalysis: "included"
    };

    function columnFlagFor(key) {
      const col = COLUMN_OF[key];
      if (col === "previous") return settings.showPrevious;
      if (col === "databases") return settings.showDatabases;
      if (col === "other") return settings.showOther;
      return true; // included totals are never column-hidden
    }

    function boxVisible(key) {
      if (!columnFlagFor(key) || (settings.boxHidden && settings.boxHidden[key])) return false;
      const box = BOX_OF[key];
      // Title bars are structural; only numbered boxes depend on their rows.
      if (!box || box === "prevstud" || box === "newstud" || box === "othstud") return true;
      const items = rowsForBox(box);
      // A box with every row hidden is treated as hidden (arrows drop too).
      return !items.length || items.some((item) => rowVisible(item.row.data));
    }

    function rowVisible(dataId) {
      return !(settings.rowHidden && settings.rowHidden[dataId]);
    }

    const diagram = document.getElementById("diagram");
    const editorFields = document.getElementById("editorFields");
    const labelEditor = document.getElementById("labelEditor");
    const status = document.getElementById("status");
    const stats = document.getElementById("stats");
    const selectedInfo = document.getElementById("selectedInfo");
    const lastUpdated = document.getElementById("lastUpdated");
    const bulkTableBody = document.getElementById("bulkTableBody");
    const checkList = document.getElementById("checkList");
    const fullscreenOverlay = document.getElementById("fullscreenOverlay");
    const fullscreenBody = document.getElementById("fullscreenBody");
    const sectionNav = document.querySelector(".section-nav");

    let activeEditorSection = "settings";
    const EDITOR_GROUPS = {
      identification: [0, 1, 2],
      screening: [3],
      eligibility: [4],
      included: [5]
    };

    function cloneRows(source) {
      return source.map((row) => ({ ...row }));
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function rowIndex(id) {
      return rows.findIndex((row) => row.data === id);
    }

    function rowById(id) {
      return rows.find((row) => row.data === id) || null;
    }

    let saveTimer = null;
    function scheduleSave() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        try {
          persistCurrentProject();
          // also keep legacy key in sync for one release (easy rollback)
          try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows, settings })); } catch (_) {}
          if (typeof updateProjectUI === "function") updateProjectUI();
        } catch (error) {
          // Storage may be unavailable (private mode or file:// restrictions); the tab keeps working.
        }
      }, 350);
    }

    function rowForBox(box) {
      return rows.find((row) => row.box === box);
    }

    function rowsForBox(box) {
      return rows
        .map((row, index) => ({ row, index }))
        .filter((item) => item.row.box === box);
    }

    function wrapText(value, maxChars) {
      // Preserve explicit line breaks (Enter in the editor textarea) instead of
      // collapsing them: each paragraph wraps independently and stays on its
      // own line in the diagram.
      const paragraphs = String(value ?? "").split(/\r?\n/).map((p) => p.replace(/\s+/g, " ").trim());
      while (paragraphs.length && paragraphs[paragraphs.length - 1] === "") paragraphs.pop();
      while (paragraphs.length && paragraphs[0] === "") paragraphs.shift();
      if (!paragraphs.length) return [""];
      const lines = [];
      paragraphs.forEach((para) => {
        if (para === "") { lines.push(""); return; }
        const words = para.split(" ");
        let line = "";
        words.forEach((word) => {
          if (word.length > maxChars) {
            if (line) {
              lines.push(line);
              line = "";
            }
            for (let offset = 0; offset < word.length; offset += maxChars) {
              lines.push(word.slice(offset, offset + maxChars));
            }
            return;
          }
          const candidate = line ? `${line} ${word}` : word;
          if (candidate.length > maxChars && line) {
            lines.push(line);
            line = word;
          } else {
            line = candidate;
          }
        });
        if (line) lines.push(line);
      });
      return lines;
    }

    function displayValue(row) {
      // Show the raw value — no "n = " prefix (it was render-only and
      // could not be removed by editing).
      return String(row.n ?? "");
    }

    function rowMetrics(row, width) {
      const labelMax = Math.max(16, Math.floor((width - 122) / 9.2));
      const labelLines = wrapText(row.boxtext || row.description || row.data, labelMax);
      const value = displayValue(row);
      // Newline-containing values always render as multiple lines.
      const longValue = value.length > 22 || value.includes("\n");
      const valueLines = longValue ? wrapText(value, Math.max(20, Math.floor((width - 36) / 8.8))) : [];
      const contentHeight = labelLines.length * 22 + (longValue ? 24 + valueLines.length * 18 : 0);
      return {
        labelLines,
        value,
        valueLines,
        longValue,
        height: Math.max(68, contentHeight + 24)
      };
    }

    function groupHeight(box, width) {
      // Height tracks only the visible rows, so boxes shrink/grow when rows
      // are toggled on/off instead of leaving empty space.
      const items = rowsForBox(box).filter((item) => rowVisible(item.row.data));
      if (!items.length) return 0;
      return items.reduce((height, item) => height + rowMetrics(item.row, width).height, 0);
    }

    function rowLabel(row, index) {
      const key = row.data && row.data !== "NA" ? row.data : `${row.box} row ${index + 1}`;
      return key;
    }

    function parseCSV(text) {
      const source = String(text ?? "").replace(/^\uFEFF/, "");
      const parsed = [];
      let currentRow = [];
      let currentField = "";
      let inQuotes = false;
      let justClosedQuote = false;

      for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];

        if (inQuotes) {
          if (char === '"' && next === '"') {
            currentField += '"';
            index += 1;
          } else if (char === '"') {
            inQuotes = false;
            justClosedQuote = true;
          } else {
            currentField += char;
          }
          continue;
        }

        if (justClosedQuote) {
          if (char === ",") {
            currentRow.push(currentField);
            currentField = "";
            justClosedQuote = false;
          } else if (char === "\r") {
            if (next === "\n") index += 1;
            currentRow.push(currentField);
            parsed.push(currentRow);
            currentRow = [];
            currentField = "";
            justClosedQuote = false;
          } else if (char === "\n") {
            currentRow.push(currentField);
            parsed.push(currentRow);
            currentRow = [];
            currentField = "";
            justClosedQuote = false;
          } else if (char === " ") {
            // Permit a harmless space after a closing quote, but keep it out of the field.
          } else {
            throw new Error("CSV has characters after a closing quote.");
          }
          continue;
        }

        if (char === '"' && currentField === "") {
          inQuotes = true;
        } else if (char === ",") {
          currentRow.push(currentField);
          currentField = "";
        } else if (char === "\r") {
          if (next === "\n") index += 1;
          currentRow.push(currentField);
          parsed.push(currentRow);
          currentRow = [];
          currentField = "";
        } else if (char === "\n") {
          currentRow.push(currentField);
          parsed.push(currentRow);
          currentRow = [];
          currentField = "";
        } else {
          currentField += char;
        }
      }

      if (inQuotes) throw new Error("CSV has an unclosed quoted field.");
      if (justClosedQuote || currentField !== "" || currentRow.length) {
        currentRow.push(currentField);
        parsed.push(currentRow);
      }

      while (parsed.length && parsed[parsed.length - 1].length === 1 && parsed[parsed.length - 1][0] === "") {
        parsed.pop();
      }
      return parsed;
    }

    function rowsFromCSV(text) {
      const parsed = parseCSV(text);
      if (parsed.length < 35) {
        throw new Error(`Expected at least 35 rows including the header; found ${parsed.length}.`);
      }
      if (parsed[0].length !== HEADER.length || parsed[0].some((value, index) => value !== HEADER[index])) {
        throw new Error(`The header must be exactly: ${HEADER.join(",")}`);
      }
      parsed.slice(1).forEach((cells, index) => {
        if (cells.length !== HEADER.length) {
          throw new Error(`Row ${index + 2} must contain exactly 8 columns; found ${cells.length}.`);
        }
      });
      // Template rows (data ids != custom_*) must keep the template order;
      // extra lines added with Enter in the diagram may sit anywhere.
      const templateRows = parsed.slice(1).filter((cells) => !String(cells[0]).startsWith("custom_"));
      if (EXPECTED_DATA_KEYS && templateRows.length === EXPECTED_DATA_KEYS.length) {
        templateRows.forEach((cells, index) => {
          if (cells[0] !== EXPECTED_DATA_KEYS[index]) {
            throw new Error(`Row order mismatch: expected ${EXPECTED_DATA_KEYS[index]}.`);
          }
        });
      }
      return parsed.slice(1).map((cells) => Object.fromEntries(HEADER.map((key, index) => [key, cells[index]])));
    }

    function csvEscape(value) {
      const text = String(value ?? "");
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function rowsToCSV() {
      const data = [HEADER, ...rows.map((row) => HEADER.map((key) => row[key] ?? ""))];
      return `${data.map((line) => line.map(csvEscape).join(",")).join("\r\n")}\r\n`;
    }

    function setStatus(message, isError = false) {
      status.textContent = message;
      status.classList.toggle("error", isError);
    }

    function markUpdated() {
      lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    function renderEditor() {
      editorFields.innerHTML = FIELD_GROUPS.map((group, groupIndex) => `
        <section class="editor-group${groupIndex === 0 ? " first" : ""}" data-editor-group="${groupIndex}" hidden>
          <h3>${escapeHtml(group.title)} <span>${escapeHtml(group.help)}</span></h3>
          <div class="field-grid">
            ${group.rows.map((field) => {
              const index = rowIndex(field.id);
              const row = rows[index];
              const inputId = `field-${field.id}`;
              const tag = field.type === "text" ? "textarea" : "input";
              const inputAttributes = field.type === "text"
                ? `rows="2" placeholder="${escapeHtml(field.hint)}"`
                : `type="number" min="0" step="1" inputmode="numeric" placeholder="0"`;
              const value = escapeHtml(row?.n ?? "");
              const rawValue = String(row?.n ?? "").trim();
              const isInvalidCount = field.type === "count" && rawValue !== "" && numeric(rawValue) === null;
              const fieldStatus = field.type === "count"
                ? `<div class="field-status${isInvalidCount ? " invalid" : ""}" aria-live="polite">${isInvalidCount ? "Enter a whole number (0 or greater)." : "Number of records or studies"}</div>`
                : `<div class="field-status">Text or exclusion reasons</div>`;
              const control = tag === "textarea"
                ? `<textarea id="${inputId}" ${inputAttributes} data-row-index="${index}" data-column="n" autocomplete="off">${value}</textarea>`
                : `<input id="${inputId}" ${inputAttributes} data-row-index="${index}" data-column="n" autocomplete="off">`;
              return `
                <div class="field${field.type === "text" ? " full" : ""}">
                  <label for="${inputId}">${escapeHtml(field.label)}<span>${escapeHtml(field.hint)}</span></label>
                  ${control}
                  ${fieldStatus}
                </div>`;
            }).join("")}
          </div>
        </section>`).join("");

      // Input values are assigned as properties so text cannot be interpreted as markup.
      FIELD_GROUPS.flatMap((group) => group.rows).forEach((field) => {
        const index = rowIndex(field.id);
        const input = editorFields.querySelector(`[data-row-index="${index}"][data-column="n"]`);
        if (input) input.value = rows[index]?.n ?? "";
      });

      showEditorSection(activeEditorSection);
    }

    // ---- diagram visibility panel ------------------------------------------
    // POSITIONS key -> CSV "box" id, used to pull human-readable labels.
    const BOX_OF = {
      prevTitle: "prevstud", prevBox: "box1",
      newTitle: "newstud", databaseBox: "box2", duplicates: "box3",
      screened: "box4", screenedExcluded: "box5", sought: "box6",
      notRetrieved: "box7", assessed: "box8", databaseExcluded: "box9",
      newIncluded: "box10", otherTitle: "othstud", otherBox: "box11",
      otherSought: "box12", otherNotRetrieved: "box13", otherAssessed: "box14",
      otherExcluded: "box15", totalIncluded: "box16", metaAnalysis: "box17"
    };

    const VISIBILITY_GROUPS = [
      { column: "previous", title: "Previous studies", master: "showPrevious",
        keys: ["prevBox"] },
      { column: "databases", title: "Databases & registers", master: "showDatabases",
        keys: ["databaseBox", "duplicates", "screened", "screenedExcluded",
               "sought", "notRetrieved", "assessed", "databaseExcluded"] },
      { column: "other", title: "Other methods", master: "showOther",
        keys: ["otherBox", "otherSought", "otherNotRetrieved",
               "otherAssessed", "otherExcluded"] },
      { column: "included", title: "Included totals", master: null,
        keys: ["newIncluded", "totalIncluded", "metaAnalysis"] }
    ];

    function visibilityLabel(key) {
      const box = BOX_OF[key];
      const row = box ? rows.find((item) => item.box === box) : null;
      return row ? (row.boxtext || row.description || key) : key;
    }

    function renderVisibilityPanel() {
      const container = document.getElementById("visibilityGroups");
      if (!container) return;
      container.innerHTML = VISIBILITY_GROUPS.map((group) => {
        const masterToggle = group.master
          ? `<label class="toggle group-toggle"><input id="vis-master-${group.column}" type="checkbox"><span>Show this column</span></label>`
          : "";
        const boxes = group.keys.map((key) => {
          const box = BOX_OF[key];
          const rowItems = box && !["prevstud", "newstud", "othstud"].includes(box)
            ? rowsForBox(box) : [];
          const rows = rowItems.map((item) =>
            `<label class="visibility-row" id="vis-rowline-${item.row.data}">` +
            `<input id="vis-rowbox-${item.row.data}" type="checkbox" data-vis-row="${escapeHtml(item.row.data)}">` +
            `<span>${escapeHtml(item.row.boxtext || item.row.description || item.row.data)}</span></label>`).join("");
          return `<div class="visibility-box-wrap" id="vis-boxwrap-${key}">` +
                 `<label class="visibility-box" id="vis-row-${key}">` +
                 `<input id="vis-box-${key}" type="checkbox" data-vis-key="${key}">` +
                 `<span>${escapeHtml(visibilityLabel(key))}</span></label>` +
                 (rows ? `<div class="visibility-rows">${rows}</div>` : "") +
                 `</div>`;
        }).join("");
        return `<div class="visibility-group" data-vis-column="${group.column}">` +
               `<h3>${escapeHtml(group.title)}</h3>${masterToggle}` +
               `<div class="visibility-boxes">${boxes}</div></div>`;
      }).join("");
      syncVisibilityControls();
    }

    function syncVisibilityControls() {
      VISIBILITY_GROUPS.forEach((group) => {
        if (group.master) {
          const master = document.getElementById(`vis-master-${group.column}`);
          if (master) master.checked = Boolean(settings[group.master]);
        }
        const columnOn = group.master ? Boolean(settings[group.master]) : true;
        group.keys.forEach((key) => {
          const boxEl = document.getElementById(`vis-box-${key}`);
          if (!boxEl) return;
          const box = BOX_OF[key];
          const rowItems = box && !["prevstud", "newstud", "othstud"].includes(box)
            ? rowsForBox(box) : [];
          const boxOff = Boolean(settings.boxHidden && settings.boxHidden[key]);
          const anyRowVisible = !rowItems.length
            || rowItems.some((item) => rowVisible(item.row.data));
          // The box checkbox mirrors what is actually rendered.
          boxEl.checked = columnOn && !boxOff && anyRowVisible;
          boxEl.disabled = !columnOn;
          const rowEl = document.getElementById(`vis-row-${key}`);
          if (rowEl) rowEl.classList.toggle("disabled", !columnOn);
          rowItems.forEach((item) => {
            const rb = document.getElementById(`vis-rowbox-${item.row.data}`);
            if (!rb) return;
            rb.checked = rowVisible(item.row.data);
            rb.disabled = !columnOn || boxOff;
            const rl = document.getElementById(`vis-rowline-${item.row.data}`);
            if (rl) rl.classList.toggle("disabled", !columnOn || boxOff);
          });
        });
      });
    }

    function showEditorSection(section) {
      activeEditorSection = section;
      const visibleGroups = EDITOR_GROUPS[section] || [];
      document.querySelectorAll(".editor-panel > [data-editor-section]").forEach((panel) => {
        const panelSection = panel.dataset.editorSection;
        const shouldShow = panelSection === section || (panelSection === "data" && visibleGroups.length > 0);
        panel.hidden = !shouldShow;
      });
      document.querySelectorAll("[data-editor-group]").forEach((group) => {
        group.hidden = !visibleGroups.includes(Number(group.dataset.editorGroup));
      });
      sectionNav?.querySelectorAll("[data-section]").forEach((button) => {
        button.setAttribute("aria-current", button.dataset.section === section ? "step" : "false");
      });
    }

    function renderLabelEditor() {
      labelEditor.innerHTML = rows.map((row, index) => `
        <div class="label-field">
          <label for="label-${index}">${escapeHtml(rowLabel(row, index))}<span class="row-key">${escapeHtml(row.box)} | row ${index + 1}</span></label>
          <input id="label-${index}" type="text" value="${escapeHtml(row.boxtext)}" data-row-index="${index}" data-column="boxtext" autocomplete="off">
        </div>`).join("");
    }

    function renderBulkTable() {
      bulkTableBody.innerHTML = rows.map((row, index) => `
        <tr>
          <td class="cell-key">${escapeHtml(row.box)}</td>
          <td class="cell-key">${escapeHtml(row.data)}</td>
          <td><input type="text" value="${escapeHtml(row.description)}" data-row-index="${index}" data-column="description" autocomplete="off"></td>
          <td><input type="text" value="${escapeHtml(row.boxtext)}" data-row-index="${index}" data-column="boxtext" autocomplete="off"></td>
          <td><input type="text" value="${escapeHtml(row.n)}" data-row-index="${index}" data-column="n" autocomplete="off"></td>
        </tr>`).join("");
    }

    function syncSettingsControls() {
      document.getElementById("diagramTitle").value = settings.title;
      document.getElementById("diagramNote").value = settings.note;
      document.getElementById("showPrevious").checked = settings.showPrevious;
      document.getElementById("showDatabases").checked = settings.showDatabases;
      document.getElementById("showOther").checked = settings.showOther;
      syncVisibilityControls();
    }

    function openFullscreen() {
      const clone = diagram.cloneNode(true);
      clone.removeAttribute("id");
      fullscreenBody.replaceChildren(clone);
      fullscreenOverlay.hidden = false;
      document.body.classList.add("overlay-open");
    }

    function closeFullscreen() {
      fullscreenOverlay.hidden = true;
      fullscreenBody.replaceChildren();
      document.body.classList.remove("overlay-open");
    }

    function renderZoom() {
      const percentage = Math.round(diagramZoom * 100);
      diagram.style.width = `${percentage}%`;
      diagram.style.minWidth = diagramZoom > 1 ? `${Math.round(getLayout().width * diagramZoom)}px` : "0";
      document.getElementById("zoomLevel").textContent = `${percentage}%`;
    }

    function setZoom(nextZoom) {
      diagramZoom = Math.min(2, Math.max(0.75, nextZoom));
      renderZoom();
    }

    const POSITIONS = {
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
      metaAnalysis: { x: 500, y: 1265, w: 350 }
    };

    const SVG_STYLE = `
      .svg-bg { fill: #ffffff; }
      .stage-band { fill: #edf5f9; stroke: #c1d8e4; stroke-width: 1; }
      .stage-label { fill: #246a9a; font-size: 26px; font-weight: 800; letter-spacing: .08em; }
      .svg-title { fill: #17324d; font-size: 34px; font-weight: 800; }
      .svg-note { fill: #64788b; font-size: 16px; }
      .flow-box { fill: #ffffff; stroke: #6e8797; stroke-width: 1.5; }
      .flow-box.excluded-box { fill: #fff8f5; stroke: #c78d7d; }
      .flow-box.included-box { fill: #f3fbf6; stroke: #78a88a; }
      .flow-divider { stroke: #d6e1e7; stroke-width: 1; }
      .node-label { fill: #17324d; font-size: 20px; }
      .node-value { fill: #16476b; font-size: 18px; font-weight: 800; }
      .node-value.long { fill: #31546b; font-size: 15px; font-weight: 600; }
      .title-box { stroke-width: 1.5; }
      .title-box.grey { fill: #e4e8eb; stroke: #87939c; }
      .title-box.yellow { fill: #f7e6a5; stroke: #bd8b16; }
      .title-label { fill: #17324d; font-size: 21px; font-weight: 800; }
      .connector { fill: none; stroke: #7191a4; stroke-width: 2; }
    `;

    function getLayout() {
      const shift = settings.showPrevious ? 0 : -400;
      const width = settings.showPrevious
        ? (settings.showOther ? VIEWBOX_WIDTH : 1350)
        : (settings.showOther ? 1750 : 1000);
      const positions = Object.fromEntries(
        Object.entries(POSITIONS).map(([key, position]) => [key, { ...position, x: position.x + shift }])
      );
      return { width, positions };
    }

    function positionFor(key) {
      const pos = getLayout().positions[key];
      if (!pos) return pos;
      const y = computedY[key] ?? pos.y;
      return { ...pos, y };
    }

    function boxHeightForPosition(key) {
      const position = positionFor(key);
      const box = {
        prevBox: "box1",
        databaseBox: "box2",
        otherBox: "box11",
        duplicates: "box3",
        screened: "box4",
        screenedExcluded: "box5",
        sought: "box6",
        notRetrieved: "box7",
        assessed: "box8",
        databaseExcluded: "box9",
        otherSought: "box12",
        otherNotRetrieved: "box13",
        otherAssessed: "box14",
        otherExcluded: "box15",
        newIncluded: "box10",
        totalIncluded: "box16",
        metaAnalysis: "box17"
      }[key] || key;
      return groupHeight(box, position.w);
    }

    function centerX(position) {
      return position.x + position.w / 2;
    }

    function bottomY(position, height) {
      return position.y + height;
    }

    function renderStage(label, y, height, rowId) {
      const index = rowIndex(rowId);
      const text = rowId === "identification" || rowId === "screening" || rowId === "included"
        ? (rows[index]?.boxtext || label)
        : label;
      return `
        <g aria-label="${escapeHtml(text)}">
          <rect class="stage-band" x="${STAGE_BAND_X}" y="${y}" width="${STAGE_BAND_WIDTH}" height="${height}"></rect>
          <text class="stage-label" x="${STAGE_LABEL_X}" y="${y + height / 2}" text-anchor="middle" transform="rotate(-90 ${STAGE_LABEL_X} ${y + height / 2})">${escapeHtml(text)}</text>
        </g>`;
    }

    function renderTitle(box, position, kind) {
      const item = rowForBox(box);
      if (!item) return "";
      const index = rowIndexForObject(item);
      const lines = wrapText(item.boxtext || item.description || box, Math.max(20, Math.floor((position.w - 32) / 9.2)));
      const lineHeight = 24;
      const startY = position.y + (position.h - lines.length * lineHeight) / 2 + 17;
      return `
        <g class="title-node" data-row-index="${index}" tabindex="0" role="button" aria-label="${escapeHtml(item.boxtext)}">
          <title>${escapeHtml(item.description || item.boxtext)}</title>
          <rect class="title-box ${kind}" x="${position.x}" y="${position.y}" width="${position.w}" height="${position.h}"></rect>
          ${lines.map((line, lineIndex) => `<text class="title-label" x="${centerX(position)}" y="${startY + lineIndex * lineHeight}" text-anchor="middle">${escapeHtml(line)}</text>`).join("")}
        </g>`;
    }

    function rowIndexForObject(target) {
      return rows.findIndex((row) => row === target);
    }

    function boxClass(box) {
      if (box === "box5" || box === "box9" || box === "box15") return "flow-box excluded-box";
      if (box === "box10" || box === "box16" || box === "box17") return "flow-box included-box";
      return "flow-box";
    }

    function renderGroup(box, position) {
      const items = rowsForBox(box).filter((item) => rowVisible(item.row.data));
      if (!items.length) return "";
      const height = groupHeight(box, position.w);
      let cursor = position.y;
      let content = `<g class="flow-group" data-box="${escapeHtml(box)}"><rect class="${boxClass(box)}" x="${position.x}" y="${position.y}" width="${position.w}" height="${height}"></rect>`;

      items.forEach((item, itemIndex) => {
        const metrics = rowMetrics(item.row, position.w);
        const labelX = position.x + 18;
        const labelY = cursor + 30;
        const labelLines = metrics.labelLines;
        const valueY = cursor + 29;
        const nodeClass = metrics.longValue ? "node-value long" : "node-value";
        content += `<g class="flow-node" data-row-index="${item.index}" tabindex="0" role="button" aria-label="${escapeHtml(item.row.description || item.row.boxtext)}">`;
        content += `<title>${escapeHtml(item.row.description || item.row.boxtext)}${item.row.n !== "" ? ` | ${escapeHtml(displayValue(item.row))}` : ""}</title>`;
        labelLines.forEach((line, lineIndex) => {
          content += `<text class="node-label" x="${labelX}" y="${labelY + lineIndex * 22}">${escapeHtml(line)}</text>`;
        });
        if (metrics.value) {
          if (metrics.longValue) {
            const valueStart = cursor + 30 + labelLines.length * 22;
            metrics.valueLines.forEach((line, lineIndex) => {
              content += `<text class="${nodeClass}" x="${labelX}" y="${valueStart + lineIndex * 18}">${escapeHtml(line)}</text>`;
            });
          } else {
            content += `<text class="${nodeClass}" x="${position.x + position.w - 18}" y="${valueY}" text-anchor="end">${escapeHtml(metrics.value)}</text>`;
          }
        }
        content += `</g>`;
        cursor += metrics.height;
        if (itemIndex < items.length - 1) {
          content += `<line class="flow-divider" x1="${position.x + 12}" y1="${cursor}" x2="${position.x + position.w - 12}" y2="${cursor}"></line>`;
        }
      });

      return `${content}</g>`;
    }

    function arrowPath(startX, startY, endX, endY, bendY = null) {
      if (Math.abs(startX - endX) < 1) return `<path class="connector" d="M ${startX} ${startY} V ${endY}" marker-end="url(#arrow)"></path>`;
      const bend = bendY ?? startY + 22;
      return `<path class="connector" d="M ${startX} ${startY} V ${bend} H ${endX} V ${endY}" marker-end="url(#arrow)"></path>`;
    }

    function horizontalToTop(startX, startY, endX, endY) {
      return `<path class="connector" d="M ${startX} ${startY} H ${endX} V ${endY}" marker-end="url(#arrow)"></path>`;
    }

    function horizontalArrow(startX, y, endX) {
      return `<path class="connector" d="M ${startX} ${y} H ${endX}" marker-end="url(#arrow)"></path>`;
    }

    // Bypass arrow for a chain pair whose intermediate boxes are hidden:
    // vertical when the boxes share a column, otherwise an elbow.
    function spineArrow(aKey, bKey) {
      const a = positionFor(aKey), b = positionFor(bKey);
      let startX = centerX(a);
      if (aKey === "newTitle") startX = centerX(positionFor("databaseBox"));
      if (aKey === "otherTitle") startX = centerX(positionFor("otherBox"));
      // Titles carry their own h in POSITIONS; boxes compute h from visible rows.
      const startY = a.h ? a.y + a.h : bottomY(a, boxHeightForPosition(aKey));
      const endX = centerX(b), endY = b.y;
      if (Math.abs(startX - endX) < 1) return arrowPath(startX, startY, endX, endY);
      let bend = (aKey === "prevBox" || aKey === "prevTitle")
        ? (layoutInfo ? layoutInfo.prevBend : 1060) // prev arm elbows below the database arm
        : (aKey === "otherAssessed" || aKey === "otherSought" || aKey === "otherBox")
          ? bottomY(a, boxHeightForPosition(aKey)) + 14
          : startY + 22;
      if (bend >= endY - 6) bend = (startY + endY) / 2;
      return arrowPath(startX, startY, endX, endY, bend);
    }

    function renderConnections() {
      const p = positionFor;
      const h = boxHeightForPosition;

      // The main flow is a set of chains. A chain link is drawn from its
      // source to the NEXT VISIBLE node in the chain, so hiding an
      // intermediate box re-routes the flow instead of breaking it
      // (e.g. assessed -> totalIncluded when newIncluded is hidden).
      const dbChain = ["newTitle", "databaseBox", "screened", "sought",
                       "assessed", "newIncluded", "totalIncluded", "metaAnalysis"];
      const prevChain = ["prevTitle", "prevBox", "totalIncluded", "metaAnalysis"];
      const otherChain = ["otherTitle", "otherBox", "otherSought", "otherAssessed",
                          "newIncluded", "totalIncluded", "metaAnalysis"];

      const chainLinks = [
        { refs: ["newTitle", "databaseBox"], chain: dbChain,
          d: arrowPath(centerX(p("databaseBox")), p("newTitle").y + p("newTitle").h,
                       centerX(p("databaseBox")), p("databaseBox").y) },
        { refs: ["databaseBox", "screened"], chain: dbChain,
          d: arrowPath(centerX(p("databaseBox")), bottomY(p("databaseBox"), h("databaseBox")),
                       centerX(p("screened")), p("screened").y) },
        { refs: ["screened", "sought"], chain: dbChain,
          d: arrowPath(centerX(p("screened")), bottomY(p("screened"), h("screened")),
                       centerX(p("sought")), p("sought").y) },
        { refs: ["sought", "assessed"], chain: dbChain,
          d: arrowPath(centerX(p("sought")), bottomY(p("sought"), h("sought")),
                       centerX(p("assessed")), p("assessed").y) },
        { refs: ["assessed", "newIncluded"], chain: dbChain,
          d: arrowPath(centerX(p("assessed")), bottomY(p("assessed"), h("assessed")),
                       centerX(p("newIncluded")), p("newIncluded").y) },
        { refs: ["newIncluded", "totalIncluded"], chain: dbChain,
          d: arrowPath(centerX(p("newIncluded")), bottomY(p("newIncluded"), h("newIncluded")),
                       centerX(p("totalIncluded")), p("totalIncluded").y) },
        { refs: ["totalIncluded", "metaAnalysis"], chain: dbChain,
          d: arrowPath(centerX(p("totalIncluded")), bottomY(p("totalIncluded"), h("totalIncluded")),
                       centerX(p("metaAnalysis")), p("metaAnalysis").y) },
        { refs: ["prevTitle", "prevBox"], chain: prevChain,
          d: arrowPath(centerX(p("prevTitle")), p("prevTitle").y + p("prevTitle").h,
                       centerX(p("prevBox")), p("prevBox").y) },
        { refs: ["prevBox", "totalIncluded"], chain: prevChain,
          d: arrowPath(centerX(p("prevBox")), bottomY(p("prevBox"), h("prevBox")),
                       centerX(p("totalIncluded")), p("totalIncluded").y, layoutInfo.prevBend) },
        { refs: ["otherTitle", "otherBox"], chain: otherChain,
          d: arrowPath(centerX(p("otherBox")), p("otherTitle").y + p("otherTitle").h,
                       centerX(p("otherBox")), p("otherBox").y) },
        { refs: ["otherBox", "otherSought"], chain: otherChain,
          d: arrowPath(centerX(p("otherBox")), bottomY(p("otherBox"), h("otherBox")),
                       centerX(p("otherSought")), p("otherSought").y) },
        { refs: ["otherSought", "otherAssessed"], chain: otherChain,
          d: arrowPath(centerX(p("otherSought")), bottomY(p("otherSought"), h("otherSought")),
                       centerX(p("otherAssessed")), p("otherAssessed").y) },
        { refs: ["otherAssessed", "newIncluded"], chain: otherChain,
          d: arrowPath(centerX(p("otherAssessed")), bottomY(p("otherAssessed"), h("otherAssessed")),
                       centerX(p("newIncluded")), p("newIncluded").y,
                       bottomY(p("otherAssessed"), h("otherAssessed")) + 14) },
      ];

      // Side arrows (into removal boxes) only stay when both endpoints are
      // visible — hiding a dead-end box removes its arrow.
      const sideArrows = [
        { refs: ["databaseBox", "duplicates"],
          d: horizontalArrow(p("databaseBox").x + p("databaseBox").w,
                             p("databaseBox").y + 100, p("duplicates").x) },
        { refs: ["screened", "screenedExcluded"],
          d: horizontalArrow(p("screened").x + p("screened").w,
                             p("screened").y + h("screened") / 2,
                             p("screenedExcluded").x) },
        { refs: ["sought", "notRetrieved"],
          d: horizontalArrow(p("sought").x + p("sought").w,
                             p("sought").y + h("sought") / 2,
                             p("notRetrieved").x) },
        { refs: ["assessed", "databaseExcluded"],
          d: horizontalArrow(p("assessed").x + p("assessed").w,
                             p("assessed").y + h("assessed") / 2,
                             p("databaseExcluded").x) },
        { refs: ["otherSought", "otherNotRetrieved"],
          d: horizontalArrow(p("otherSought").x + p("otherSought").w,
                             p("otherSought").y + h("otherSought") / 2,
                             p("otherNotRetrieved").x) },
        { refs: ["otherAssessed", "otherExcluded"],
          d: horizontalArrow(p("otherAssessed").x + p("otherAssessed").w,
                             p("otherAssessed").y + h("otherAssessed") / 2,
                             p("otherExcluded").x) },
      ];

      const out = [];
      for (const link of chainLinks) {
        if (!boxVisible(link.refs[0])) continue;
        const idx = link.chain.indexOf(link.refs[1]);
        let next = null;
        for (let i = idx; i < link.chain.length; i += 1) {
          if (boxVisible(link.chain[i])) { next = link.chain[i]; break; }
        }
        if (!next) continue;
        out.push(next === link.refs[1] ? link.d : spineArrow(link.refs[0], next));
      }
      for (const side of sideArrows) {
        if (side.refs.every(boxVisible)) out.push(side.d);
      }
      return out.join("");
    }

    const BAND_KEYS = {
      identification: ["prevTitle", "prevBox", "newTitle", "databaseBox", "duplicates",
                       "otherTitle", "otherBox"],
      screening: ["screened", "screenedExcluded", "sought", "notRetrieved", "assessed",
                  "databaseExcluded", "otherSought", "otherNotRetrieved", "otherAssessed",
                  "otherExcluded"],
      included: ["newIncluded", "totalIncluded", "metaAnalysis"],
    };
    const IDENT_KEYS = ["prevBox", "databaseBox", "duplicates", "otherBox"];
    // Boxes stacked vertically inside a band share rows; hiding a box/row lets
    // the rows below close up instead of leaving a fixed empty gap.
    const SCREEN_ROWS = [
      ["screened", "screenedExcluded"],
      ["sought", "notRetrieved", "otherSought", "otherNotRetrieved"],
      ["assessed", "databaseExcluded", "otherAssessed", "otherExcluded"],
    ];
    const INCL_ROWS = [["newIncluded"], ["totalIncluded"], ["metaAnalysis"]];

    // key -> computed top y (falls back to POSITIONS for titles)
    let computedY = {};
    let layoutInfo = null;

    function rowMaxHeight(keys) {
      let max = 0;
      for (const key of keys) {
        if (!boxVisible(key)) continue;
        const p = POSITIONS[key];
        const h = p.h || groupHeight(BOX_OF[key], p.w); // titles carry their own h
        if (h > 0) max = Math.max(max, h);
      }
      return max;
    }

    // Stage bands, box rows and the canvas all collapse to hug the visible
    // content: hiding boxes/rows closes the vertical gaps instead of leaving
    // empty bands. With the default data the result is identical to the
    // original fixed geometry (y: 145 / 560,680,800 / 955,1110,1265).
    function dynamicLayout() {
      computedY = {};

      // Identification: one fixed row at y 145 (side-by-side boxes).
      const identContent = rowMaxHeight(IDENT_KEYS);
      const identBottom = Math.max(50 + 44, (identContent > 0 ? 145 + identContent : 0) + 34);
      const screenTop = identBottom;

      // Screening: three stacked rows, 52px apart (original spacing).
      let prevBottom = 0;
      let ry = screenTop + 15;
      const screenBottoms = [];
      for (const row of SCREEN_ROWS) {
        if (prevBottom > 0) ry = prevBottom + 52;
        const mh = rowMaxHeight(row);
        for (const key of row) computedY[key] = ry;
        if (mh > 0) { prevBottom = ry + mh; screenBottoms.push(ry + mh); }
      }
      const screenBottom = Math.max(screenTop + 44,
        (screenBottoms.length ? Math.max(...screenBottoms) : 0) + 14);
      const inclTop = screenBottom;

      // Included: three stacked rows, 19px apart (original spacing).
      prevBottom = 0;
      ry = inclTop + 35;
      const inclBottoms = [];
      for (const row of INCL_ROWS) {
        if (prevBottom > 0) ry = prevBottom + 19;
        const mh = rowMaxHeight(row);
        for (const key of row) computedY[key] = ry;
        if (mh > 0) { prevBottom = ry + mh; inclBottoms.push(ry + mh); }
      }
      const inclBottom = Math.max(inclTop + 44,
        (inclBottoms.length ? Math.max(...inclBottoms) : 0) + 10);

      const info = {
        identification: { y: 50, h: identBottom - 50 },
        screening: { y: screenTop, h: screenBottom - screenTop },
        included: { y: inclTop, h: inclBottom - inclTop },
        height: inclBottom + 26, // + room for the optional note
        noteY: inclBottom + 20,
        // the previous-studies arm elbows below the screening band
        prevBend: screenBottom + 60,
      };
      layoutInfo = info;
      return info;
    }

    function renderDiagram() {
      const note = settings.note.trim();
      const layout = getLayout();
      const dl = dynamicLayout();
      const parts = [
        `<title id="diagramTitleSvg">${escapeHtml(settings.title || "PRISMA 2020 Flow Diagram")}</title>`,
        `<desc id="diagramDescSvg">Editable PRISMA 2020 flow diagram preview.</desc>`,
        `<defs><style>${SVG_STYLE}</style><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#7191a4"></path></marker></defs>`,
        `<rect class="svg-bg" x="0" y="0" width="${layout.width}" height="${dl.height}"></rect>`,
        renderStage("Identification", dl.identification.y, dl.identification.h, "identification"),
        renderStage("Screening", dl.screening.y, dl.screening.h, "screening"),
        renderStage("Included", dl.included.y, dl.included.h, "included"),
        `<text class="svg-title" x="${layout.width / 2}" y="31" text-anchor="middle">${escapeHtml(settings.title || "PRISMA 2020 Flow Diagram")}</text>`,
        renderConnections()
      ];

      if (boxVisible("prevTitle")) parts.push(renderTitle("prevstud", positionFor("prevTitle"), "grey"));
      if (boxVisible("prevBox")) parts.push(renderGroup("box1", positionFor("prevBox")));

      if (boxVisible("newTitle")) parts.push(renderTitle("newstud", positionFor("newTitle"), "yellow"));
      if (boxVisible("databaseBox")) parts.push(renderGroup("box2", positionFor("databaseBox")));

      if (boxVisible("otherTitle")) parts.push(renderTitle("othstud", positionFor("otherTitle"), "grey"));
      if (boxVisible("otherBox")) parts.push(renderGroup("box11", positionFor("otherBox")));

      if (boxVisible("duplicates")) parts.push(renderGroup("box3", positionFor("duplicates")));
      if (boxVisible("screened")) parts.push(renderGroup("box4", positionFor("screened")));
      if (boxVisible("screenedExcluded")) parts.push(renderGroup("box5", positionFor("screenedExcluded")));
      if (boxVisible("sought")) parts.push(renderGroup("box6", positionFor("sought")));
      if (boxVisible("notRetrieved")) parts.push(renderGroup("box7", positionFor("notRetrieved")));
      if (boxVisible("assessed")) parts.push(renderGroup("box8", positionFor("assessed")));
      if (boxVisible("databaseExcluded")) parts.push(renderGroup("box9", positionFor("databaseExcluded")));

      if (boxVisible("otherSought")) parts.push(renderGroup("box12", positionFor("otherSought")));
      if (boxVisible("otherNotRetrieved")) parts.push(renderGroup("box13", positionFor("otherNotRetrieved")));
      if (boxVisible("otherAssessed")) parts.push(renderGroup("box14", positionFor("otherAssessed")));
      if (boxVisible("otherExcluded")) parts.push(renderGroup("box15", positionFor("otherExcluded")));

      if (boxVisible("newIncluded")) parts.push(renderGroup("box10", positionFor("newIncluded")));
      if (boxVisible("totalIncluded")) parts.push(renderGroup("box16", positionFor("totalIncluded")));
      if (boxVisible("metaAnalysis")) parts.push(renderGroup("box17", positionFor("metaAnalysis")));

      if (note) {
        parts.push(`<text class="svg-note" x="100" y="${dl.noteY}">${escapeHtml(note)}</text>`);
      }

      diagram.innerHTML = parts.join("");
      diagram.setAttribute("viewBox", `0 0 ${layout.width} ${dl.height}`);
      diagram.setAttribute("aria-label", settings.title || "PRISMA 2020 Flow Diagram");
      renderZoom();
      updateStats();
      renderChecks();
      markUpdated();
      scheduleSave();
    }

    function numeric(value) {
      const text = String(value ?? "").trim();
      return /^\d+$/.test(text) ? Number(text) : null;
    }

    function computeChecks() {
      const value = (id) => numeric(rowById(id) ? rowById(id).n : null);
      const checks = [];
      const add = (ok, message, targetId = null) => checks.push({ ok, message, targetId });
      const db = value("database_results");
      const reg = value("register_results");
      const dup = value("duplicates");
      const auto = value("excluded_automatic");
      const otherRemove = value("excluded_other");
      const screened = value("records_screened");
      const recordsExcluded = value("records_excluded");
      const sought = value("dbr_sought_reports");
      const notRetrieved = value("dbr_notretrieved_reports");
      const assessed = value("dbr_assessed");
      const newStudies = value("new_studies");
      const prevStudies = value("previous_studies");
      const totalStudies = value("total_studies");
      const meta = value("total_studies_ma");
      const website = value("website_results");
      const organisation = value("organisation_results");
      const citations = value("citations_results");
      const otherSought = value("other_sought_reports");
      const otherNotRetrieved = value("other_notretrieved_reports");
      const otherAssessed = value("other_assessed");

      if (db !== null && reg !== null) add(true, `Identified from databases and registers: ${db + reg}.`, "database_results");
      if (db !== null && reg !== null && dup !== null && auto !== null && otherRemove !== null && screened !== null) {
        const expected = db + reg - dup - auto - otherRemove;
        add(expected === screened, `Screened (${screened}) should equal identified (${db + reg}) minus duplicates (${dup}) and other removals (${auto + otherRemove}).`, "records_screened");
      }
      if (screened !== null && recordsExcluded !== null && sought !== null) {
        add(screened - recordsExcluded === sought, `Reports sought (${sought}) should equal screened (${screened}) minus excluded (${recordsExcluded}).`, "dbr_sought_reports");
      }
      if (sought !== null && notRetrieved !== null && assessed !== null) {
        add(sought - notRetrieved === assessed, `Reports assessed (${assessed}) should equal sought (${sought}) minus not retrieved (${notRetrieved}).`, "dbr_assessed");
      }
      if (website !== null && organisation !== null && citations !== null) {
        add(true, `Identified via other methods: ${website + organisation + citations}.`, "website_results");
      }
      if (website !== null && organisation !== null && citations !== null && otherSought !== null) {
        add(website + organisation + citations === otherSought, `Other-method reports sought (${otherSought}) should equal records from websites, organisations, and citations (${website + organisation + citations}).`, "other_sought_reports");
      }
      if (otherSought !== null && otherNotRetrieved !== null && otherAssessed !== null) {
        add(otherSought - otherNotRetrieved === otherAssessed, `Other-method reports assessed (${otherAssessed}) should equal sought (${otherSought}) minus not retrieved (${otherNotRetrieved}).`, "other_assessed");
      }
      if (prevStudies !== null && newStudies !== null && totalStudies !== null) {
        add(prevStudies + newStudies === totalStudies, `Total studies (${totalStudies}) should equal previous (${prevStudies}) plus new (${newStudies}).`, "total_studies");
      }
      if (totalStudies !== null && meta !== null) {
        add(meta <= totalStudies, `Meta-analysis studies (${meta}) should not exceed total studies (${totalStudies}).`, "total_studies_ma");
      }
      return checks;
    }

    function renderChecks() {
      if (!checkList) return;
      const checks = computeChecks();
      if (!checks.length) {
        checkList.innerHTML = `<li class="check-item neutral">Enter counts to see live flow balance checks.</li>`;
        return;
      }
      checkList.innerHTML = checks.map((check) => `
        <li class="check-item ${check.ok ? "ok" : "warn"}">
          <span>${escapeHtml(check.message)}</span>
          ${check.targetId ? `<button class="check-link" type="button" data-focus-id="${escapeHtml(check.targetId)}">Jump to field</button>` : ""}
        </li>`).join("");
    }

    function autoFillDerived() {
      const value = (id) => numeric(rowById(id) ? rowById(id).n : null);
      const changed = [];
      const fill = (id, computed) => {
        if (computed === null) return;
        const row = rowById(id);
        if (!row) return;
        const current = String(row.n ?? "").trim();
        if (current === "" || current === "0") {
          row.n = String(computed);
          changed.push(id);
        }
      };
      const db = value("database_results");
      const reg = value("register_results");
      const dup = value("duplicates");
      const auto = value("excluded_automatic");
      const otherRemove = value("excluded_other");
      if (db !== null && reg !== null && dup !== null && auto !== null && otherRemove !== null) {
        fill("records_screened", db + reg - dup - auto - otherRemove);
      }
      const screened = value("records_screened");
      const recordsExcluded = value("records_excluded");
      if (screened !== null && recordsExcluded !== null) fill("dbr_sought_reports", screened - recordsExcluded);
      const sought = value("dbr_sought_reports");
      const notRetrieved = value("dbr_notretrieved_reports");
      if (sought !== null && notRetrieved !== null) fill("dbr_assessed", sought - notRetrieved);
      const website = value("website_results");
      const organisation = value("organisation_results");
      const citations = value("citations_results");
      if (website !== null && organisation !== null && citations !== null) fill("other_sought_reports", website + organisation + citations);
      const prevStudies = value("previous_studies");
      const newStudies = value("new_studies");
      if (prevStudies !== null && newStudies !== null) fill("total_studies", prevStudies + newStudies);
      renderEditor();
      renderLabelEditor();
      renderBulkTable();
      renderDiagram();
      setStatus(changed.length
        ? `Auto-fill complete. ${changed.length} empty or zero count${changed.length === 1 ? "" : "s"} updated.`
        : "Auto-fill made no changes. Existing counts were preserved.");
    }

    function focusRow(index) {
      const row = rows[index];
      if (!row) return;
      const field = FIELD_GROUPS.flatMap((group) => group.rows).find((item) => item.id === row.data);
      const target = field
        ? document.getElementById(`field-${field.id}`)
        : document.getElementById(`label-${index}`);
      if (!target) return;
      const details = target.closest("details.panel-card");
      if (details) details.open = true;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
      target.classList.remove("field-flash");
      void target.offsetWidth;
      target.classList.add("field-flash");
    }

    function updateStats() {
      const valueCount = rows.filter((row) => row.n !== "" && row.n !== "0").length;
      const visibleArms = [settings.showPrevious ? "previous" : "", settings.showDatabases ? "databases" : "", settings.showOther ? "other methods" : ""].filter(Boolean).join(" + ");
      stats.textContent = `${rows.length + 1} CSV rows loaded | ${valueCount} populated fields | ${visibleArms || "main arm only"}`;
    }

    function selectedRow(index) {
      const row = rows[index];
      if (!row) return;
      selectedInfo.innerHTML = `<strong>${escapeHtml(row.data === "NA" ? row.box : row.data)}</strong> | ${escapeHtml(row.description || row.boxtext)}${row.n !== "" ? ` | <strong>${escapeHtml(displayValue(row))}</strong>` : ""}`;
    }

    function updateDataField(target) {
      const index = Number(target.dataset.rowIndex);
      const column = target.dataset.column;
      if (!Number.isInteger(index) || !rows[index] || !column) return;
      rows[index][column] = target.value;
      const fieldStatus = target.closest(".field")?.querySelector(".field-status");
      if (fieldStatus && column === "n" && target.type === "number") {
        const invalid = target.value.trim() !== "" && numeric(target.value) === null;
        fieldStatus.textContent = invalid ? "Enter a whole number (0 or greater)." : "Number of records or studies";
        fieldStatus.classList.toggle("invalid", invalid);
      }
      renderDiagram();
      setStatus("Changes are ready. Export CSV when you want to save them.");
    }

    function downloadBlob(filename, content, type) {
      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function svgForDownload() {
      const layout = getLayout();
      const dl = dynamicLayout();
      const clone = diagram.cloneNode(true);
      clone.removeAttribute("style");
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      clone.setAttribute("viewBox", `0 0 ${layout.width} ${dl.height}`);
      clone.setAttribute("width", String(layout.width));
      clone.setAttribute("height", String(dl.height));
      clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = SVG_STYLE;
      clone.insertBefore(style, clone.firstChild);
      return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    }

    function downloadPNG() {
      const layout = getLayout();
      const dl = dynamicLayout();
      const svgText = svgForDownload();
      const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const scale = PNG_SCALE;
        const canvas = document.createElement("canvas");
        canvas.width = layout.width * scale;
        canvas.height = dl.height * scale;
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => {
          if (png) {
            downloadBlob(`PRISMA_2020_Flow_Diagram_Readable_${scale}x.png`, png, "image/png");
            setStatus(`High-resolution PNG exported at ${canvas.width} × ${canvas.height} px.`);
          } else {
            setStatus("PNG export failed in this browser. SVG export is still available.", true);
          }
          URL.revokeObjectURL(url);
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        setStatus("PNG export failed in this browser. SVG export is still available.", true);
      };
      image.src = url;
    }

    editorFields.addEventListener("input", (event) => {
      if (event.target.matches("[data-row-index][data-column]")) updateDataField(event.target);
    });

    labelEditor.addEventListener("input", (event) => {
      if (event.target.matches("[data-row-index][data-column]")) updateDataField(event.target);
    });

    bulkTableBody.addEventListener("input", (event) => {
      if (event.target.matches("[data-row-index][data-column]")) updateDataField(event.target);
    });

    diagram.addEventListener("click", (event) => {
      const target = event.target.closest?.("[data-row-index]");
      if (target) {
        const index = Number(target.dataset.rowIndex);
        selectedRow(index);
        focusRow(index);
      }
    });

    diagram.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const target = event.target.closest?.("[data-row-index]");
      if (!target) return;
      event.preventDefault();
      const index = Number(target.dataset.rowIndex);
      if (event.key === "Enter") {
        // Enter inserts a new line (row) below the current one in the same box.
        const row = rows[index];
        if (!row || !row.box || /^(prevstud|newstud|othstud|identification|screening|included)$/.test(row.box)) return;
        const newRow = {
          data: `custom_${Date.now()}`,
          node: "NA",
          box: row.box,
          description: "Added line",
          boxtext: "",
          tooltips: "NA",
          url: "NA",
          n: "",
        };
        rows.splice(index + 1, 0, newRow);
        renderEditor();
        renderBulkTable();
        renderVisibilityPanel();
        renderDiagram();
        focusRow(index + 1);
        setStatus(`Added a new line below "${row.boxtext || row.data}".`);
        return;
      }
      selectedRow(index);
      focusRow(index);
    });

    document.getElementById("diagramTitle").addEventListener("input", (event) => {
      settings.title = event.target.value;
      renderDiagram();
    });

    document.getElementById("diagramNote").addEventListener("input", (event) => {
      settings.note = event.target.value;
      renderDiagram();
    });

    document.getElementById("showPrevious").addEventListener("change", (event) => {
      settings.showPrevious = event.target.checked;
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showPrevious ? "Previous studies arm shown." : "Previous studies arm hidden.");
    });

    document.getElementById("showOther").addEventListener("change", (event) => {
      settings.showOther = event.target.checked;
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showOther ? "Other methods arm shown." : "Other methods arm hidden.");
    });

    document.getElementById("showDatabases").addEventListener("change", (event) => {
      settings.showDatabases = event.target.checked;
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showDatabases
        ? "Databases and registers arm shown."
        : "Databases and registers arm hidden (Included-band totals kept).");
    });

    document.getElementById("visibilityGroups").addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.id.startsWith("vis-master-")) {
        const group = VISIBILITY_GROUPS.find((g) => `vis-master-${g.column}` === target.id);
        if (!group || !group.master) return;
        settings[group.master] = target.checked;
        const settingsToggle = document.getElementById(group.master);
        if (settingsToggle) settingsToggle.checked = target.checked;
        syncVisibilityControls();
        renderDiagram();
        setStatus(target.checked ? `${group.title} column shown.`
                                 : `${group.title} column hidden.`);
        return;
      }
      if (target.dataset.visKey) {
        const key = target.dataset.visKey;
        if (target.checked) {
          delete settings.boxHidden[key];
          // Turning a box on shows all of its rows so the box actually appears.
          const box = BOX_OF[key];
          const items = box && !["prevstud", "newstud", "othstud"].includes(box)
            ? rowsForBox(box) : [];
          items.forEach((item) => { delete settings.rowHidden[item.row.data]; });
        } else {
          settings.boxHidden[key] = true;
        }
        renderDiagram();
        syncVisibilityControls();
        setStatus(target.checked ? `Box "${visibilityLabel(key)}" shown.`
                                 : `Box "${visibilityLabel(key)}" hidden.`);
        return;
      }
      if (target.dataset.visRow) {
        const dataId = target.dataset.visRow;
        const row = rows.find((item) => item.data === dataId);
        const label = row ? (row.boxtext || row.description || dataId) : dataId;
        if (target.checked) delete settings.rowHidden[dataId];
        else settings.rowHidden[dataId] = true;
        renderDiagram();
        syncVisibilityControls();
        setStatus(target.checked ? `Row "${label}" shown.` : `Row "${label}" hidden.`);
      }
    });

    document.getElementById("showAllVisibilityButton").addEventListener("click", () => {
      settings.showPrevious = true;
      settings.showDatabases = true;
      settings.showOther = true;
      settings.boxHidden = {};
      settings.rowHidden = {};
      syncSettingsControls();
      renderDiagram();
      setStatus("All columns and boxes shown.");
    });

    document.getElementById("downloadCsv").addEventListener("click", () => {
      downloadBlob("PRISMA_2020_edited.csv", rowsToCSV(), "text/csv;charset=utf-8");
      setStatus("CSV exported with the original 35 x 8 schema.");
    });

    document.getElementById("downloadSvg").addEventListener("click", () => {
      downloadBlob("PRISMA_2020_Flow_Diagram.svg", svgForDownload(), "image/svg+xml;charset=utf-8");
      setStatus("SVG diagram exported.");
    });

    document.getElementById("downloadPng").addEventListener("click", () => {
      downloadPNG();
      setStatus("Preparing high-resolution PNG export...");
    });

    document.getElementById("printButton").addEventListener("click", () => window.print());

    document.getElementById("fullscreenButton").addEventListener("click", openFullscreen);
    document.getElementById("fullscreenClose").addEventListener("click", closeFullscreen);
    document.getElementById("fullscreenPng").addEventListener("click", () => downloadPNG());
    document.getElementById("fullscreenSvg").addEventListener("click", () => {
      downloadBlob("PRISMA_2020_Flow_Diagram.svg", svgForDownload(), "image/svg+xml;charset=utf-8");
      setStatus("SVG diagram exported.");
    });

    document.getElementById("zoomOut").addEventListener("click", () => setZoom(diagramZoom - 0.25));
    document.getElementById("zoomIn").addEventListener("click", () => setZoom(diagramZoom + 0.25));
    document.getElementById("zoomFit").addEventListener("click", () => setZoom(1));

    sectionNav.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-section]");
      if (button) showEditorSection(button.dataset.section);
    });

    checkList.addEventListener("click", (event) => {
      const target = event.target.closest?.("[data-focus-id]");
      if (!target) return;
      const rowIndexValue = rowIndex(target.dataset.focusId);
      if (rowIndexValue >= 0) focusRow(rowIndexValue);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !fullscreenOverlay.hidden) closeFullscreen();
    });

    document.getElementById("autoFillButton").addEventListener("click", autoFillDerived);

    document.getElementById("csvInput").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const importedRows = rowsFromCSV(await file.text());
        rows = importedRows;
        renderEditor();
        renderLabelEditor();
        renderBulkTable();
        renderVisibilityPanel();
        renderDiagram();
        setStatus(`${file.name} imported successfully. The 35 x 8 schema is valid.`);
      } catch (error) {
        setStatus(error.message || "The CSV could not be imported.", true);
      } finally {
        event.target.value = "";
      }
    });

    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Reset current project’s data to the clean template values?\n\nThis keeps the project name/metadata but clears numbers and visibility for this project.")) return;
      const cur = getCurrentProject();
      if (cur) {
        cur.rows = cloneRows(DEFAULT_ROWS);
        cur.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        rows = cloneRows(cur.rows);
        settings = JSON.parse(JSON.stringify(cur.settings));
        persistCurrentProject();
      } else {
        rows = cloneRows(DEFAULT_ROWS);
        settings = { ...DEFAULT_SETTINGS };
      }
      renderEditor();
      renderLabelEditor();
      renderBulkTable();
      renderVisibilityPanel();
      syncSettingsControls();
      renderDiagram();
      updateProjectUI();
      setStatus("Project reset to clean template values.");
    });

    renderEditor();
    renderLabelEditor();
    renderBulkTable();
    renderVisibilityPanel();
    syncSettingsControls();
    renderDiagram();
    renderZoom();
    updateCheckpointUI();
    updateProjectUI();
    setStatus(`Project “${getCurrentProject()?.name||"—"}” ready. ${getProjects().length} project${getProjects().length===1?"":"s"} in this browser.`);
    setTimeout(()=>{ updateCheckpointUI(); updateProjectUI(); }, 0);

    // ---- Checkpoints dialog ------------------------------------------------
    const cpDialog = document.createElement("dialog");
    cpDialog.id = "checkpointDialog";
    cpDialog.style.border = "1px solid #999";
    cpDialog.style.borderRadius = "6px";
    cpDialog.style.padding = "0";
    cpDialog.style.maxWidth = "560px";
    cpDialog.style.width = "calc(100% - 24px)";
    cpDialog.innerHTML =
      '<div style="padding:14px 14px 0"><h3 style="margin:0 0 6px;font-size:15px">Checkpoints</h3><p class="helper" style="margin:0 0 10px">Snapshots are kept in this browser only (up to 20). Restore will replace current edits — save first if you want to keep them.</p><div id="checkpointList" style="max-height:46vh;overflow:auto;border:1px solid #e6edf1;margin-bottom:10px"></div></div>' +
      '<div style="display:flex;justify-content:space-between;gap:8px;padding:0 14px 14px"><button id="cpClose" type="button" class="secondary small">Close</button><button id="cpSaveNew" type="button" class="secondary small">Save new checkpoint</button></div>';
    document.body.appendChild(cpDialog);
    function renderCheckpointDialog() {
      const host = document.getElementById("checkpointList");
      if (!host) return;
      const list = loadCheckpoints();
      if (!list.length) {
        host.innerHTML = '<p class="helper" style="padding:10px">No checkpoints yet. Use “Save checkpoint” to freeze the current numbers and visibility.</p>';
        return;
      }
      // newest first
      const rev = [...list].reverse();
      host.innerHTML = rev.map(cp => {
        const d = new Date(cp.ts);
        const when = d.toLocaleString();
        const rowsPopulated = (cp.rows||[]).filter(r=>r.n!==""&&r.n!=="0").length;
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid #f0f4f6"><div style="min-width:0"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(cp.name)}</div><div class="helper" style="margin:0;font-size:11px">${escapeHtml(when)} · ${rowsPopulated} fields</div></div><div style="display:flex;gap:6px;flex-shrink:0"><button type="button" class="secondary small" data-cp-restore="${escapeHtml(cp.id)}">Restore</button><button type="button" class="secondary small" data-cp-delete="${escapeHtml(cp.id)}">Delete</button></div></div>`;
      }).join("");
    }
    function openCheckpointDialog() { renderCheckpointDialog(); cpDialog.showModal(); }
    cpDialog.addEventListener("click", (e) => {
      const r = e.target.closest?.("[data-cp-restore]");
      if (r) {
        const id = r.getAttribute("data-cp-restore");
        if (window.confirm("Restore this checkpoint? Current edits will be replaced (save first if needed).")) {
          restoreCheckpoint(id);
          cpDialog.close();
        }
        return;
      }
      const d = e.target.closest?.("[data-cp-delete]");
      if (d) {
        const id = d.getAttribute("data-cp-delete");
        if (window.confirm("Delete this checkpoint?")) deleteCheckpoint(id);
        return;
      }
    });
    document.getElementById("cpClose")?.addEventListener("click", () => cpDialog.close());
    document.getElementById("cpSaveNew")?.addEventListener("click", () => { createCheckpoint(); renderCheckpointDialog(); });
    // alias for the small helper above
    // (restoreCheckpoint/deleteCheckpoint already call renderCheckpointDialog/updateCheckpointUI)

    // wire save / clear / manage buttons (toolbar + settings panel duplicates)
    ["saveCheckpointButton","saveCheckpointButton2"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.addEventListener("click", ()=>createCheckpoint());
    });
    ["manageCheckpointsButton","manageCheckpointsButton2"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.addEventListener("click", openCheckpointDialog);
    });
    ["clearStorageButton","clearStorageButton2"].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.addEventListener("click", clearAllMemory);
    });
    cpDialog.addEventListener("close", updateCheckpointUI);
    // ---- project wiring --------------------------------------------------
    function bindProjectUI() {
      const sel = document.getElementById("projectSelect");
      if (sel) sel.addEventListener("change", (e)=> switchProject(e.target.value));
      ["newProjectButton","newProjectButton2","newProjectButton3"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("click", createProjectFlow);
      });
      ["renameProjectButton","renameProjectButton2"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("click", renameCurrentProject);
      });
      ["duplicateProjectButton","duplicateProjectButton2"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("click", duplicateCurrentProject);
      });
      ["deleteProjectButton","deleteProjectButton2"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("click", deleteCurrentProject);
      });
      ["exportBundleButton","exportBundleButton2"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("click", exportCurrentProjectBundle);
      });
      ["importBundleInput","importBundleInput2"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("change", (e)=>{
          const f=e.target.files?.[0];
          if(f) importProjectBundleFile(f);
          e.target.value="";
        });
      });
      const clearAllBtn = document.getElementById("clearAllProjectsButton");
      if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllProjectsMemory);
      // meta inputs
      ["projectNameInput","projectReviewTitle","projectProspero","projectReviewId","projectNotes"].forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.addEventListener("change", updateProjectMetaFromUI);
        if(el) el.addEventListener("input", ()=>{ /* live preview without toast */ });
      });
      // meta live update on blur/input debounced
      let metaTimer=null;
      ["projectReviewTitle","projectProspero","projectNotes","projectNameInput","projectReviewId"].forEach(id=>{
        const el=document.getElementById(id);
        if(!el) return;
        el.addEventListener("input", ()=>{
          clearTimeout(metaTimer);
          metaTimer=setTimeout(()=>{ updateProjectMetaFromUI(); renderProjectsDashboard(); }, 600);
        });
      });
      // dashboard card delegation
      const grid = document.getElementById("projectsDashboardGrid");
      if (grid) grid.addEventListener("click", (e)=>{
        const open = e.target.closest?.("[data-proj-open]");
        if (open) { switchProject(open.getAttribute("data-proj-open")); showEditorSection("settings"); return; }
        const exp = e.target.closest?.("[data-proj-export]");
        if (exp) {
          const pid = exp.getAttribute("data-proj-export");
          const prev = getCurrentProjectId();
          if (pid !== prev) switchProject(pid);
          exportCurrentProjectBundle();
          return;
        }
        const dup = e.target.closest?.("[data-proj-dup]");
        if (dup) {
          const pid = dup.getAttribute("data-proj-dup");
          const p = getProjects().find(x=>x.id===pid);
          if (p) {
            const cur = getCurrentProjectId();
            if (pid !== cur) switchProject(pid);
            duplicateCurrentProject();
          }
          return;
        }
        const del = e.target.closest?.("[data-proj-del]");
        if (del) {
          const pid = del.getAttribute("data-proj-del");
          if (pid === getCurrentProjectId()) deleteCurrentProject();
          else {
            if (!window.confirm(`Delete project “${getProjects().find(x=>x.id===pid)?.name}”?`)) return;
            _projectsData.projects = _projectsData.projects.filter(x=>x.id!==pid);
            saveProjectsRaw(_projectsData);
            updateProjectUI();
          }
          return;
        }
      });
    }
    bindProjectUI();
    // ---- separate Project Manager window (dialog) --------------------
    window._pmSelectedId = getCurrentProjectId();
    function renderPmProjectList(){
      const host = document.getElementById("pmProjectList");
      if (!host) return;
      const projs = getProjects();
      const curId = getCurrentProjectId();
      const selId = window._pmSelectedId || curId;
      host.innerHTML = projs.map(p=>{
        const isCur = p.id===curId;
        const isSel = p.id===selId;
        const pop = (p.rows||[]).filter(r=>r.n!==""&&r.n!=="0").length;
        const cps = (p.checkpoints||[]).length;
        const when = new Date(p.updatedAt).toLocaleDateString();
        return `<button type="button" data-pm-select="${escapeHtml(p.id)}" style="text-align:left;padding:8px 10px;border:1px solid ${isSel?"#246a9a":"#e6edf1"};background:${isSel?"#edf3f6":(isCur?"#f6fafc":"#fff")};display:flex;justify-content:space-between;gap:8px;width:100%">
          <span style="min-width:0"><span style="font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${escapeHtml(p.name)} ${isCur?'<span style="background:#246a9a;color:#fff;font-size:9px;padding:1px 5px;border-radius:10px;vertical-align:middle">current</span>':""}</span><span class="helper" style="font-size:11px">${escapeHtml(p.meta.prosperoId||"no PROSPERO")} · ${pop} fields · ${cps} cps</span><br><span class="helper" style="font-size:10px">${escapeHtml(when)}</span></span>
          <span class="helper" style="align-self:center">${isSel?"▸":""}</span>
        </button>`;
      }).join("");
      const cnt = document.getElementById("pmProjectCount");
      if (cnt) cnt.textContent = `${projs.length} project${projs.length===1?"":"s"} in this browser`;
    }
    function renderPmDetail(pid){
      window._pmSelectedId = pid;
      const p = getProjects().find(x=>x.id===pid);
      const empty = document.getElementById("pmDetailEmpty");
      const detail = document.getElementById("pmDetail");
      if (!p) { if(empty) empty.hidden=false; if(detail) detail.hidden=true; return; }
      if(empty) empty.hidden=true; if(detail) detail.hidden=false;
      const nameEl = document.getElementById("pmDetailName");
      if(nameEl) nameEl.textContent = p.name;
      const badge = document.getElementById("pmDetailBadge");
      if(badge) badge.textContent = p.id===getCurrentProjectId() ? "current" : "";
      const meta = document.getElementById("pmDetailMeta");
      if(meta) meta.textContent = `${p.meta.reviewTitle||""}${p.meta.prosperoId?` · PROSPERO ${p.meta.prosperoId}`:""} · Updated ${new Date(p.updatedAt).toLocaleString()}`;
      const n1=document.getElementById("pmProjectNameInput"); if(n1) n1.value=p.name;
      const t1=document.getElementById("pmReviewTitle"); if(t1) t1.value=p.meta.reviewTitle||"";
      const pr=document.getElementById("pmProspero"); if(pr) pr.value=p.meta.prosperoId||"";
      const ri=document.getElementById("pmReviewId"); if(ri) ri.value=p.meta.reviewId||"";
      const no=document.getElementById("pmNotes"); if(no) no.value=p.meta.notes||"";
      const cc=document.getElementById("pmCheckpointCount");
      if(cc) cc.textContent = `— ${p.checkpoints.length} checkpoint${p.checkpoints.length===1?"":"s"}`;
      const cl=document.getElementById("pmCheckpointList");
      if(cl){
        if(!p.checkpoints.length) cl.innerHTML='<p class="helper" style="padding:8px">No checkpoints yet.</p>';
        else {
          const rev=[...p.checkpoints].reverse();
          cl.innerHTML=rev.map(cp=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border-bottom:1px solid #f0f4f6"><span><span style="font-weight:700;font-size:12px">${escapeHtml(cp.name)}</span><br><span class="helper" style="font-size:11px">${escapeHtml(new Date(cp.ts).toLocaleString())}</span></span><span style="display:flex;gap:6px"><button class="secondary small" data-pm-cp-restore="${escapeHtml(cp.id)}">Restore</button><button class="secondary small" data-pm-cp-del="${escapeHtml(cp.id)}">Delete</button></span></div>`).join("");
        }
      }
      renderPmProjectList();
    }
    function openProjectManager(){
      renderPmProjectList();
      renderPmDetail(window._pmSelectedId || getCurrentProjectId());
      const dlg=document.getElementById("projectManagerDialog");
      if(dlg && typeof dlg.showModal==="function") dlg.showModal();
      else if(dlg) dlg.setAttribute("open","");
    }
    function closeProjectManager(){ const dlg=document.getElementById("projectManagerDialog"); if(dlg) dlg.close?.() || dlg.removeAttribute("open"); }
    // wire PM dialog
    const openBtn=document.getElementById("openProjectsButton");
    if(openBtn) openBtn.addEventListener("click", openProjectManager);
    const pmClose=document.getElementById("pmClose");
    if(pmClose) pmClose.addEventListener("click", closeProjectManager);
    const pmNew=document.getElementById("pmNew");
    if(pmNew) pmNew.addEventListener("click", ()=>{ createProjectFlow(); renderPmProjectList(); renderPmDetail(getCurrentProjectId()); });
    const pmImport=document.getElementById("pmImport");
    if(pmImport) pmImport.addEventListener("change", (e)=>{ const f=e.target.files?.[0]; if(f) importProjectBundleFile(f); e.target.value=""; setTimeout(()=>{ renderPmProjectList(); renderPmDetail(getCurrentProjectId()); }, 300); });
    const pmClearAll=document.getElementById("pmClearAll");
    if(pmClearAll) pmClearAll.addEventListener("click", ()=>{ clearAllProjectsMemory(); renderPmProjectList(); });
    const pmOpen=document.getElementById("pmOpen");
    if(pmOpen) pmOpen.addEventListener("click", ()=>{ const pid=window._pmSelectedId; if(pid) { switchProject(pid); closeProjectManager(); } });
    const pmRename=document.getElementById("pmRename");
    if(pmRename) pmRename.addEventListener("click", ()=>{ const pid=window._pmSelectedId; if(!pid) return; const p=getProjects().find(x=>x.id===pid); if(!p) return; const wasCurrent=pid===getCurrentProjectId(); if(wasCurrent) renameCurrentProject(); else { const n=prompt("Rename project:", p.name); if(n===null) return; const t=n.trim(); if(!t) return; p.name=t; p.meta.reviewTitle=t; saveProjectsRaw(_projectsData); renderPmProjectList(); renderPmDetail(pid); updateProjectUI(); } });
    const pmDup=document.getElementById("pmDuplicate");
    if(pmDup) pmDup.addEventListener("click", ()=>{ const pid=window._pmSelectedId; if(!pid) return; const cur= getCurrentProjectId(); if(pid!==cur) switchProject(pid); duplicateCurrentProject(); renderPmProjectList(); renderPmDetail(getCurrentProjectId()); });
    const pmExp=document.getElementById("pmExport");
    if(pmExp) pmExp.addEventListener("click", ()=>{ const pid=window._pmSelectedId; if(!pid) return; const cur=getCurrentProjectId(); if(pid!==cur) switchProject(pid); exportCurrentProjectBundle(); });
    const pmDel=document.getElementById("pmDelete");
    if(pmDel) pmDel.addEventListener("click", ()=>{ const pid=window._pmSelectedId; if(!pid) return; if(pid===getCurrentProjectId()) { deleteCurrentProject(); renderPmProjectList(); const nid=getCurrentProjectId(); renderPmDetail(nid); } else { if(!confirm(`Delete project “${getProjects().find(x=>x.id===pid)?.name}”?`)) return; _projectsData.projects=_projectsData.projects.filter(x=>x.id!==pid); saveProjectsRaw(_projectsData); updateProjectUI(); renderPmProjectList(); renderPmDetail(getCurrentProjectId()); } });
    const pmList=document.getElementById("pmProjectList");
    if(pmList) pmList.addEventListener("click", (e)=>{ const b=e.target.closest?.("[data-pm-select]"); if(b) { renderPmDetail(b.getAttribute("data-pm-select")); } });
    // pm detail meta live save
    ["pmProjectNameInput","pmReviewTitle","pmProspero","pmReviewId","pmNotes"].forEach(id=>{
      const el=document.getElementById(id);
      if(!el) return;
      el.addEventListener("change", ()=>{
        const pid=window._pmSelectedId; if(!pid) return;
        const p=getProjects().find(x=>x.id===pid); if(!p) return;
        const isCurrent=pid===getCurrentProjectId();
        // if editing current, updateProjectMetaFromUI will handle rows/settings sync; for non-current, just update that project
        if(isCurrent){
          // map pm* ids to main ids
          const map={pmProjectNameInput:"projectNameInput", pmReviewTitle:"projectReviewTitle", pmProspero:"projectProspero", pmReviewId:"projectReviewId", pmNotes:"projectNotes"};
          const main=document.getElementById(map[id]);
          if(main) { main.value=el.value; updateProjectMetaFromUI(); }
        } else {
          if(id==="pmProjectNameInput") p.name=el.value.trim()||p.name;
          if(id==="pmReviewTitle") p.meta.reviewTitle=el.value;
          if(id==="pmProspero") p.meta.prosperoId=el.value;
          if(id==="pmReviewId") p.meta.reviewId=el.value;
          if(id==="pmNotes") p.meta.notes=el.value;
          p.updatedAt=new Date().toISOString();
          saveProjectsRaw(_projectsData);
          renderPmProjectList();
        }
      });
    });
    const pmSaveCp=document.getElementById("pmSaveCheckpoint");
    if(pmSaveCp) pmSaveCp.addEventListener("click", ()=>{ const pid=window._pmSelectedId; const cur=getCurrentProjectId(); if(pid && pid!==cur) switchProject(pid); createCheckpoint(); renderPmDetail(getCurrentProjectId()); });
    const pmManageCp=document.getElementById("pmManageCheckpoints");
    if(pmManageCp) pmManageCp.addEventListener("click", ()=>{ closeProjectManager(); if(typeof openCheckpointDialog==="function") openCheckpointDialog(); });
    const pmClist=document.getElementById("pmCheckpointList");
    if(pmClist) pmClist.addEventListener("click", (e)=>{
      const r=e.target.closest?.("[data-pm-cp-restore]");
      if(r){ const id=r.getAttribute("data-pm-cp-restore"); const pid=window._pmSelectedId; const cur=getCurrentProjectId(); if(pid && pid!==cur) switchProject(pid); restoreCheckpoint(id); renderPmDetail(getCurrentProjectId()); return; }
      const d=e.target.closest?.("[data-pm-cp-del]");
      if(d){ const id=d.getAttribute("data-pm-cp-del"); deleteCheckpoint(id); renderPmDetail(getCurrentProjectId()); }
    });
    // keep nav count + dashboard in sync
    const origUpdateProjectUI = updateProjectUI;
    updateProjectUI = function() {
      origUpdateProjectUI();
      const projs = getProjects();
      const nav = document.getElementById("navProjectsCount");
      if (nav) nav.textContent = String(projs.length);
      const c2 = document.getElementById("projectCount2");
      if (c2) c2.textContent = `${projs.length} project${projs.length===1?"":"s"}`;
      // also update toolbar button label
      const tLabel=document.getElementById("toolbarProjectLabel");
      if(tLabel){
        const cur=getCurrentProject();
        tLabel.textContent = cur ? cur.name : "Projects";
      }
      const tCount=document.getElementById("toolbarProjectCount");
      if(tCount) tCount.textContent = `${projs.length}`;
      if (typeof renderPmProjectList==="function") renderPmProjectList();
    };
    updateProjectUI();
    // extend EDITOR_GROUPS to include projects
    if (!EDITOR_GROUPS.projects) EDITOR_GROUPS.projects = [];
    // intercept showEditorSection to also handle projects dashboard rendering
    const _origShowEditorSection = showEditorSection;
    showEditorSection = function(section) {
      _origShowEditorSection(section);
      if (section === "projects") renderProjectsDashboard();
    };

  // ---- TSV paste (added by the PRISMA pipeline tooling) -------------------
  const tsvDialog = document.createElement("dialog");
  tsvDialog.id = "tsvDialog";
  tsvDialog.style.border = "1px solid #999";
  tsvDialog.style.borderRadius = "6px";
  tsvDialog.style.padding = "14px";
  tsvDialog.innerHTML =
    '<p style="margin:0 0 8px;font-size:13px"><strong>Paste TSV</strong> — copy rows from Excel and paste below.<br>' +
    'Accepts <em>5 columns</em> (Box, Key, Description, Label, Count), <em>3 columns</em> (Description, Label, Count) ' +
    'or <em>1 column</em> (Count). Rows apply top-down, replacing the same rows in the bulk table.</p>' +
    '<textarea id="tsvPasteText" rows="8" cols="72" style="width:100%;font-family:Consolas,monospace;font-size:12px" ' +
    'placeholder="Description&#9;Label&#9;Count&#10;Records identified from: Databases&#9;Databases&#9;1240&#10;..."></textarea>' +
    '<div style="margin-top:8px;text-align:right">' +
    '<button id="tsvApply" type="button" class="primary small">Apply</button> ' +
    '<button id="tsvCancel" type="button" class="secondary small">Cancel</button></div>';
  document.body.appendChild(tsvDialog);

  document.getElementById("pasteTsvButton").addEventListener("click", () => {
    document.getElementById("tsvPasteText").value = "";
    tsvDialog.showModal();
  });
  document.getElementById("tsvCancel").addEventListener("click", () => tsvDialog.close());

  document.getElementById("tsvApply").addEventListener("click", () => {
    const text = document.getElementById("tsvPasteText").value;
    const lines = text.replace(/\r/g, "").split("\n")
      .map(l => l.trimEnd()).filter(l => l.trim() !== "");
    if (!lines.length) { setStatus("Paste TSV: nothing to paste.", true); return; }
    const grid = lines.map(l => l.split("\t"));
    const nCols = grid[0].length;
    if (![1, 3, 5].includes(nCols)) {
      setStatus("Paste TSV: expected 1, 3 or 5 tab-separated columns, got " + nCols + ".", true);
      return;
    }
    if (grid.length > rows.length) {
      setStatus("Paste TSV: " + grid.length + " rows pasted but the table has only "
        + rows.length + " rows.", true);
      return;
    }
    for (let i = 0; i < grid.length; i++) {
      const r = rows[i];
      if (nCols === 5) { r.box = grid[i][0].trim(); r.data = grid[i][1].trim(); }
      if (nCols >= 3) { r.description = grid[i][nCols - 3]; r.boxtext = grid[i][nCols - 2]; }
      r.n = grid[i][nCols - 1];
    }
    renderEditor();
    renderBulkTable();
    renderVisibilityPanel();
    renderDiagram();
    setStatus("Paste TSV: applied " + grid.length + " row(s) (" + nCols + " columns).");
    tsvDialog.close();
  });