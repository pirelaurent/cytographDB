"use strict";

// cannot share data with main, so dbName is in the params

import { showError, getCommentIcon } from "../ui/dialog.js";
import {
  bandeauMarkdown,
  setEventMarkdown,
  outputMarkdown,
} from "../util/markdown.js";
import { enableTableSorting } from "../util/sortTable.js";
import { actionMap, actionTitle } from "../util/common.js";
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
Start of specific <script src =  from table.html.
 in line code at page loading 
 use url to give table name in html created
*/

const params = new URLSearchParams(window.location.search);
const tableName = params.get("name");

//reused var for markdown

let colBody, markdown, sectionHeader;

const currentDBName = params.get("currentDBName");
let infoWarning = "";
if (currentDBName == "null") infoWarning = "is not available: no db connected";

let whereTitle = document.getElementById("whereTitle");

whereTitle.innerHTML = `${tableName} ${infoWarning}`;
document.title = `table ${tableName}`;

// call full info from DB and work once loaded
getTableData(tableName).then((result) => {
  if (result.success) {
    const data = result.data;
    if (data.comment) {
      const icon = getCommentIcon(document, data.comment);
      whereTitle.appendChild(icon);
    }

    /*
    list of columns of table
    */
    colBody = document.getElementById("columnsTable");
    colBody.innerHTML = "";

    const columnNumber = document.getElementById("columnNumber");
    columnNumber.innerHTML += `<small>(${data.columns.length})</small>`;
    // add markdown in same div
     sectionHeader = columnNumber.closest(".section-header");

    let actions = sectionHeader.querySelector(".section-actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "section-actions";
      sectionHeader.appendChild(actions);
    }

     markdown = bandeauMarkdown(document, "forColTable");
    actions.appendChild(markdown);


    /*
     add local interceptor 
    */
    const show10rows = document.getElementById("show10rows");

    show10rows.addEventListener("click", () => {
      window.open(
        `/table10rows.html?name=${tableName}&currentDBName=${currentDBName}`,
        `TableDetails10rows_${tableName}`
      );
    });


    //columns vertically 
    data.columns.forEach((col) => {
      const tr = document.createElement("tr");
      const hasComment = !!col.comment;

      // Créer manuellement le contenu de la cellule pour insérer l’icône
      const columnCell = document.createElement("td");
      //see line product

      columnCell.textContent = col.column;
      if (hasComment) {
        // Icône
        const icon = getCommentIcon(document, col.comment);
        columnCell.appendChild(icon);
      }

      // Créer les autres cellules
      const typeCell = document.createElement("td");
      typeCell.textContent = col.type;

      const nullableCell = document.createElement("td");

      nullableCell.textContent = col.nullable === "NO" ? "●" : "○"; // from DB YES/NO

      // 10 rows 


      // Ajouter toutes les cellules à la ligne
      tr.appendChild(columnCell);
      tr.appendChild(typeCell);
      tr.appendChild(nullableCell);
      if (col.nullable === "YES") tr.classList.add("nullable");

      // Ajouter la ligne au tableau
      colBody.appendChild(tr);
    });

    setEventMarkdown(document, "tableOfTableColumns", tableName, "forColTable");
    // allow sort
    enableTableSorting("tableOfTableColumns");
    /*

Primary key 

*/
    colBody = document.getElementById("columnsOfPk");
    colBody.innerHTML = "";
    const pkh3 = document.getElementById("primaryKey");
    // add markdown in same div
    sectionHeader = pkh3.closest(".section-header");
    markdown = bandeauMarkdown(document, "forPk");
    sectionHeader.appendChild(markdown);
    setEventMarkdown(document, "tableOfPk", "pk of " + tableName, "forPk");
    if (
      data?.primaryKey?.name &&
      Array.isArray(data.primaryKey.columns) &&
      data.primaryKey.columns.length > 0
    ) {
      const { name, comment, columns } = data.primaryKey;

      // Première ligne
      const tr0 = document.createElement("tr");
      colBody.appendChild(tr0);

      // Nom de la PK en tête de groupe de lignes
      const tdName = document.createElement("td");
      tdName.textContent = name;
      if (comment) tdName.title = comment;
      tr0.appendChild(tdName);

      // Première colonne
      const tdCol0 = document.createElement("td");
      tdCol0.textContent = columns[0];
      tr0.appendChild(tdCol0);

      // Colonnes suivantes
      for (let i = 1; i < columns.length; i++) {
        const tr = document.createElement("tr");
        // don't repeat the pk name
        const tdName = document.createElement("td");
        tr.appendChild(tdName);
        const tdCol = document.createElement("td");
        tdCol.textContent = columns[i];
        tr.appendChild(tdCol);
        colBody.appendChild(tr);
      }
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

      sectionHeader = fkNumber.closest(".section-header");
      markdown = bandeauMarkdown(document, "forFK");
      sectionHeader.appendChild(markdown);

      //specific event for FK in markdown
      document
        .getElementById("forFKmdCopy")
        ?.addEventListener("click", async () =>
          outputMarkdown(
            {
              download: false,
              copyToClipboard: true,
            },
            fkToMd(tableName, data.foreignKeys)
          )
        );

      document
        .getElementById("forFKmdDownload")
        ?.addEventListener("click", async () =>
          outputMarkdown(
            {
              download: true,
              copyToClipboard: false,
            },
            fkToMd(tableName, data.foreignKeys)
          )
        );

      data.foreignKeys.forEach((fk) => {
        // if no action, no output

        const upd = actionMap[fk.on_update] || "";
        const updTitle = [fk.on_update] || "";
        const del = actionMap[fk.on_delete] || "";
        const delTitle = actionTitle[fk.on_delete] || "";

        let allUpDelInfo = "";
        if (upd)
          allUpDelInfo += `<br/><span title=${updTitle} >ON UPDATE: <code>${upd}</code></span>`;
        if (del)
          allUpDelInfo += `<br/><span titla =${delTitle}>ON DELETE: <code>${del}</code></span>`;

        const block = makeFkBlock(fk, allUpDelInfo);
        frag.appendChild(block);
      });

      fkDiv.appendChild(frag);
    } else {
      fkDiv.textContent = "No foreign keys.";
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
      smallSrc.textContent = fk.all_source_not_null ? " ●" : " ○"; // ` (${"NULLABLE"})`; // "●" : "○"; on FK list

      body.append(strongSrc);
      body.append(smallSrc);
      body.append(document.createTextNode(" → "));

      const strongTgt = document.createElement("strong");
      strongTgt.textContent = fk.target_table;
      body.append(strongTgt);

      const smallTgt = document.createElement("small");
      smallTgt.innerHTML = ` <code>(${fk.is_target_unique ? "PK" : "NOT UNIQUE"
        })</code>`;
      body.append(smallTgt);

      // Infos ON UPDATE/DELETE (si c’est déjà du HTML sûr)
      if (allUpDelInfo) {
        const updel = document.createElement("small");
        updel.innerHTML = `<code> ${allUpDelInfo}</code>`;
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

    /*
   🔍 Indexes 
   Avoid to repeat PK in index 
    Le test par nom suffit souvent en PostgreSQL (la PK et son index portent le même nom).

Le test par colonnes + UNIQUE couvre les cas où les noms diffèrent mais l’index est exactement celui de la PK (ou un équivalent recréé).

Si tu as un index supplémentaire sur le même ensemble de colonnes que la PK mais non unique, il ne sera pas filtré (c’est volontaire : ce n’est pas la PK).
    */

    const indexContainer = document.getElementById("indexesContainer");

    indexContainer.innerHTML = ""; // nettoie

    const indexNumber = document.getElementById("indexNumber");
    sectionHeader = indexNumber.closest(".section-header");
    markdown = bandeauMarkdown(document, "forIndex");
    sectionHeader.appendChild(markdown);

    // Partitionning
    const primary = [];
    const uniqueOrExclude = [];
    const pure = [];

    for (const idx of data.indexes) {
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

    //specific event for FK in markdown
    document
      .getElementById("forIndexmdCopy")
      ?.addEventListener("click", async () =>
        outputMarkdown(
          {
            download: false,
            copyToClipboard: true,
          },
          indexToMd(tableName, primary, uniqueOrExclude, pure)
        )
      );

    document
      .getElementById("forIndexmdDownload")
      ?.addEventListener("click", async () =>
        outputMarkdown(
          {
            download: true,
            copyToClipboard: false,
          },
          indexToMd(tableName, primary, uniqueOrExclude, pure)
        )
      );

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
        titleDiv.innerHTML = `${idx.name}${indicator ?? ""} ${idx.comment
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
      indexContainer.textContent = "No indexes (out of PK or constraints).";
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
  } else {
    console.error("Error on load :", result.error);
    showError("Error on loading. Details unavailable.Check your DB connection");
  }
});

/*
 helper
 As FK are too large to be put in an MD table , we usesimple md text to output 
*/

function fkToMd(tableName, fkArray) {
  let parts = [];
  parts.push(`# foreign keys of ${tableName}\n`);

  fkArray.forEach((fk) => {
    parts.push(`\n## ${fk.constraint_name}\n`);
    if (fk.comment) parts.push(`(*${fk.comment}*)`);
    let smallSrc = fk.all_source_not_null ? "●" : "○"; // ` (${"NULLABLE"})`; // "●" : "○"; on FK list
    let infoUnique = fk.is_target_unique ? "(PK)" : "(NOT UNIQUE)";
    parts.push(
      `**${fk.source_table}** ${smallSrc}  →  **${fk.target_table}** ${infoUnique}  `
    );

    const upd = actionMap[fk.on_update] || "";
    const del = actionMap[fk.on_delete] || "";

    if (upd) parts.push(`*on update ${upd}*`);
    if (del) parts.push(`*on delete ${del}*`);

    fk.column_mappings.forEach((col) => {
      parts.push(`${col.source_column} → ${col.target_column}`);
    });
  });

  return parts.join("\n");
}

// 🔧 Helper pour extraire les colonnes de l'index
function extractIndexColumns(def) {
  const match = def.match(/\(([^)]+)\)/);
  const cols = match ? match[1].split(",").map((c) => c.trim()) : [];
  return `${cols.map((col) => `${col}`).join("<br/>")}`;
}

/*
 helper to create MD equivalent fod index 
*/

function indexToMd(tableName, primary, uniqueOrExclude, pure) {
  let parts = [];
  parts.push(`# ${tableName}`);
  parts.push("## foreign keys");

  if (pure.length) {
    pure.forEach((idx) => {
      // prepare
      let indicator = "";
      if (idx.constraint_type == "UNIQUE") {
        indicator = "(uniq constraint)";
      }
      parts.push(""); //empty line
      parts.push(`**${idx.name}** ${indicator ?? ""}`);
      if (idx.comment) {
        parts.push(`(*${idx.comment}*)`);
      }
      parts.push(extractIndexColumns(idx.definition));
    });
  } else {
    parts.push("No indexes (out of PK or constraints).");
  }
  /*  
 other catégories
*/

  parts.push("## constraints");
  if (uniqueOrExclude.length) {
    uniqueOrExclude.forEach((idx) => {
      parts.push(""); //empty line
      parts.push(`
    **${esc(idx.name)}** (${idx.constraint_type})`);

      if (idx.comment) {
        parts.push(`(*${idx.comment}*)`);
      }
      parts.push(`${extractIndexColumns(idx.definition)}`);
    });
  } else {
    parts.push();
    parts.push("*No other constraints*");
  }
  return parts.join("\n");
}
