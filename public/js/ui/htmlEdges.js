/*
 generated html here entirely 

 ( a another way  was tried with table.html and tabledetails.js )
*/
"use strict";
import { getCy } from "../graph/cytoscapeCore.js";

import { showAlert } from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";
import { createHeaderMarkdown, setEventMarkdown } from "../ui/htmlNodes.js";

function createIconButton(
  doc,
  { src, alt, title, width = 25, height = 25, onClick }
) {
  const img = doc.createElement("img");
  img.src = new URL(src, location.href).href; // make sure the path works in the popup
  img.alt = alt || "";
  img.title = title || "";
  img.style.cssText = `cursor:pointer; vertical-align:middle; width:${width}px; height:${height}px;`;

  if (typeof onClick === "function") {
    img.addEventListener("click", onClick);
  }
  return img;
}

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
    const sourceName = cleanLabel(e.source().data("label") || e.source().id());
    const targetName = cleanLabel(e.target().data("label") || e.target().id());
    const fkLabel = e.data("label") || "";
    const columns = e.hasClass("fk_detailed")
      ? e.data("columnsLabel") || ""
      : "";
    return { sourceName, targetName, fkLabel, columns };
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
  body.className = "alt-body";
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
  let tablo = ["Source", "Target", "FK"];
  if (true) tablo.push("Columns");

  tablo.forEach((h) => {
    const th = doc.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  table.appendChild(tbody);
  body.appendChild(table);

  // Fill rows
  let rowColor = "one";
  // Après rowsData.sort(...), avant la boucle d'insertion des <tr> :
  let lastTriple = { s: null, t: null, f: null };

  rowsData.forEach(({ sourceName, targetName, fkLabel, columns }) => {
    const tr = doc.createElement("tr");
    tr.className = rowColor;
    const sameAsAbove =
      lastTriple.s === sourceName &&
      lastTriple.t === targetName &&
      lastTriple.f === fkLabel;

    if (!sameAsAbove) {
      rowColor = rowColor === "one" ? "two" : "one";
      tr.className = rowColor;
    }

    // --- Source ---
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

    tr.appendChild(tdFk);

    // --- Columns ---
    const tdCols = doc.createElement("td");
    tdCols.className = "text";
    if (columns != "") {
      tdCols.textContent = columns;
    } else {
      const symbol = `<img src ="./img/onePerFk.png" width="40px" title="1 edge per fk">`;
      tdCols.innerHTML = symbol;
    }

    tr.appendChild(tdCols);

    tbody.appendChild(tr);

    if (!sameAsAbove) {
      lastTriple = { s: sourceName, t: targetName, f: fkLabel };
    }
  });

  const db = getLocalDBName();
  let title = db?`list of FK from ${db}`:"list of FK" ;

  setEventMarkdown(doc, tableName,title);

  // Sorting
  const sortableCols = [0, 1, 2];

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

