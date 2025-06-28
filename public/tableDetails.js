"use strict";
// cannot share data with main, so dbName is in the params

/*
 get details on a table 
*/
async function getTableData(tableName) {
  try {
    const response = await fetch(`/table/${tableName}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
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
if (!currentDBName) currentDBName = "no DB connected";

document.getElementById(
  "title"
).textContent = `Structure of table:${tableName}`;

getTableData(tableName).then((result) => {
  if (result.success) {
    const data = result.data;
    // Handle Columns
    const colBody = document.getElementById("columnsTable");
    colBody.innerHTML = "";

    data.columns.forEach((col) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
              <td>${col.column}</td>
              <td>${col.type}</td>
              <td>${col.nullable}</td>
            `;
      colBody.appendChild(tr);
    });

    // Display Primary Key
    const pkContainer = document.getElementById("primaryKeyContainer");

    if (data.primaryKey.name && data.primaryKey.columns.length > 0) {
      const pkDiv = document.createElement("div");
      pkDiv.className = "pk-block";
      pkDiv.innerHTML = `
             <div class="fk-title">${data.primaryKey.name}</div>
              <ul>
                ${data.primaryKey.columns
                  .map((column) => `<li>${column}</li>`)
                  .join("")}
              </ul>
            `;
      pkContainer.appendChild(pkDiv);
    } else {
      pkContainer.innerHTML = "<p>No primary key defined.</p>";
    }

    //  foreign keys  X-A-Y   FK:  A-AX  A-AY
    //   A*B*	plusieurs A pour plusieurs B	A.id et B.id non uniques
    //   AB*	un A pour plusieurs B	AX: NOT NULL, AY: NOT NULL, A.id unique, B.id non unique
    //   A*B	plusieurs A pour un B	AX: NOT NULL, AY: NOT NULL, A.id non unique, B.id unique
    //   AB	1..1 vers 1..1	AX: NOT NULL, AY: NOT NULL, A.id et B.id sont uniques (PK ou UNIQUE)

    const fkDiv = document.getElementById("foreignKeysContainer");
fkDiv.innerHTML = ""; // Clear any existing content

if (data.foreignKeys && data.foreignKeys.length > 0) {
  data.foreignKeys.forEach((fk) => {
/* prepare les on delete
      WHEN 'a' THEN 'NO ACTION'
      WHEN 'r' THEN 'RESTRICT'
      WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL'
      WHEN 'd' THEN 'SET DEFAULT'
*/
let allUpDelInfo="";
let updateInfo = "";
 switch (fk.on_update){
  // no info displayed if default
  case 'a': updateInfo = "NO ACTION";break
  case 'r': updateInfo = "RESTRICT";break
  case 'c': updateInfo = "CASCADE";break
  case 'n': updateInfo = "SET NULL";break
  case 'r': updateInfo = "SET DEFAULT";break
 }
 
 if (updateInfo != ""){
  allUpDelInfo = `    <br/><span>ON UPDATE: <code>${updateInfo}</code></span>`
 }

 let deleteInfo ="";
 switch (fk.on_delete){
    // no info displayed if default
  case 'a': deleteInfo = "NO ACTION";break
  case 'r': deleteInfo = "RESTRICT";break
  case 'c': deleteInfo = "CASCADE";break
  case 'n': deleteInfo = "SET NULL";break
  case 'r': deleteInfo = "SET DEFAULT";break
 }

 if (deleteInfo != ""){
  allUpDelInfo += `      <br/><span>ON DELETE: <code>${deleteInfo}</code></span>`
 }




    const div = document.createElement("div");
    div.className = "fk-block";
    div.innerHTML = `
      <div class="fk-title">${fk.constraint_name}</div>
      Source: <strong>${fk.source_table}</strong>
      <small> (${fk.all_source_not_null ? "NOT NULL" : "NULLABLE"})</small><br/>
      
      Target: <strong>${fk.target_table}</strong>
      <small> (${fk.is_target_unique ? "UNIQUE/PK" : "NOT UNIQUE"})</small><br/>
      
      ${allUpDelInfo}

      <ul>
        ${fk.column_mappings
          .map(
            (col) => `<li>${col.source_column} → ${col.target_column}</li>`
          )
          .join("")}
      </ul>
    `;
    fkDiv.append(div);
  });
}


    // 🔍 Indexes
// 🔍 Indexes
const indexContainer = document.createElement("div");
indexContainer.className = "third"; // nouvelle colonne

const header = document.createElement("h2");
header.textContent = "Indexes";
indexContainer.appendChild(header);

if (data.indexes && data.indexes.length > 0) {
  data.indexes.forEach(idx => {
    const div = document.createElement("div");
    div.className = "index-block";
    div.innerHTML = `
      <div class="index-title">${idx.name}</div>
      ${extractIndexColumns(idx.definition)}
    `;
    indexContainer.appendChild(div);
  });
} else {
  indexContainer.innerHTML += "<p>No indexes found.</p>";
}

document.getElementById("tableInfo").appendChild(indexContainer);

// 🔧 Helper pour extraire les colonnes de l'index
function extractIndexColumns(def) {
  const match = def.match(/\(([^)]+)\)/);
  const cols = match ? match[1].split(",").map(c => c.trim()) : [];
  return `<ul>${cols.map(col => `<li>${col}</li>`).join("")}</ul>`;
}

  } else {
    console.error("Error on load :", result.error);
    alert("Error on loading. Details unavailable.Check your DB connection");
  }
});
