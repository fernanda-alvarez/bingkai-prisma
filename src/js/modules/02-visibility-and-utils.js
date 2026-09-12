// src/js/modules/02-visibility-and-utils.js — split from app.js — do not edit header order
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
