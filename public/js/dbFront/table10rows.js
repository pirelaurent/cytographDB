"use strict";

// cannot share data with main, so dbName is in the params

import { getCommentIcon, showInfo } from "../ui/dialog.js";
import {
  bandeauMarkdown,
  setEventMarkdown,

} from "../util/markdown.js";
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

    //console.log(JSON.stringify(data));//PLA
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
}


/*
 get details on a table 
*/
async function getTableData10rows(tableName) {
  try {
    const response = await fetch(`/table10rows/${tableName}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
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

const currentDBName = params.get("currentDBName");
let infoWarning = "";
if (currentDBName == "null") infoWarning = "is not available: no db connected";

let whereTitle = document.getElementById("whereTitle");

whereTitle.innerHTML = `${tableName} ${infoWarning}`;
document.title = `table ${tableName}`;

// call full info from DB and work once loaded

await renderTableInfo(tableName);



/*
  generate result in html 
*/

async function renderTableInfo(tableName) {
  try {
    // Récupère les métadonnées de la table
    const result = await getTableData(tableName);
    if (!result.success) throw new Error("Failed to get table data");

    const data = result.data;

    if (data.comment) {
      const icon = getCommentIcon(document, data.comment);
      whereTitle.appendChild(icon);
    }

    // Récupère les 10 premières lignes
    const rowsResult = await getTableData10rows(tableName);


    if (!rowsResult.success) {
      console.log("Failed to get table rows");
      throw new Error("Failed to get table rows");
    }
    const rows10 = rowsResult.data;
    if (rows10.length === 0) { showInfo("Table is empty, no rows to show",document); return; }



    // Référence du tbody
    const colBody = document.getElementById("columnsTable");
    colBody.innerHTML = "";

    const columnNumber = document.getElementById("columnNumber");
    columnNumber.innerHTML += `<small>(${data.columns.length})</small>`;

    const sectionHeader = columnNumber.closest(".section-header");
    const markdown = bandeauMarkdown(document, "forColTable");
    sectionHeader.appendChild(markdown);

    // Création des lignes du tableau
    data.columns.forEach((col) => {
      const tr = document.createElement("tr");
      const hasComment = !!col.comment;

      const columnCell = document.createElement("td");
      columnCell.textContent = col.column;
      if (hasComment) {
        const icon = getCommentIcon(document, col.comment);
        columnCell.appendChild(icon);
      }

      const typeCell = document.createElement("td");
      typeCell.textContent = simplifyType(col.type);

      const nullableCell = document.createElement("td");
      nullableCell.textContent = col.nullable === "NO" ? "●" : "○";

      tr.appendChild(columnCell);
      tr.appendChild(typeCell);
      tr.appendChild(nullableCell);
      if (col.nullable === "YES") tr.classList.add("nullable");

      // Ajoute 10 cellules vides (pour futur affichage des 10 lignes)
      let tdx;
      for (let i = 0; i < 10; i++) {
        tdx = document.createElement("td");
        tdx.textContent = rows10[i][col.column];
        tr.appendChild(tdx);
      }

      colBody.appendChild(tr);
    });

    setEventMarkdown(document, "tableOfTableColumns", tableName, "forColTable");
    enableTableSorting("tableOfTableColumns");
  } catch (error) {
    console.error("Error rendering table info:", error);
  }
}





// reduc column size 
function simplifyType(aType) {
  let newType = aType.replace("character varying", "char");
  newType = newType.replace("integer", "int");
  newType = newType.replace("timestamp without time zone", "tstamp");
  return newType;
}


