/*
 generated html here 
*/
"use strict";
import { getCy } from "../graph/cytoscapeCore.js";

import { showAlert } from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";

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

export function showWaitCursor() {
  document.documentElement.classList.add("busy");
  // double rAF pour garantir un paint avant le calcul
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}

export function hideWaitCursor() {
  document.documentElement.classList.remove("busy");
}
/*
 generate a page with nodes list in a new tab
*/
export function listNodesToHtml() {
  let nodes;
  // permimeter
  nodes = getCy().nodes(":selected:visible");
  if (nodes.length === 0) nodes = getCy().nodes(":visible");
  if (nodes.length == 0) {
    showAlert(
      "no nodes to list in current perimeter. <br/> Check your selection. "
    );
    return;
  }

  // helpers
  function zeroBlank(val) {
    return val !== 0 ? String(val) : "-";
  }

  function rowValuesFromNode(node) {
    // list of index in node include PK and optional unique constraints
    // indexes = { name, definition, comment, constraint_type, is_primary?, is_unique? }
    const realIndexes = (node.data("indexes") || []).filter((ix) => {
      const t = (ix.constraint_type || "").toUpperCase(); // 'PRIMARY KEY' | 'UNIQUE' | 'EXCLUDE' | ''
      const isPk = t === "PRIMARY KEY" || ix.is_primary === true;
      const isUnique =
        t === "UNIQUE" ||
        ix.is_unique === true ||
        /create\s+unique\s+index/i.test(ix.definition || "");
      const isExclude = t === "EXCLUDE"; // mets false si tu veux les garder

      return !isPk && !isUnique && !isExclude; // retire "&& !isExclude" pour conserver EXCLUDE
    });

    return [
      // remove the stars from label
      node.data("label").replace(/\*/g, "") || "",
      zeroBlank(node.data("columns")?.length || 0),
      zeroBlank(realIndexes?.length || 0),
      zeroBlank(node.data("foreignKeys")?.length || 0),
      zeroBlank(node.data("triggers")?.length || 0),
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
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/style.css";
  doc.head.appendChild(link);

  // ---- BODY ----
  const body = doc.body;
  body.className = "alt-body";
  body.textContent = ""; // nettoie le body

  // titre + bouton close
  const h2 = doc.createElement("h2");
  const closeNodeImg = createIconButton(doc, {
    src: "img/closePage.png",
    alt: "Return",
    title: "Close",
    onClick: () => {
      const ids = getCheckedIds(doc);                
        window.applySelectionFromPopup?.(ids);
      win.close();
    }
  });
  h2.appendChild(closeNodeImg);

  h2.appendChild(
    doc.createTextNode(` Nodes (${sortedNodes.length} in current perimeter)`)
  );
  body.appendChild(h2);

  // table
  const table = doc.createElement("table");
  table.id = "myTable";
  const thead = doc.createElement("thead");
  const thr = doc.createElement("tr");
  ["  ", "Table", "Cols", "Index", "FK", "Trig"].forEach((h) => {
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

    const tr = doc.createElement('tr');

    const tdCheck = doc.createElement('td');
    const id = node.id();
    const cb = doc.createElement('input');
    cb.type = 'checkbox';
    cb.id = 'cb_' + id;                          
    cb.name = 'nodeIds';                        
    cb.value = id;                             
    cb.checked = !!node.selected();              
    cb.classList.add('nodeChk');
    tdCheck.appendChild(cb);
    tr.appendChild(tdCheck);


    const vals = rowValuesFromNode(node);
    vals.forEach((val, idx) => {
      const td = doc.createElement("td");

      if (idx === 0) {
        td.className = "asc";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          const tableId = node.data("id"); // ou 'label' si c'est ça l'identifiant
          //const localDBName = window.localDBName || ""; // si défini globalement
          const url = `/table.html?name=${encodeURIComponent(
            tableId
          )}&currentDBName=${encodeURIComponent(getLocalDBName())}`;
          const name = `TableDetails_${tableId}`;

          /*           window.open(
                      `/table.html?name=${encodeURIComponent(tableId)}&currentDBName=${encodeURIComponent(getLocalDBName())}`,
                      `TableDetails_${tableId}`
                    ); 
          */
          // 1) Tenter de récupérer la fenêtre existante
          let w = window.open("", name);

          if (w && !w.closed) {
            // Mise à jour de l’URL au cas où + focus
            try {
              if (w.location.href !== url) w.location.href = url;
              w.focus();
            } catch {
              // Fallback si cross-origin ou autre
              w = window.open(url, name);
              if (w) w.focus();
            }
          } else {
            // 2) Sinon, on l’ouvre puis focus
            w = window.open(url, name);
            if (w) w.focus();
          }
        });
      } else if (idx === 4 && val !== "-" && !isNaN(Number(val))) {
        // Dernière colonne (triggers) si c'est bien un nombre
        td.className = "num";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          const tableName = node.data("label").replace(/\*/g, "");
          const url = `/triggers.html?table=${encodeURIComponent(tableName)}`;
          window.open(url, `triggers of ${tableName}`);
        });
      } else td.className = "num";
      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  // ---- sort by a clic ----
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

      // 1) Si la colonne contient des checkboxes, on trie dessus
      const aCb = aCell.querySelector('input[type="checkbox"]');
      const bCb = bCell.querySelector('input[type="checkbox"]');
      if (aCb && bCb) {
        // false < indeterminate < true
        const val = cb => cb.indeterminate ? 0.5 : (cb.checked ? 1 : 0);
        const cmp = val(aCb) - val(bCb);

        // isAsc === true : non cochées -> au début ; false : cochées -> au début
        return isAsc ? cmp : -cmp;
      }


      let aText = a.children[col].textContent.trim();
      let bText = b.children[col].textContent.trim();

      if (numeric) {
        const toNum = (v) => (v === "-" ? 0 : Number(v));
        const an = toNum(aText);
        const bn = toNum(bText);
        return isAsc ? an - bn : bn - an;
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

  const numericCols = [2, 3, 4, 5]; //between the 0..5 cols 
  doc.querySelectorAll("#myTable th").forEach((th, index) => {
    if (index === 0) addInvertToggle(table, 0, doc);
    if (index === 1) th.classList.add("sort-asc");

    th.addEventListener("click", () => {
      sortTable(table, index, numericCols.includes(index));
    });
  });

// get checked box values 
  function getCheckedIds(root = document, selector = '') {
    const scope = selector ? `${selector} ` : '';
    return Array.from(root.querySelectorAll(`${scope}input[type="checkbox"]:checked`))
      .map(cb => cb.value || cb.id || null)           // valeur si définie, sinon id
      .filter(Boolean)
      .map(v => v.startsWith('cb_') ? v.slice(3) : v); // optionnel: retire le préfixe cb_
  }

  function addInvertToggle(table, colIndex, doc = document) {
    const th = table.tHead?.rows?.[0]?.cells?.[colIndex];
    if (!th) return;

    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.title = 'Inverser les coches';
    btn.setAttribute('aria-label', 'Inverser les coches');
    // look minimal
    btn.style.padding = '2px';
    btn.style.marginLeft = '6px';
    btn.style.border = 'none';
    btn.style.background = 'transparent';
    btn.style.cursor = 'pointer';
    btn.style.lineHeight = '0'; // compact

    // --- icône ---
    const img = doc.createElement('img');
    img.src = './img/toggleWhite.png';      // ⇐ ton image
    img.alt = '';                         // décoratif (aria-label sur le bouton)
    img.width = 16;                       // ajuste la taille
    img.height = 16;
    img.draggable = false;

    btn.appendChild(img);

    // Inversion sur clic (sans déclencher le tri)
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const tbody = table.tBodies[0];
      const selector = `tr td:nth-child(${colIndex + 1}) input[type="checkbox"]`;
      tbody.querySelectorAll(selector).forEach(cb => {
        if (cb.disabled) return;
        cb.indeterminate = false;
        cb.checked = !cb.checked;
        // propage un vrai changement si ton code écoute 'change'
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    th.appendChild(btn);
  }
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

  // Table
  const table = doc.createElement("table");
  table.id = "edgeTable";

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
      rowColor = (rowColor === "one" ? "two" : "one");
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

  // Sorting
  const sortableCols = [0, 1, 2];

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

/*
 callback from the generated page 
*/

window.applySelectionFromPopup = function (ids) {
  console.log('[parent] ids reçus du popup:', ids);

   const cy = getCy();
  cy.batch(() => {
    cy.elements().unselect();
    if (ids?.length) cy.$(ids.map(id => `#${CSS.escape(id)}`).join(',')).select();
  });
};
