/*
 generated html here entirely 

 ( a another way  was tried with table.html and tabledetails.js )
*/
"use strict";
import { getCy } from "../graph/cytoscapeCore.js";
import { showAlert } from "./dialog.js";
import { getLocalDBName } from "../dbFront/tables.js";
import { htmlTableToMarkdown } from "../util/markdown.js";

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
      zeroBlank(node.incomers("edge")?.length || 0),
      zeroBlank(node.data("triggers")?.length || 0),
    ];
  }

  // tri initial par label (comme avant)
  const sortedNodes = nodes.sort((a, b) => {
    const labelA = a.data("label") || "";
    const labelB = b.data("label") || "";
    return labelA.localeCompare(labelB);
  });

  // open new window
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

  // ---- BODY HtmL----

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
    },
  });
  h2.appendChild(closeNodeImg);

  h2.appendChild(
    doc.createTextNode(` Nodes (${sortedNodes.length} in current perimeter)`)
  );
  body.appendChild(h2);

  const header = createHeaderMarkdown(doc);
  body.appendChild(header);

  // table
  const table = doc.createElement("table");
  const tableName = "tableNodes";
  table.id = tableName;

  const thead = doc.createElement("thead");
  const thr = doc.createElement("tr");
  ["  ", "Table", "Cols", "Index", "FK →", "← in", "Trig"].forEach((h) => {
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

    const tdCheck = doc.createElement("td");
    const id = node.id();
    const cb = doc.createElement("input");
    cb.type = "checkbox";
    cb.id = "cb_" + id;
    cb.name = "nodeIds";
    cb.value = id;
    cb.checked = !!node.selected();
    cb.classList.add("nodeChk");
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
      } else if (idx === 5 && val !== "-" && !isNaN(Number(val))) {
        // Dernière colonne (triggers) si c'est bien un nombre
        td.className = "num";
        td.style.cursor = "pointer";
        td.addEventListener("click", () => {
          const tableName = node.data("label").replace(/\*/g, "");
          const url = `/triggers.html?table=${encodeURIComponent(tableName)}`;
          window.open(url, `triggers of ${tableName}`);
        });
      } else {
        td.className = "num";
        td.style.cursor = "default";
      }

      td.textContent = val;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
    // set markdown
    const db = getLocalDBName();
    let title = db? "nodes list extract from "+db:"nodes list extract"
    
    setEventMarkdown(doc,tableName,title);


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
        const val = (cb) => (cb.indeterminate ? 0.5 : cb.checked ? 1 : 0);
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
  doc.querySelectorAll(`#${tableName} th`).forEach((th, index) => {
    if (index === 0) addInvertToggle(table, 0, doc);
    if (index === 1) th.classList.add("sort-asc");

    th.addEventListener("click", () => {
      sortTable(table, index, numericCols.includes(index));
    });
  });

  // get checked box values
  function getCheckedIds(root = document, selector = "") {
    const scope = selector ? `${selector} ` : "";
    return Array.from(
      root.querySelectorAll(`${scope}input[type="checkbox"]:checked`)
    )
      .map((cb) => cb.value || cb.id || null) // valeur si définie, sinon id
      .filter(Boolean)
      .map((v) => (v.startsWith("cb_") ? v.slice(3) : v)); // optionnel: retire le préfixe cb_
  }

  function addInvertToggle(table, colIndex, doc = document) {
    const th = table.tHead?.rows?.[0]?.cells?.[colIndex];
    if (!th) return;

    const btn = doc.createElement("button");
    btn.type = "button";
    btn.title = "Inverser les coches";
    btn.setAttribute("aria-label", "Inverser les coches");
    // look minimal
    btn.style.padding = "2px";
    btn.style.marginLeft = "6px";
    btn.style.border = "none";
    btn.style.background = "transparent";
    btn.style.cursor = "pointer";
    btn.style.lineHeight = "0"; // compact

    // --- icône ---
    const img = doc.createElement("img");
    img.src = "./img/toggleWhite.png"; // ⇐ ton image
    img.alt = ""; // décoratif (aria-label sur le bouton)
    img.width = 16; // ajuste la taille
    img.height = 16;
    img.draggable = false;

    btn.appendChild(img);

    // Inversion sur clic (sans déclencher le tri)
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const tbody = table.tBodies[0];
      const selector = `tr td:nth-child(${
        colIndex + 1
      }) input[type="checkbox"]`;
      tbody.querySelectorAll(selector).forEach((cb) => {
        if (cb.disabled) return;
        cb.indeterminate = false;
        cb.checked = !cb.checked;
        // propage un vrai changement si ton code écoute 'change'
        cb.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    th.appendChild(btn);
  }
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

/*
 shared with edges
 */

export function createHeaderMarkdown(doc) {
  // --- Header (H2 + 3 imgs) ---
  const header = doc.createElement("div");
  header.className = "section-header";

  const h2 = doc.createElement("h2");
  h2.id = "columnNumber";
  h2.className = "section-title";
  h2.textContent = ""; // Columns in table details, no name here

  header.appendChild(h2);

  const actions = doc.createElement("div");
  actions.className = "md-actions";
  actions.setAttribute("role", "group");
  actions.setAttribute("aria-label", "Actions Markdown");

  /* logo Markdown (décoratif)
const imgMd = doc.createElement("img");
imgMd.src   = new URL("./img/markdown.png", location.href).href;
imgMd.alt   = "Markdown";
imgMd.title = "Format Markdown";
imgMd.height = 16;
imgMd.setAttribute("aria-hidden", "true");  // décoratif uniquement
actions.appendChild(imgMd);
*/

  // Download
  const imgDl = doc.createElement("img");
  imgDl.id = "mdDownload";
  imgDl.src = new URL("./img/download.png", location.href).href;
  imgDl.alt = "Download Markdown";
  imgDl.title = "download Markdown";
  imgDl.height = 25;
  imgDl.setAttribute("aria-hidden", "true");
  imgDl.style.cursor = "pointer";
  actions.appendChild(imgDl);

  // Copy
  const imgCp = doc.createElement("img");
  imgCp.id = "mdCopy";
  imgCp.src = new URL("./img/clipboardCopy.png", location.href).href;
  imgCp.alt = "Copy markdown to clipboard";
  imgCp.title = "Copy markdown to clipboard";
  imgCp.height = 22;
  imgCp.setAttribute("aria-hidden", "true");
  imgCp.style.cursor = "pointer";
  actions.appendChild(imgCp);

  header.appendChild(actions);

  return header;
}

export function setEventMarkdown(doc,tableName,title){

  doc.getElementById("mdCopy")?.addEventListener("click", async () => {
     htmlTableToMarkdown(
        tableName,
        {
          download: false,
          copyToClipboard: true,
        },
        title,
        doc
      );
    });

    doc.getElementById("mdDownload")?.addEventListener("click", () => {
      htmlTableToMarkdown(
        tableName,
        {
          download: true,
          copyToClipboard: false,
          filename: `columns_${tableName || "table"}.md`,
        },
        title,
        doc
      );
    });
}



