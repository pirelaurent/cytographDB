/*
 generated html here entirely 

 ( a another way  was tried with table.html and tabledetails.js )
*/
"use strict";
import { getCy } from "../graph/cytoscapeCore.js";

import { showAlert } from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";
import { createHeaderMarkdown } from "../ui/htmlNodes.js";
import { setEventMarkdown } from "../util/markdown.js";

import { createIconButton } from "../ui/dialog.js";

import {ConstantClass} from "../util/common.js"

/*
 edges list 
*/
export function sendEdgeListToHtml() {
  let edges = getCy().edges(":selected:visible");
  if (edges.length === 0) edges = getCy().edges(":visible");

  if (edges.length === 0) {
    showAlert("no selected edges to list.");
    return;
  }

  // Helpers
  const cleanLabel = (s) => (s || "").replace(/\*/g, "");

  // Nouveau (avec support de data-value)
  function sortTable(tableEl, col, numeric = false) {
    const tbodyEl = tableEl.querySelector("tbody");
    const rows = Array.from(tbodyEl.querySelectorAll("tr"));
    const ths = tableEl.querySelectorAll("th");
    const th = ths[col];
    const isAsc = !th.classList.contains("sort-asc");

    // reset classes
    ths.forEach((h) => h.classList.remove("sort-asc", "sort-desc"));
    th.classList.add(isAsc ? "sort-asc" : "sort-desc");

    rows.sort((a, b) => {
      const aCell = a.children[col];
      const bCell = b.children[col];
      // on trie sur la vraie valeur si data-value existe
      const aText = (aCell.dataset.value ?? aCell.textContent).trim();
      const bText = (bCell.dataset.value ?? bCell.textContent).trim();

      if (numeric) {
        const toNum = (v) => (v === "-" ? 0 : Number(v));
        return isAsc
          ? toNum(aText) - toNum(bText)
          : toNum(bText) - toNum(aText);
      } else {
        const cmp = aText.localeCompare(bText, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return isAsc ? cmp : -cmp;
      }
    });

    rows.forEach((r) => tbodyEl.appendChild(r));
  }

  // Prepare data rows
  const rowsData = edges.map((e) => {
    const nodeSource = e.source();
    const nodeDest = e.target();
    const sourceName = cleanLabel(nodeSource.data("label") || e.source().id());
    const targetName = cleanLabel(nodeDest.data("label") || e.target().id());
    // an edge is an fk and hold its name
    const fkLabel = e.data("label") || "";
    // current state of edge : global or detailed

    const columns = e.hasClass(`${ConstantClass.FK_DETAILED}`)
      ? { label: e.data("columnsLabel") || "", nullable: e.data("nullable") }
      : "";

    const fkNullable = e.data("nullable"); // true/false

    return { sourceName, targetName, fkLabel, fkNullable, columns };
  });

  // Initial sort by Source then Target for stable display

  rowsData.sort((a, b) => {
    const s = a.sourceName.localeCompare(b.sourceName);
    return s !== 0 ? s : a.targetName.localeCompare(b.targetName);
  });

  // Open window and build DOM

  const win = window.open("", "edgeListWindow");
  const doc = win.document;

  // HEAD

  doc.title = "Edge List";
  const meta = doc.createElement("meta");
  meta.setAttribute("charset", "UTF-8");
  doc.head.appendChild(meta);

  // styles
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/style.css";
  doc.head.appendChild(link);
  // BODY
  const body = doc.body;
  //body.className = "alt-body";
  body.textContent = "";

  // Title + close button
  const h2 = doc.createElement("h2");
  const closeEdgeImg = createIconButton(doc, {
    src: "img/closePage.png",
    alt: "Return",
    title: "Close",
    onClick: () => win.close(),
  });
  h2.appendChild(closeEdgeImg);
  h2.appendChild(
    doc.createTextNode(`Edges (${edges.length}  in current perimeter)`)
  );
  body.appendChild(h2);

  const header = createHeaderMarkdown(doc);
  body.appendChild(header);

  // Table
  const table = doc.createElement("table");
  const tableName = "edgeTable";
  table.id = tableName;

  const thead = doc.createElement("thead");
  const thr = doc.createElement("tr");

  {
    const th = doc.createElement("th");
    th.textContent = "Source";
    thr.appendChild(th);
  }
  {
    const th = doc.createElement("th");
    th.textContent = "Target";
    thr.appendChild(th);
  }

  {
    const th = doc.createElement("th");
    th.textContent = "FK";
    thr.appendChild(th);
  }

  {
    const th = doc.createElement("th");
    th.textContent = "●/○";

    th.title = "not null / nullable";
    thr.appendChild(th);
  }

  {
    const th = doc.createElement("th");
    th.innerHTML = "col. -> col.";
    th.title = "columns are detailed only in mode FK 1/col";
    thr.appendChild(th);
  }

  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  table.appendChild(tbody);
  body.appendChild(table);

  // Fill rows
  let rowColor = "one";
  // Après rowsData.sort(...), avant la boucle d'insertion des <tr> :
  let lastTriple = { s: null, t: null, f: null };

  rowsData.forEach(
    ({ sourceName, targetName, fkLabel, fkNullable, columns }) => {
      const tr = doc.createElement("tr");
      // color change if FK change
      tr.className = rowColor;
      const sameAsAbove =
        lastTriple.s === sourceName &&
        lastTriple.t === targetName &&
        lastTriple.f === fkLabel;

      if (!sameAsAbove) {
        rowColor = rowColor === "one" ? "two" : "one";
        tr.className = rowColor;
      }

      // --- Source with links---
      const tdSource = doc.createElement("td");
      tdSource.className = "link";
      tdSource.dataset.value = sourceName;
      if (sameAsAbove) {
        tdSource.textContent = "";
        tdSource.classList.add("repeat-marker");
      } else {
        tdSource.textContent = sourceName;
      }

      tdSource.title = `Open table: ${sourceName}`;
      tdSource.addEventListener("click", () =>
        window.open(
          `/table.html?name=${encodeURIComponent(
            sourceName
          )}&currentDBName=${encodeURIComponent(getLocalDBName())}`,
          `TableDetails_${sourceName}`
        )
      );
      tr.appendChild(tdSource);

      // --- Target ---

      const tdTarget = doc.createElement("td");
      tdTarget.className = "link";
      tdTarget.dataset.value = targetName;
      if (sameAsAbove) {
        tdTarget.textContent = "";
        tdTarget.classList.add("repeat-marker");
      } else {
        tdTarget.textContent = targetName;
      }
      tdTarget.title = `Open table: ${targetName}`;
      tdTarget.addEventListener("click", () =>
        window.open(
          `/table.html?name=${encodeURIComponent(
            targetName
          )}&currentDBName=${encodeURIComponent(getLocalDBName())}`,
          `TableDetails_${targetName}`
        )
      );

      tr.appendChild(tdTarget);

      // --- FK ---
      const tdFk = doc.createElement("td");
      tdFk.className = "text";
      tdFk.dataset.value = fkLabel || "";

      if (sameAsAbove) {
        tdFk.textContent = "";
        tdFk.classList.add("repeat-marker");
      } else {
        tdFk.textContent = fkLabel || "-";
      }

      if (fkNullable) tdFk.classList.add("nullable");
      tr.appendChild(tdFk);

      // --- nullable ---

      const tdNullable = doc.createElement("td");
      tdNullable.className = "text";
      if (columns != "") {
        tdNullable.textContent = columns.nullable ? "○" : "●"; // /○<here true/false changed
        tdNullable.title = columns.nullable ? "nullable" : "not null";
      } else {
        tdNullable.textContent = fkNullable ? "○" : "●";
        tdNullable.title = fkNullable ? "nullable" : "not null";
      }

      tr.appendChild(tdNullable);

      // --- Columns ---

      const tdCols = doc.createElement("td");
      tdCols.className = "text";
      if (columns != "") {
        tdCols.textContent = columns.label;
        if (columns.nullable) tdCols.classList.add("nullable");
      } else {
        //const symbol = `<img src ="./img/onePerFk.png" width="40px" title="1 edge per fk">`;
        //tdCols.innerHTML = symbol;
        tdCols.innerHTML = "-";
        tdCols.classList.add("notDetailed");
        tdCols.title = "detailed cols with mode 1/Col on edges";
      }

      tr.appendChild(tdCols);

      tbody.appendChild(tr);

      if (!sameAsAbove) {
        lastTriple = { s: sourceName, t: targetName, f: fkLabel };
      }
    }
  );

  const db = getLocalDBName();
  let title = db ? `list of FK from ${db}` : "list of FK";

  setEventMarkdown(doc, tableName, title);

  // Sorting on which columns

  const sortableCols = [0, 1, 2, 3];

  doc.querySelectorAll(`#${tableName} th`).forEach((th, index) => {
    if (sortableCols.includes(index)) {
      th.addEventListener("click", () => {
        sortTable(table, index, false); // false all are string
      });
    }
  });
  // Mark initial sort on "Source"
  table.querySelector("th").classList.add("sort-asc");
}

/*
 callback from the generated page 
*/

window.applySelectionFromPopup = function (ids) {
  //console.log("[parent] ids reçus du popup:", ids);

  const cy = getCy();
  cy.batch(() => {
    cy.elements().unselect();
    if (ids?.length)
      cy.$(ids.map((id) => `#${CSS.escape(id)}`).join(",")).select();
  });
};
