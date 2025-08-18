"use strict";
// cannot share data with main, so dbName is in the params

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
    //console.log(data);//PLA PLA
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
if (currentDBName == 'null') infoWarning = 'is not available: no db connected'


let whereTitle = document.getElementById(
  "whereTitle"
);

whereTitle.innerHTML = `${tableName} ${infoWarning}`;
document.title = `table ${tableName}`;

getTableData(tableName).then((result) => {

  if (result.success) {
    const data = result.data;
    if (data.comment) {
      whereTitle.title = data.comment;
      const icon = document.createElement("span");
      icon.textContent = " 💬";
      icon.style.cursor = "help"; // facultatif
      whereTitle.appendChild(icon);
    }

    // Handle Columns
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

      if (hasComment) {
        const wrapper = document.createElement("span");
        wrapper.title = col.comment;

        // Texte de la colonne
        const text = document.createTextNode(col.column + " ");
        wrapper.appendChild(text);

        // Icône 💬
        const icon = document.createElement("span");
        icon.textContent = "💬";
        icon.style.cursor = "help";
        wrapper.appendChild(icon);

        columnCell.appendChild(wrapper);
      } else {
        columnCell.textContent = col.column;
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


    /// Display Primary Key
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

        // Ajout du texte et de l'icône 💬
        titleDiv.innerHTML = `
      ${data.primaryKey.name}
      <span style="cursor: help;">💬</span>
    `;
      } else {
        titleDiv.textContent = data.primaryKey.name;
      }

      // Construction de la liste des colonnes
      const ul = document.createElement("ul");
      data.primaryKey.columns.forEach((column) => {
        const li = document.createElement("li");
        li.textContent = column;
        ul.appendChild(li);
      });

      // Assemblage
      pkDiv.appendChild(titleDiv);
      pkDiv.appendChild(ul);
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
    const fkNumber = document.getElementById("fkNumber");

    fkNumber.innerHTML += `<small>(${data.foreignKeys.length})</small>`;


    fkDiv.innerHTML = ""; // Clear any existing content

   if (Array.isArray(data.foreignKeys) && data.foreignKeys.length > 0) {
  const frag = document.createDocumentFragment();

  data.foreignKeys.forEach((fk) => {
    // if no action, no output
   // const actionMap = { a: "NO ACTION", r: "RESTRICT", c: "CASCADE", n: "SET NULL", d: "SET DEFAULT" };
       const actionMap = {  r: "RESTRICT", c: "CASCADE", n: "SET NULL", d: "SET DEFAULT" };
    const upd = actionMap[fk.on_update] || "";
    const del = actionMap[fk.on_delete] || "";

    let allUpDelInfo = "";
    if (upd) allUpDelInfo += `<br/><span>ON UPDATE: <code>${upd}</code></span>`;
    if (del) allUpDelInfo += `<br/><span>ON DELETE: <code>${del}</code></span>`;

    // ← un CADRE par FK
    const block = document.createElement("div");
    block.className = "fk-block";
    block.innerHTML = `
      <div class="fk-title" title="${fk.comment || ''}">
        ${fk.constraint_name}
        ${fk.comment ? '<span style="cursor: help;"> 💬</span>' : ''}
      </div>
      <div>
        Source: <strong>${fk.source_table}</strong>
        <small> (${fk.all_source_not_null ? "NOT NULL" : "NULLABLE"})</small>
      </div>
      <div>
        Target: <strong>${fk.target_table}</strong>
        <small> (${fk.is_target_unique ? "UNIQUE/PK" : "NOT UNIQUE"})</small>
      </div>
      ${allUpDelInfo}
      <ul>
        ${fk.column_mappings.map(col => `<li>${col.source_column} → ${col.target_column}</li>`).join("")}
      </ul>
    `;
    frag.appendChild(block);
  });

  fkDiv.appendChild(frag);
} else {
  fkDiv.textContent = "No foreign keys found.";
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


    const raw = Array.isArray(data.indexes) ? data.indexes : [];

    // (optionnel) dédoublonnage par nom d'index
    const seen = new Set();
    const indexes = raw.filter(i => {
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
      if (t === 'PRIMARY KEY' || idx.is_primary === true) {
        primary.push(idx);
      } else if (t === 'UNIQUE' || t === 'EXCLUDE') {
        uniqueOrExclude.push(idx);
      } else {
        // no constraint type → pure index 
        pure.push(idx);
      }
    }
    // (optionnel) tris
    const byName = arr => arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    byName(primary); byName(uniqueOrExclude); byName(pure);
    // pure index 
    if (pure.length) {
      const indexNumber = document.getElementById("indexNumber");

      indexNumber.innerHTML += `<small>(${pure.length})</small>`;

      pure.forEach(idx => {

        const block = document.createElement("div");
        block.className = "index-block";

        const titleDiv = document.createElement("div");
        titleDiv.className = "index-title";
        let indicator = "";
        if (idx.constraint_type == 'UNIQUE') {
          indicator = '(uniq constraint)';
        }
        if (idx.comment) {
          titleDiv.title = idx.comment;
          titleDiv.innerHTML = `${idx.name} <span style="cursor:help;">💬</span>`;
        } else {
          titleDiv.textContent = idx.name + indicator;
        }

        block.appendChild(titleDiv);
        // 
        block.insertAdjacentHTML("beforeend", extractIndexColumns(idx.definition));

        indexContainer.appendChild(block);
      });
    } else {
      indexContainer.textContent = "No indexes found (out of PK).";
    }


    if (uniqueOrExclude.length) {
      const uniqueNumber = document.getElementById("uniqueNumber");

      uniqueNumber.innerHTML += `<small>(${uniqueOrExclude.length})</small>`;

      uniqueOrExclude.forEach(idx => {

        const block = document.createElement("div");
        block.className = "index-block";

        const titleDiv = document.createElement("div");
        titleDiv.className = "index-title";

        if (idx.comment) {
          titleDiv.title = idx.comment;
          titleDiv.innerHTML = `${idx.name} <span style="cursor:help;">💬</span>`;
        } else {
          titleDiv.textContent = `${idx.name} (${idx.constraint_type})`;
        }

        block.appendChild(titleDiv);
        // 
        block.insertAdjacentHTML("beforeend", extractIndexColumns(idx.definition));

        uniqueContainer.appendChild(block);
      });
    } else {
      uniqueContainer.textContent = "No other constraints";
    }

    // 🔧 Helper pour extraire les colonnes de l'index
    function extractIndexColumns(def) {
      const match = def.match(/\(([^)]+)\)/);
      const cols = match ? match[1].split(",").map(c => c.trim()) : [];
      return `<ul>${cols.map(col => `<li>${col}</li>`).join("")}</ul>`;
    }

  } else {
    console.error("Error on load :", result.error);
    showError("Error on loading. Details unavailable.Check your DB connection");
  }
});
