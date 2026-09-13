// src/js/modules/03-render.js — split from app.js — do not edit header order
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

    function eligibilityBendY() {
      // Route the other-method arm below every box in the eligibility row.
      // This prevents the elbow from overlapping the database/register arm.
      const keys = ["assessed", "databaseExcluded", "otherAssessed", "otherExcluded"];
      const bottoms = keys.filter(boxVisible).map((key) => {
        const position = positionFor(key);
        return bottomY(position, boxHeightForPosition(key));
      });
      return bottoms.length ? Math.max(...bottoms) + 22 : null;
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
          ? (eligibilityBendY() ?? bottomY(a, boxHeightForPosition(aKey)) + 14)
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
                       eligibilityBendY()) },
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
      if (changed.length) {
        beginHistory();
        queueHistoryCommit();
      }
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

    const STEP_PROGRESS_FIELDS = Object.freeze({
      identification: ["previous_studies", "previous_reports", "database_results", "database_specific_results", "register_results", "register_specific_results", "website_results", "organisation_results", "citations_results"],
      screening: ["duplicates", "excluded_automatic", "excluded_other", "records_screened", "records_excluded"],
      eligibility: ["dbr_sought_reports", "dbr_notretrieved_reports", "dbr_assessed", "dbr_excluded", "other_sought_reports", "other_notretrieved_reports", "other_assessed", "other_excluded"],
      included: ["new_studies", "new_reports", "total_studies", "total_reports", "total_studies_ma", "total_reports_ma"]
    });

    function updateStepProgress() {
      for (const [section, fieldIds] of Object.entries(STEP_PROGRESS_FIELDS)) {
        const badge = sectionNav?.querySelector("[data-step-progress=\"" + section + "\"]");
        const button = badge?.closest("[data-section]");
        if (!badge || !button) continue;
        const complete = fieldIds.filter((id) => {
          const value = String(rowById(id)?.n ?? "").trim();
          return value !== "" && value !== "0" && value !== "NA" && !/xxx/i.test(value);
        }).length;
        badge.textContent = complete + "/" + fieldIds.length;
        badge.title = complete + " of " + fieldIds.length + " fields populated";
        button.classList.toggle("step-complete", complete === fieldIds.length);
      }
    }

    function updateStats() {
      updateStepProgress();
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
      beginHistory();
      rows[index][column] = target.value;
      queueHistoryCommit();
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
      const metadata = document.createElementNS("http://www.w3.org/2000/svg", "metadata");
      metadata.textContent = JSON.stringify(PROJECT_PROVENANCE);
      clone.insertBefore(metadata, clone.firstChild);
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
