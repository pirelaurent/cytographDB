/*
 generated html here 
*/
"use strict";
import {
  getCy,
} from "../graph/cytoscapeCore.js"



export function sendNodeListToHtml(){
    let nodes;
  // permimeter
  nodes = getCy().nodes(":selected:visible");
    if (nodes.length === 0) nodes = getCy().nodes(":visible");
  if (nodes.length == 0) {
    showAlert("no nodes to list in current perimeter. <br/> Check your selection. ");
    return;
  }

// helpers
function zeroBlank(val){ return val !== 0 ? String(val) : "-"; }
function rowValuesFromNode(node) {
  return [
    // remove the stars from lable
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
  th, td { padding: 5px 10px; border: 1px solid #ccc; }
  td.num { text-align: center; }
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
const closeBtn = doc.createElement("button");
closeBtn.className = "close-btn";
closeBtn.title = "Close";
closeBtn.textContent = "x";
closeBtn.addEventListener("click", () => win.close());
h2.appendChild(closeBtn);
h2.appendChild(doc.createTextNode(` ${sortedNodes.length} nodes in current perimeter`));
body.appendChild(h2);

// table
const table = doc.createElement("table");
table.id = "myTable";
const thead = doc.createElement("thead");
const thr = doc.createElement("tr");
["Table","Cols","Index","FK","Trig"].forEach(h => {
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
    if (idx === 0) td.className = "num"; // ton code mettait class="num" partout; garde ou adapte
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
  ths.forEach(h => h.classList.remove("sort-asc","sort-desc"));
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
      const cmp = aText.localeCompare(bText, undefined, {numeric:true, sensitivity:"base"});
      return isAsc ? cmp : -cmp;
    }
  });

  rows.forEach(r => tbodyEl.appendChild(r));
}

const numericCols = [1,2,3,4];
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
export function sendEdgeListToHtml() {
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
  //console.log(outputLines);//PLA
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
