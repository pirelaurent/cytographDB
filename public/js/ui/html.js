/*
 generated html here 
*/
"use strict";
import {
  getCy,
} from "../graph/cytoscapeCore.js"

import {
  getLocalDBName,
} from "../dbFront/tables.js"

function createIconButton(doc, { src, alt, title, width = 25, height = 25, onClick }) {
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


export function sendNodeListToHtml() {
  let nodes;
  // permimeter
  nodes = getCy().nodes(":selected:visible");
  if (nodes.length === 0) nodes = getCy().nodes(":visible");
  if (nodes.length == 0) {
    showAlert("no nodes to list in current perimeter. <br/> Check your selection. ");
    return;
  }

  // helpers
  function zeroBlank(val) { return val !== 0 ? String(val) : "-"; }
  function rowValuesFromNode(node) {
    return [
      // remove the stars from label
      node.data('label').replace(/\*/g, "") || "",
      zeroBlank(node.data('columns')?.length || 0),
      zeroBlank(node.data('indexes')?.length || 0),
      zeroBlank(node.data('foreignKeys')?.length || 0),
      zeroBlank(node.data('triggers')?.length || 0)
    ];
  }

  // tri initial par label (comme avant)
  const sortedNodes = nodes.sort((a, b) => {
    const labelA = a.data("label") || "";
    const labelB = b.data("label") || "";
    return labelA.localeCompare(labelB);
  });

  // ouvre la fenêtre
  const win = window.open("", "nodeListWindow");
  const doc = win.document;

  // ---- HEAD ----
  doc.title = "Node List";

  // meta charset
  const meta = doc.createElement("meta");
  meta.setAttribute("charset", "UTF-8");
  doc.head.appendChild(meta);

  // styles
  const style = doc.createElement("style");
  style.textContent = `
  body { font-family: system-ui, sans-serif; }
  table { border-collapse: collapse; cursor: pointer; }
  th, td { padding: 5px 10px; border: 1px solid #ccc; color:grey;}
  th {background-color: #b11e1e; color: white}
  td.num { text-align: left; padding-left:30px; }
  td.asc { text-align: center;color:black; font-weight: bold;}
  th.sort-asc::after { content: " ▲"; }
  th.sort-desc::after { content: " ▼"; }
  h2 { display:flex; align-items:center; gap:.5rem; }
  .close-btn { cursor:pointer; }
`;
  doc.head.appendChild(style);

  // ---- BODY ----
  const body = doc.body;
  body.textContent = ""; // nettoie le body

  // titre + bouton close
  const h2 = doc.createElement("h2");
  const closeNodeImg = createIconButton(doc, {
    src: "img/table.png",
    alt: "Return",
    title: "Close",
    onClick: () => win.close()
  });
  h2.appendChild(closeNodeImg);


  h2.appendChild(doc.createTextNode(` Nodes (${sortedNodes.length} in current perimeter)`));
  body.appendChild(h2);

  // table
  const table = doc.createElement("table");
  table.id = "myTable";
  const thead = doc.createElement("thead");
  const thr = doc.createElement("tr");
  ["Table", "Cols", "Index", "FK", "Trig"].forEach(h => {
    const th = doc.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");
  table.appendChild(tbody);
  body.appendChild(table);

  // fill in lines
  for (const node of sortedNodes) {
    const tr = doc.createElement("tr");
    const vals = rowValuesFromNode(node);
    vals.forEach((val, idx) => {
      const td = doc.createElement("td");

      if (idx === 0) {
        td.className = "asc";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          const tableId = node.data('id'); // ou 'label' si c'est ça l'identifiant
          //const localDBName = window.localDBName || ""; // si défini globalement
    

          window.open(
            `/table.html?name=${encodeURIComponent(tableId)}&currentDBName=${encodeURIComponent(getLocalDBName())}`,
            `TableDetails_${tableId}`
          );
        });
      } else if (idx === 4 && val !== "-" && !isNaN(Number(val))) {
        // Dernière colonne (triggers) si c'est bien un nombre
        td.className = "num";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          const tableName = node.data('label').replace(/\*/g, "");
          const url = `/triggers.html?table=${encodeURIComponent(tableName)}`;
          window.open(url, `triggers of ${tableName}`);
        });
      }
      else td.className = "num";
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  // ---- tri par clic ----
  function sortTable(tableEl, col, numeric = false) {
    const tbodyEl = tableEl.querySelector("tbody");
    const rows = Array.from(tbodyEl.querySelectorAll("tr"));
    const ths = tableEl.querySelectorAll("th");
    const th = ths[col];
    const isAsc = !th.classList.contains("sort-asc");

    // reset classes
    ths.forEach(h => h.classList.remove("sort-asc", "sort-desc"));
    th.classList.add(isAsc ? "sort-asc" : "sort-desc");

    rows.sort((a, b) => {
      let aText = a.children[col].textContent.trim();
      let bText = b.children[col].textContent.trim();

      if (numeric) {
        const toNum = v => v === "-" ? 0 : Number(v);
        const an = toNum(aText);
        const bn = toNum(bText);
        return isAsc ? an - bn : bn - an;
      } else {
        const cmp = aText.localeCompare(bText, undefined, { numeric: true, sensitivity: "base" });
        return isAsc ? cmp : -cmp;
      }
    });

    rows.forEach(r => tbodyEl.appendChild(r));
  }

  const numericCols = [1, 2, 3, 4];
  doc.querySelectorAll("#myTable th").forEach((th, index) => {
    th.addEventListener("click", () => {
      sortTable(table, index, numericCols.includes(index));
    });
  });
  // Mark the first column as already sorted ascending
  const firstTh = table.querySelector("th"); // First header cell
  firstTh.classList.add("sort-asc");
}//sendNodeListToHtml



/*
 generate list of nodes label on a new html page 
*/
export function OldsendEdgeListToHtml() {
  let edges = getCy().edges(":selected:visible");
  if (edges.length === 0) edges = getCy().edges(":visible");

  if (edges.length == 0) {
    showAlert("no selected edges to list.");
    return;
  }

  const sortedEdges = edges.sort((a, b) => {
    let labelA = ` 
      ${a.source().id()} --> 
      ${a.target().id()}
      \n ${a.data("label")}
      `
    if (a.hasClass('fk_detailed')) labelA += '\n' + a.data('columnsLabel');

    let labelB = ` 
      ${b.source().id()} --> 
      ${b.target().id()}
      \n ${b.data("label")}
      `
    if (b.hasClass('fk_detailed')) labelB += '\n' + b.data('columnsLabel');
    return labelA.localeCompare(labelB);
  });

  const win = window.open("", "edgeListWindow");
  let outputLines = "<ul>";
  let lastSourceTarget = '';
  let lastFKLabel = '';

  sortedEdges.forEach((edge) => {
    let sourceTarget = ` 
      ${edge.source().id()} --> 
      ${edge.target().id()}
      `
    if (lastSourceTarget != sourceTarget) {
      outputLines += `<strong>${sourceTarget}</strong><br/>`;
      lastSourceTarget = sourceTarget;
    }

    if (lastFKLabel != edge.data("label")) {
      outputLines += `&nbsp; ${edge.data("label")}<br/>`;
      lastFKLabel = edge.data("label");
    }

    if (edge.hasClass('fk_detailed')) {
      outputLines += `&nbsp;&nbsp;&nbsp;- ${edge.data('columnsLabel')}<br/>`;
    }

  });

  outputLines += "</ul>";

  const html = `
    <html>
    <head><title>Edge List</title></head>
    <body>
      <h2>${edges.length} edges <small>(in current perimeter)</small></h2>
       ${outputLines}
    </body>
    </html>
  `;
  // ${edges.map((name) => `<li>${name}</li>`).join("")}
  // win.document.write(html);
  win.document.body.innerHTML = html;
  win.document.close();
}

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
    ths.forEach(h => h.classList.remove("sort-asc", "sort-desc"));
    th.classList.add(isAsc ? "sort-asc" : "sort-desc");

    rows.sort((a, b) => {
      const aCell = a.children[col];
      const bCell = b.children[col];
      // on trie sur la vraie valeur si data-value existe
      const aText = (aCell.dataset.value ?? aCell.textContent).trim();
      const bText = (bCell.dataset.value ?? bCell.textContent).trim();

      if (numeric) {
        const toNum = v => v === "-" ? 0 : Number(v);
        return isAsc ? toNum(aText) - toNum(bText) : toNum(bText) - toNum(aText);
      } else {
        const cmp = aText.localeCompare(bText, undefined, { numeric: true, sensitivity: "base" });
        return isAsc ? cmp : -cmp;
      }
    });

    rows.forEach(r => tbodyEl.appendChild(r));
  }


  // Prepare data rows
  const rowsData = edges.map(e => {
    const sourceName = cleanLabel(e.source().data("label") || e.source().id());
    const targetName = cleanLabel(e.target().data("label") || e.target().id());
    const fkLabel = e.data("label") || "";
    const columns = e.hasClass("fk_detailed") ? (e.data("columnsLabel") || "") : "-";
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

  const style = doc.createElement("style");
  style.textContent = `
  body { font-family: system-ui, sans-serif; margin: 12px; overflow-x: auto; }
  table {
  border-collapse: collapse;
  width: auto;
  table-layout: auto;
  max-width: 100%;
}
    th, td { padding: 6px 10px; border: 1px solid #ccc; }
    th { background-color: #8e2e2e; color: white; cursor: pointer; position: sticky; top: 0; }
    td.num { text-align: left; padding-left:30px; }
    td.text { }
    td.link { color:black; font-weight: 600; cursor: pointer; }
    th.sort-asc::after { content: " ▲"; }
    th.sort-desc::after { content: " ▼"; }
    h2 { display:flex; align-items:center; gap:.5rem; margin: 0 0 10px; }
    .close-btn { cursor:pointer; }
    .repeat-marker { text-align: left; padding-left:30px; }
  `;
  doc.head.appendChild(style);

  // BODY
  const body = doc.body;
  body.textContent = "";

  // Title + close button
  const h2 = doc.createElement("h2");
  const closeEdgeImg = createIconButton(doc, {
    src: "img/table.png",
    alt: "Return",
    title: "Close",
    onClick: () => win.close()
  });
  h2.appendChild(closeEdgeImg);
  h2.appendChild(doc.createTextNode(`Edges (${edges.length}  in current perimeter)`));
  body.appendChild(h2);

  // Table
  const table = doc.createElement("table");
  table.id = "edgeTable";

  const thead = doc.createElement("thead");
  const thr = doc.createElement("tr");
  ["Source", "Target", "FK", "Columns"].forEach(h => {
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
  // Après rowsData.sort(...), avant la boucle d'insertion des <tr> :
  let lastTriple = { s: null, t: null, f: null };

  rowsData.forEach(({ sourceName, targetName, fkLabel, columns }) => {
    const tr = doc.createElement("tr");

    const sameAsAbove =
      lastTriple.s === sourceName &&
      lastTriple.t === targetName &&
      lastTriple.f === fkLabel;

    // --- Source ---
    const tdSource = doc.createElement("td");
    tdSource.className = "link";
    tdSource.dataset.value = sourceName;
    if (sameAsAbove) {
      tdSource.textContent = '〃';
      tdSource.classList.add("repeat-marker");
    } else {
      tdSource.textContent = sourceName;
    }
    //tdSource.textContent = sameAsAbove ? '〃' : sourceName;

    tdSource.title = `Open table: ${sourceName}`;
    tdSource.addEventListener("click", () => 
      window.open(
        `/table.html?name=${encodeURIComponent(sourceName)}&currentDBName=${encodeURIComponent(getLocalDBName())}`,
        `TableDetails_${sourceName}`
      )
  );
    tr.appendChild(tdSource);

    // --- Target ---
    const tdTarget = doc.createElement("td");
    tdTarget.className = "link";
    tdTarget.dataset.value = targetName;
    if (sameAsAbove) {
      tdTarget.textContent = '〃';
      tdTarget.classList.add("repeat-marker");
    } else {
      tdTarget.textContent = targetName;
    }
    tdTarget.title = `Open table: ${targetName}`;
    tdTarget.addEventListener("click", () =>
      window.open(
        `/table.html?name=${encodeURIComponent(targetName)}&currentDBName=${encodeURIComponent((getLocalDBName()))}`,
        `TableDetails_${targetName}`
      )
    );

    tr.appendChild(tdTarget);

    // --- FK ---
    const tdFk = doc.createElement("td");
    tdFk.className = "text";
    tdFk.dataset.value = fkLabel || "";

    if (sameAsAbove) {
      tdFk.textContent = '〃';
      tdFk.classList.add("repeat-marker");
    } else {
      tdFk.textContent = (fkLabel || "-");
    }
    // pour le tri
    //tdFk.textContent = sameAsAbove ? '〃' : (fkLabel || "-");
    tr.appendChild(tdFk);

    // --- Columns ---
    const tdCols = doc.createElement("td");
    tdCols.className = "text";
    tdCols.textContent = columns || "-";
    tr.appendChild(tdCols);

    tbody.appendChild(tr);

    if (!sameAsAbove) {
      lastTriple = { s: sourceName, t: targetName, f: fkLabel };
    }
  });

  // Sorting
  const sortableCols = [0, 1, 2]

  doc.querySelectorAll("#edgeTable th").forEach((th, index) => {
    if (sortableCols.includes(index)) {
      th.addEventListener("click", () => {
        sortTable(table, index, false); // false all are string
      });
    }
  });
  // Mark initial sort on "Source"
  table.querySelector("th").classList.add("sort-asc");
}
