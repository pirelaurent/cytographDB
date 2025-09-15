"use strict";
// cannot share data with main, so dbName is in the params

import { showError, getCommentIcon } from "../ui/dialog.js";
import { htmlTableToMarkdown } from "../util/markdown.js";
import { enableTableSorting } from "../util/sortTable.js";

/*
 get details on a table 
*/
async function getTableData(tableName) {
  try {
    const response = await fetch(`/table/${tableName}`);
    if (!response.ok) {
      throw new Error(` HTTP error ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}

/*
 in line code at page loading 
 use url to give table name in html created
*/

const params = new URLSearchParams(window.location.search);
const tableName = params.get("name");

const currentDBName = params.get("currentDBName");
let infoWarning = "";
if (currentDBName == "null") infoWarning = "is not available: no db connected";

let whereTitle = document.getElementById("whereTitle");

whereTitle.innerHTML = `${tableName} ${infoWarning}`;
document.title = `table ${tableName}`;

// call full info from DB
getTableData(tableName).then((result) => {
  if (result.success) {
    const data = result.data;
    if (data.comment){
    const icon = getCommentIcon(document, data.comment);
    whereTitle.appendChild(icon);
    }
    /*

    list of columns 

*/
    const colBody = document.getElementById("columnsTable");
    colBody.innerHTML = "";
    const columnNumber = document.getElementById("columnNumber");

    //columnNumber.innerText+=`(${data.columns.length})`;

    columnNumber.innerHTML += `<small>(${data.columns.length})</small>`;

    data.columns.forEach((col) => {
      const tr = document.createElement("tr");
      const hasComment = !!col.comment;

      // Créer manuellement le contenu de la cellule pour insérer l’icône
      const columnCell = document.createElement("td");
//see line product

        columnCell.textContent = col.column;
      if (hasComment) {
        // Icône
        const icon = getCommentIcon(document,col.comment);
        columnCell.appendChild(icon)
      } 

      // Créer les autres cellules
      const typeCell = document.createElement("td");
      typeCell.textContent = col.type;

      const nullableCell = document.createElement("td");
      nullableCell.textContent = col.nullable;

      // Ajouter toutes les cellules à la ligne
      tr.appendChild(columnCell);
      tr.appendChild(typeCell);
      tr.appendChild(nullableCell);

      // Ajouter la ligne au tableau
      colBody.appendChild(tr);
    });

    // Télécharger .md
    document.getElementById("mdDownload")?.addEventListener("click", () => {
      htmlTableToMarkdown(
        "tableOfTableColumns",
        {
          download: true,
          copyToClipboard: false,
          filename: `columns_${tableName || "table"}.md`,
        },
        tableName
      );
    });

    // Copier dans le presse-papiers

    document.getElementById("mdCopy")?.addEventListener("click", async () => {
      htmlTableToMarkdown(
        "tableOfTableColumns",
        {
          download: false,
          copyToClipboard: true,
        },
        tableName
      );

      // petit feedback visuel (optionnel)
      const btn = document.getElementById("mdCopy");
      if (!btn) return;
      const oldTitle = btn.title;
      btn.title = "Copié !";
      btn.style.outline = "2px solid #7dbb7d";
      setTimeout(() => {
        btn.title = oldTitle;
        btn.style.outline = "none";
      }, 900);
    });

    /*

Primary key 

*/

    const pkContainer = document.getElementById("primaryKeyContainer");

    pkContainer.innerHTML = "";
    if (data.primaryKey.name && data.primaryKey.columns.length > 0) {
      const pkDiv = document.createElement("div");
      pkDiv.className = "pk-block";

      // Crée dynamiquement le titre avec ou sans commentaire
      const titleDiv = document.createElement("div");
      titleDiv.className = "pk-title";

      if (data.primaryKey.comment) {
        titleDiv.title = data.primaryKey.comment;

        // Ajout du texte et de l'icône
        titleDiv.replaceChildren();
        titleDiv.append(document.createTextNode(data.primaryKey.name));
        const icon = getCommentIcon(document);
        if (data.primaryKey?.comment) icon.title = data.primaryKey.comment;
        titleDiv.append(icon);
      } else {
        titleDiv.textContent = data.primaryKey.name;
      }

      pkDiv.appendChild(titleDiv);

      data.primaryKey.columns.forEach((column, i) => {
        let oneCol = document.createTextNode(column);
        pkDiv.appendChild(oneCol);
        if (i < data.primaryKey.columns.length - 1) {
          pkDiv.append(document.createElement("br"));
        }
      });
      pkContainer.appendChild(pkDiv);
    } else {
      pkContainer.innerHTML = "<p>No primary key defined.</p>";
    }

    /*

foreign keys 


    //  foreign keys  X-A-Y   FK:  A-AX  A-AY
    //   A*B*	plusieurs A pour plusieurs B	A.id et B.id non uniques
    //   AB*	un A pour plusieurs B	AX: NOT NULL, AY: NOT NULL, A.id unique, B.id non unique
    //   A*B	plusieurs A pour un B	AX: NOT NULL, AY: NOT NULL, A.id non unique, B.id unique
    //   AB	1..1 vers 1..1	AX: NOT NULL, AY: NOT NULL, A.id et B.id sont uniques (PK ou UNIQUE)

*/

    const fkDiv = document.getElementById("foreignKeysContainer");
    const fkNumber = document.getElementById("fkNumber");

    fkNumber.innerHTML += `<small>(${data.foreignKeys.length})</small>`;

    fkDiv.innerHTML = ""; // Clear any existing content

    if (Array.isArray(data.foreignKeys) && data.foreignKeys.length > 0) {
      const frag = document.createDocumentFragment();

      data.foreignKeys.forEach((fk) => {
        // if no action, no output
        // const actionMap = { a: "NO ACTION", r: "RESTRICT", c: "CASCADE", n: "SET NULL", d: "SET DEFAULT" };
        const actionMap = {
          r: "RESTRICT",
          c: "CASCADE",
          n: "SET NULL",
          d: "SET DEFAULT",
        };
        const upd = actionMap[fk.on_update] || "";
        const del = actionMap[fk.on_delete] || "";

        let allUpDelInfo = "";
        if (upd)
          allUpDelInfo += `<br/><span>ON UPDATE: <code>${upd}</code></span>`;
        if (del)
          allUpDelInfo += `<br/><span>ON DELETE: <code>${del}</code></span>`;

        const block = makeFkBlock(fk, allUpDelInfo);
        frag.appendChild(block);
      });

      fkDiv.appendChild(frag);
    } else {
      fkDiv.textContent = "No foreign keys found.";
    }

    /*
     bloc for FK 
    */

    function makeFkBlock(fk, allUpDelInfo) {
      const block = document.createElement("div");
      block.className = "fk-block";

      // --- Titre ---
      const title = document.createElement("div");
      title.className = "fk-title";
      title.append(document.createTextNode(fk.constraint_name));

      if (fk.comment) title.append(getCommentIcon(document, fk.comment));

      // --- Corps ---
      const body = document.createElement("div");

      const strongSrc = document.createElement("strong");
      strongSrc.textContent = fk.source_table;
      body.append(strongSrc);

      const smallSrc = document.createElement("small");
      smallSrc.textContent = ` (${
        fk.all_source_not_null ? "NOT NULL" : "NULLABLE"
      })`;
      body.append(smallSrc);

      body.append(document.createTextNode(" → "));

      const strongTgt = document.createElement("strong");
      strongTgt.textContent = fk.target_table;
      body.append(strongTgt);

      const smallTgt = document.createElement("small");
      smallTgt.textContent = ` (${
        fk.is_target_unique ? "UNIQUE/PK" : "NOT UNIQUE"
      })`;
      body.append(smallTgt);

      // Infos ON UPDATE/DELETE (si c’est déjà du HTML sûr)
      if (allUpDelInfo) {
        const updel = document.createElement("div");
        updel.innerHTML = allUpDelInfo; // attention : uniquement si la string est de confiance
        body.append(updel);
      }

      // Mappings colonnes
      fk.column_mappings.forEach((col) => {
        const line = document.createElement("div");
        line.textContent = `${col.source_column} → ${col.target_column}`;
        body.append(line);
      });

      block.append(title, body);
      return block;
    }

    // ---- Utilisation ----
    // const block = makeFkBlock(fk, allUpDelInfo);
    // parent.append(block);

    /*
   🔍 Indexes 
   Avoid to repeat PK in index 
    Le test par nom suffit souvent en PostgreSQL (la PK et son index portent le même nom).

Le test par colonnes + UNIQUE couvre les cas où les noms diffèrent mais l’index est exactement celui de la PK (ou un équivalent recréé).

Si tu as un index supplémentaire sur le même ensemble de colonnes que la PK mais non unique, il ne sera pas filtré (c’est volontaire : ce n’est pas la PK).
    */

    const indexContainer = document.getElementById("indexesContainer");
    indexContainer.innerHTML = ""; // nettoie

    const raw = Array.isArray(data.indexes) ? data.indexes : [];

    // (optionnel) dédoublonnage par nom d'index
    const seen = new Set();
    const indexes = raw.filter((i) => {
      const k = i.name || i.indexname;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Partitionning
    const primary = [];
    const uniqueOrExclude = [];
    const pure = [];

    for (const idx of indexes) {
      const t = idx.constraint_type?.toUpperCase?.() || null;
      if (t === "PRIMARY KEY" || idx.is_primary === true) {
        primary.push(idx);
      } else if (t === "UNIQUE" || t === "EXCLUDE") {
        uniqueOrExclude.push(idx);
      } else {
        // no constraint type → pure index
        pure.push(idx);
      }
    }

    // (optionnel) sort elements before output
    const byName = (arr) =>
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    byName(primary);
    byName(uniqueOrExclude);
    byName(pure);

    // pure index
    if (pure.length) {
      const indexNumber = document.getElementById("indexNumber");

      indexNumber.innerHTML += `<small>(${pure.length})</small>`;

      pure.forEach((idx) => {
        const block = document.createElement("div");
        block.className = "index-block";

        const titleDiv = document.createElement("div");
        titleDiv.className = "index-title";
        let indicator = "";
        if (idx.constraint_type == "UNIQUE") {
          indicator = "(uniq constraint)";
        }
        titleDiv.innerHTML = `${idx.name}${indicator ?? ""} ${
          idx.comment
            ? `<span class="comment-icon" style="cursor:help" title="${idx.comment}"></span>`
            : ""
        }`;
        block.appendChild(titleDiv);
        //
        block.insertAdjacentHTML(
          "beforeend",
          extractIndexColumns(idx.definition)
        );

        indexContainer.appendChild(block);
      });
    } else {
      indexContainer.textContent = "No indexes found (out of PK or constraints).";
    }

    if (uniqueOrExclude.length) {
      const uniqueNumber = document.getElementById("uniqueNumber");

      uniqueNumber.innerHTML += `<small>(${uniqueOrExclude.length})</small>`;

      uniqueOrExclude.forEach((idx) => {
        const block = document.createElement("div");
        block.className = "index-block";

        const titleDiv = document.createElement("div");
        titleDiv.className = "index-title";

        const esc = (s) =>
          String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

        if (idx.comment) {
          titleDiv.innerHTML = `
    ${esc(idx.name)} (${esc(idx.constraint_type)})
    <span class="comment-icon" style="cursor:help" title="${esc(
      idx.comment
    )}"></span>
  `;
        } else {
          titleDiv.innerHTML = `
    ${esc(idx.name)} (${esc(idx.constraint_type)})
  `;
        }
        block.appendChild(titleDiv);
        //
        block.insertAdjacentHTML(
          "beforeend",
          extractIndexColumns(idx.definition)
        );

        uniqueContainer.appendChild(block);
      });
    } else {
      uniqueContainer.textContent = "No other constraints";
    }

    // 🔧 Helper pour extraire les colonnes de l'index
    function extractIndexColumns(def) {
      const match = def.match(/\(([^)]+)\)/);
      const cols = match ? match[1].split(",").map((c) => c.trim()) : [];
      return `${cols.map((col) => `${col}`).join("<br/>")}`;
    }
  } else {
    console.error("Error on load :", result.error);
    showError("Error on loading. Details unavailable.Check your DB connection");
  }

  // après que le tableau soit rempli :
  enableTableSorting("tableOfTableColumns");
});


