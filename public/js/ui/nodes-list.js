import {setEventMarkdown,createHeaderMarkdown } from "../util/markdown.js";
import { getLocalDBName } from "../dbFront/tables.js";
import {enableTableSorting} from  "../util/sortTable.js";

console.log("Pop-up JS loaded 🚀");

const cy = window.opener?.getCy();
if (!cy) {
    alert("Unable to access the graph from the main window.");
    throw new Error("No cy in opener");
}

const dbName = document.body.dataset.dbName || "";
const scope = new URLSearchParams(window.location.search).get("scope");

// 🌟 1) HEADER MARKDOWN
  const header = createHeaderMarkdown(document);
  // par exemple : l’insérer juste après le <h2>
  const h2 = document.querySelector("h2");
  if (h2 && header) {
    h2.insertAdjacentElement("afterend", header);
  } else if (header) {
    document.body.prepend(header);
  }



// Sélection des nodes visibles ou sélectionnés
let nodes = scope === "selected"
    ? cy.nodes(":selected:visible")
    : cy.nodes(":visible");

// Fonction utilitaire
function zeroBlank(v) {
    return v !== 0 ? String(v) : "-";
}

// Remplissage du tableau
const tbody = document.querySelector("#tableNodes tbody");

nodes.forEach(node => {
    const indexes = node.data("indexes") || [];

    const realIndexes = indexes.filter(ix => {
        const t = (ix.constraint_type || "").toUpperCase();
        const isPk = t === "PRIMARY KEY" || ix.is_primary;
        const isUnique =
            t === "UNIQUE" ||
            ix.is_unique === true ||
            /create\s+unique\s+index/i.test(ix.definition || "");
        return !isPk && !isUnique;
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td><input type="checkbox" name="nodeIds"
               value="${node.id()}"
               ${node.selected() ? "checked" : ""}></td>

    <td class="table-label"
        data-table-id="${node.id()}"
        data-label="${node.data("label").replace(/\*/g, "")}">
        ${node.data("label").replace(/\*/g, "")}
    </td>

    <td class="num">${zeroBlank(node.data("columns")?.length || 0)}</td>
    <td class="num">${zeroBlank(realIndexes.length)}</td>
    <td class="num">${zeroBlank(node.data("foreignKeys")?.length || 0)}</td>
    <td class="num">${zeroBlank(node.incomers("edge")?.length || 0)}</td>

    <td class="num trigger-cell"
        data-table-name="${node.data("label").replace(/\*/g, "")}"
        style="cursor:${node.data("triggers")?.length > 0 ? "pointer" : "default"}">
        ${zeroBlank(node.data("triggers")?.length || 0)}
    </td>
  `;
    tbody.appendChild(tr);
});


// --- Action clic sur "Table" ---
document.querySelectorAll("td.table-label").forEach(td => {
    td.addEventListener("click", () => {
        const tableId = td.dataset.tableId;
        const url = `/table.html?name=${encodeURIComponent(tableId)}&currentDBName=${encodeURIComponent(dbName)}`;

        let w = window.open("", `TableDetails_${tableId}`);
        if (w) {
            try {
                if (w.location.href !== url) w.location.href = url;
                w.focus();
            } catch {
                w = window.open(url, `TableDetails_${tableId}`);
                if (w) w.focus();
            }
        }
    });
});

// --- Action clic sur triggers ---
document.querySelectorAll("td.trigger-cell").forEach(td => {
    td.addEventListener("click", () => {
        if (td.textContent.trim() === "-" || td.textContent.trim() === "0") return;

        const tableName = td.dataset.tableName;
        const url = `/triggers.html?table=${encodeURIComponent(tableName)}`;

        window.open(url, `Triggers_${tableName}`);
    });
});

// --- Appliquer & fermer ---
document.getElementById("btnApplyAndClose").addEventListener("click", () => {
    const ids = Array.from(
        document.querySelectorAll('input[name="nodeIds"]:checked')
    ).map(cb => cb.value);

    if (window.opener && typeof window.opener.applySelectionFromPopup === "function") {
        window.opener.applySelectionFromPopup(ids);
    }
    window.close();
});

// set markdown
    const db = getLocalDBName();
    let title = db? "nodes list extract from "+db:"nodes list extract"
    
    setEventMarkdown(document,"tableNodes",title);  // the id in nodes-list.ejs

const table = document.getElementById("tableNodes");

enableTableSorting("tableNodes", document, {
  columns:[1, 2, 3, 4, 5, 6]
});


document.querySelectorAll("#tableNodes th").forEach((th, i) => {
    if (i === 0) addInvertToggle(table, 0, document);
});


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
    img.src = "./img/toggle.png"; // ⇐ ton image
    img.alt = ""; // décoratif (aria-label sur le bouton)
    img.width = 20; // ajuste la taille
    img.height = 20;
    img.draggable = false;

    btn.appendChild(img);

    // Inversion sur clic (sans déclencher le tri)
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tbody = table.tBodies[0];
        const selector = `tr td:nth-child(${colIndex + 1
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