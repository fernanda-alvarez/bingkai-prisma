// src/js/modules/04-ui.js — split from app.js — do not edit header order
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
        beginHistory();
        rows.splice(index + 1, 0, newRow);
        queueHistoryCommit();
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
      beginHistory();
      settings.title = event.target.value;
      queueHistoryCommit();
      renderDiagram();
    });

    document.getElementById("diagramNote").addEventListener("input", (event) => {
      beginHistory();
      settings.note = event.target.value;
      queueHistoryCommit();
      renderDiagram();
    });

    document.getElementById("showPrevious").addEventListener("change", (event) => {
      beginHistory();
      settings.showPrevious = event.target.checked;
      queueHistoryCommit();
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showPrevious ? "Previous studies arm shown." : "Previous studies arm hidden.");
    });

    document.getElementById("showOther").addEventListener("change", (event) => {
      beginHistory();
      settings.showOther = event.target.checked;
      queueHistoryCommit();
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showOther ? "Other methods arm shown." : "Other methods arm hidden.");
    });

    document.getElementById("showDatabases").addEventListener("change", (event) => {
      beginHistory();
      settings.showDatabases = event.target.checked;
      queueHistoryCommit();
      renderDiagram();
      syncVisibilityControls();
      setStatus(settings.showDatabases
        ? "Databases and registers arm shown."
        : "Databases and registers arm hidden (Included-band totals kept).");
    });

    document.getElementById("visibilityGroups").addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      beginHistory();
      queueHistoryCommit();
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
      beginHistory();
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
      if (!privacyGuard("CSV export")) return;
      downloadBlob("PRISMA_2020_edited.csv", rowsToCSV(), "text/csv;charset=utf-8");
      setStatus("CSV exported with the original 35 x 8 schema.");
    });

    document.getElementById("downloadSvg").addEventListener("click", () => {
      if (!privacyGuard("SVG export")) return;
      downloadBlob("PRISMA_2020_Flow_Diagram.svg", svgForDownload(), "image/svg+xml;charset=utf-8");
      setStatus("SVG diagram exported.");
    });

    document.getElementById("downloadPng").addEventListener("click", () => {
      if (!privacyGuard("PNG export")) return;
      downloadPNG();
      setStatus("Preparing high-resolution PNG export...");
    });

    document.getElementById("printButton").addEventListener("click", () => {
      if (privacyGuard("print")) window.print();
    });
    const utilityMenu = document.querySelector(".utility-menu");
    const utilityMenuToggle = document.getElementById("utilityMenuToggle");
    if (utilityMenu && utilityMenuToggle) {
      utilityMenuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const open = utilityMenu.classList.toggle("is-open");
        utilityMenuToggle.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", () => {
        utilityMenu.classList.remove("is-open");
        utilityMenuToggle.setAttribute("aria-expanded", "false");
      });
    }
    document.getElementById("exportBundleQuick")?.addEventListener("click", () => exportCurrentProjectBundle());
    document.getElementById("privacyCheckButton")?.addEventListener("click", () => {
      const findings = privacyFindings();
      setStatus(findings.length ? "Privacy check found: " + findings.join(", ") + "." : "Privacy check passed. No obvious sensitive patterns found.", findings.length > 0);
    });

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
    document.getElementById("undoButton")?.addEventListener("click", undoEdit);
    document.getElementById("redoButton")?.addEventListener("click", redoEdit);

    document.getElementById("startReviewButton")?.addEventListener("click", () => showEditorSection("identification"));
    document.getElementById("startImportButton")?.addEventListener("click", () => document.getElementById("csvInput")?.click());
    document.getElementById("tryExampleButton")?.addEventListener("click", loadExampleData);
    document.getElementById("mobilePreviewButton")?.addEventListener("click", openFullscreen);
    document.getElementById("mobileExportButton")?.addEventListener("click", () => document.getElementById("exportSplitMain")?.click());

    checkList.addEventListener("click", (event) => {
      const target = event.target.closest?.("[data-focus-id]");
      if (!target) return;
      const rowIndexValue = rowIndex(target.dataset.focusId);
      if (rowIndexValue >= 0) focusRow(rowIndexValue);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !fullscreenOverlay.hidden) closeFullscreen();
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        event.shiftKey ? redoEdit() : undoEdit();
      } else if (key === "y") {
        event.preventDefault();
        redoEdit();
      }
    });

    document.getElementById("autoFillButton").addEventListener("click", autoFillDerived);

    let pendingCsvImport = null;
    const importPreviewDialog = document.getElementById("importPreviewDialog");
    const importPreviewSummary = document.getElementById("importPreviewSummary");

    function showImportPreview(file, importedRows) {
      pendingCsvImport = { fileName: file.name, rows: importedRows };
      const populated = importedRows.filter((row) => String(row.n ?? "").trim() !== "" && String(row.n ?? "").trim() !== "0").length;
      const numeric = importedRows.filter((row) => /^\d+$/.test(String(row.n ?? "").trim())).length;
      if (importPreviewSummary) {
        importPreviewSummary.innerHTML = "<strong>" + escapeHtml(file.name) + "</strong><br>" + importedRows.length + " schema rows detected · " + populated + " populated values · " + numeric + " numeric values<br>Current project data will be replaced only after confirmation.";
      }
      if (importPreviewDialog?.showModal) importPreviewDialog.showModal();
      else if (importPreviewDialog) importPreviewDialog.setAttribute("open", "");
    }

    function applyPendingCsvImport() {
      if (!pendingCsvImport) return;
      beginHistory();
      rows = pendingCsvImport.rows;
      queueHistoryCommit();
      renderEditor();
      renderLabelEditor();
      renderBulkTable();
      renderVisibilityPanel();
      renderDiagram();
      setStatus(pendingCsvImport.fileName + " imported successfully. The 35 x 8 schema is valid.");
      pendingCsvImport = null;
      if (importPreviewDialog?.close) importPreviewDialog.close();
      else importPreviewDialog?.removeAttribute("open");
    }

    document.getElementById("importPreviewConfirm")?.addEventListener("click", applyPendingCsvImport);
    const cancelCsvImport = () => {
      pendingCsvImport = null;
      importPreviewDialog?.close?.();
      importPreviewDialog?.removeAttribute("open");
      setStatus("CSV import cancelled.");
    };
    document.getElementById("importPreviewCancel")?.addEventListener("click", cancelCsvImport);
    document.getElementById("importPreviewCancel2")?.addEventListener("click", cancelCsvImport);

    document.getElementById("csvInput").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const importedRows = rowsFromCSV(await file.text());
        showImportPreview(file, importedRows);
      } catch (error) {
        setStatus(error.message || "The CSV could not be imported.", true);
      } finally {
        event.target.value = "";
      }
    });

    const resetButton = document.getElementById("resetButton");
    resetButton.addEventListener("click", () => {
      if (!window.confirm("Reset current project’s data to the clean template values?\n\nThis keeps the project name/metadata but clears numbers and visibility for this project.")) return;
      beginHistory();
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
    resetHistoryBaseline();
    updateHistoryUI();
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
          beginHistory();
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
