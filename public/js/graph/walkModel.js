import {
  showAlert,
  showMultiChoiceDialog,
  showWaitCursor,
  hideWaitCursor,
} from "../ui/dialog.js";


import {
  getCy,
} from "../graph/cytoscapeCore.js";


import {
  restoreProportionalSize,
} from "../core/nodeOps.js"


import { perimeterForEdgesAction, perimeterForNodesAction } from "../core/perimeter.js";


import { setEventMarkdown, bandeauMarkdown } from "../util/markdown.js";
import { enableTableSorting } from "../util/sortTable.js";
import { createIconButton } from "../ui/dialog.js";
import { NativeCategories } from "../util/common.js";


/*
 find path . adjust value when calling
*/
export function findLongOutgoingPaths(cy, minLength = 2, maxDepth = 15) {
// internal func
function isSubPath(smaller, larger) {
  for (let i = 0; i <= larger.length - smaller.length; i++) {
    let match = true;
    for (let j = 0; j < smaller.length; j++) {
      if (smaller[j] !== larger[i + j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
//---------
  const paths = [];
  const successfulStarts = new Set(); // to remember which nodes are true starters
  let iterationCount = 0;
  const maxIterations = 10000;

  function dfs(path, visited, depth, startId) {
    if (iterationCount >= maxIterations) {
      return;
    }
    iterationCount++;
    if (depth > maxDepth) return;

    const last = path[path.length - 1];
    const nextEdges = last.outgoers("edge").filter(":visible");
    const nextNodes = nextEdges.targets().filter(":visible");

    nextNodes.forEach((next) => {
      const nextId = next.id();

      if (!visited.has(nextId)) {
        path.push(next);
        visited.add(nextId);

        if (path.length > minLength) {
          const newPathIds = path.map((n) => n.id());

          // Check if this new path is a true subpath of any existing one
          let isEmbedded = false;
          for (let i = paths.length - 1; i >= 0; i--) {
            const existingPathIds = paths[i].map((n) => n.id());

            if (isSubPath(newPathIds, existingPathIds)) {
              isEmbedded = true;
              break; // current is contained — discard it
            }

            if (isSubPath(existingPathIds, newPathIds)) {
              paths.splice(i, 1); // existing is contained — remove it
            }
          }

          if (!isEmbedded) {
            paths.push([...path]);
            successfulStarts.add(startId);
          }
        }

        dfs(path, visited, depth + 1, startId);

        // backtrack
        visited.delete(nextId);
        path.pop();
      }
    });
  }

  // limit exploration

  let startNodes = getCy().nodes(":visible:selected");
  // no selected : is subgraph small ?
  if (startNodes.length === 0) {
    startNodes = getCy().nodes(":visible");

    if (startNodes.length === 0) {
      showAlert("no nodes to explore");
      return;
    }
    if (startNodes.length > 30) {
      showAlert(
        `Too many nodes (${startNodes.length}) as starting points. Think about to reduce perimeter by selection next time `
      );
    }
  }
  let msgIteration = "";

  showWaitCursor().then(() => {
    try {
      // 1) calcul
      for (const start of startNodes) {
        dfs([start], new Set([start.id()]), 1, start.id());
        // si c’est TRÈS long, on peut céder la main périodiquement :
        // await new Promise(r => setTimeout(r));
      }

      // 2) post-traitement APRÈS calcul

      if (iterationCount >= maxIterations) {
        msgIteration = `<br/>limited iterations ${maxIterations} were reached. <br/>(Partial results)<br/>`;
      }

      const elementsToShow = getCy().collection();
      paths.forEach((path) => {
        for (let i = 0; i < path.length - 1; i++) {
          const source = path[i];
          const target = path[i + 1];
          const edge = source.edgesTo(target);
          elementsToShow.merge(source).merge(target).merge(edge);
        }
      });

      if (elementsToShow.length === 0) {
        showAlert(`No long path (>${minLength}) from the starting nodes.`);
        return;
      }

      // Clear all previous selections and fade everything
      getCy().elements().unselect().addClass("faded");

      // Highlight the actual path elements
      elementsToShow.removeClass("faded").select();

      // Make sure only *starting* nodes are specially marked
      getCy().nodes().removeClass("start-node"); // optional visual marker
      getCy()
        .nodes()
        .filter((n) => successfulStarts.has(n.id()))
        .addClass("start-node")
        .select();

      let okMess = `${paths.length} long path(s) `;
      let okLimit = "";
      let limit = paths.length;
      if (limit > 1000) {
        limit = 1000;
        okLimit = "(limited to 1000)";
      }
      if (paths.length < 50) {
        showLongPathList(limit, paths);
      } else
        showMultiChoiceDialog(
          okMess,
          `👁️ show the list ? ${okLimit}  ${msgIteration}`,
          [
            {
              label: "✅ Yes",
              onClick: () => showLongPathList(limit, paths),
            },
            {
              label: "❌ No",
              onClick: () => { }, // rien
            },
          ]
        );
    } finally {
      hideWaitCursor();
    }
  });
}

/*
 dynamic html to restitute long path 
*/

function showLongPathList(limit, paths) {
  // Ouvre la fenêtre et récupère le document
  const win = window.open("", "LongPathListWindow");
  const doc = win.document;

  // HEAD
  doc.title = "Long Paths";

  const meta = doc.createElement("meta");
  meta.setAttribute("charset", "UTF-8");
  doc.head.appendChild(meta);

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/style.css";
  doc.head.appendChild(link);

  const link2 = doc.createElement("link");
  link2.rel = "stylesheet";
  link2.href = "/css/table.css";
  doc.head.appendChild(link2);
  // BODY
  const body = doc.body;
  body.className = "doc-table";
  body.textContent = "";

  // --- Titre + bouton de fermeture
  const h2 = doc.createElement("h2");
  const closeImg = createIconButton(doc, {
    src: "img/closePage.png",
    alt: "Return",
    title: "Close",
    onClick: () => win.close(),
  });
  h2.appendChild(closeImg);
  h2.appendChild(doc.createTextNode(" Long path list"));
  body.appendChild(h2);

  const band = bandeauMarkdown(doc);
  body.appendChild(band);

  // --- Table
  const table = doc.createElement("table");
  table.id = "longPathTable";

  const thead = doc.createElement("thead");
  const headRow = doc.createElement("tr");

  const thNum = doc.createElement("th");
  thNum.textContent = "N°";
  headRow.appendChild(thNum);

  const thPath = doc.createElement("th");
  thPath.textContent = "Long path";
  headRow.appendChild(thPath);

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = doc.createElement("tbody");

  let prevIds = null;
  for (let idx = 0; idx < limit; idx++) {
    const path = paths[idx];
    const ids = path.map((n) => n.id());

    // longueur du préfixe commun avec le chemin précédent
    let commonLen = 0;
    if (prevIds) {
      const len = Math.min(ids.length, prevIds.length);
      while (commonLen < len && ids[commonLen] === prevIds[commonLen]) {
        commonLen++;
      }
    }

    const tr = doc.createElement("tr");

    const tdIdx = doc.createElement("td");
    tdIdx.textContent = idx + 1;
    tr.appendChild(tdIdx);

    const tdPath = doc.createElement("td");
    tdPath.className = "path";
    ids.forEach((id, i) => {
      if (i > 0) {
        const arrow = doc.createElement("span");
        arrow.className = i < commonLen ? "prefix" : "rest";
        arrow.textContent = " → ";
        tdPath.appendChild(arrow);
      }
      const span = doc.createElement("span");
      span.className = i < commonLen ? "prefix" : "rest";
      span.textContent = id;
      tdPath.appendChild(span);
    });

    tr.appendChild(tdPath);
    tbody.appendChild(tr);

    prevIds = ids;
  }

  table.appendChild(tbody);
  body.appendChild(table);

  // --- events Markdown
  setEventMarkdown(doc, "longPathTable", "Long path list");
  enableTableSorting("longPathTable", doc);
}

/*
 remove (dry) associations (2) nodes and create new direct links 
*/
export function simplifyAssociations() {
  let nodes = perimeterForNodesAction();
  if (nodes.length == 0) {
    showAlert("no nodes to check.");
    return;
  }

  let done = 0;
  nodes.forEach(function (node) {
    let outEdges = node.outgoers("edge");

    if (!node.hasClass(NativeCategories.ASSOCIATION)) return;


    const elementsToSave = node.closedNeighborhood(); // le nœud + ses edges
    let nodeBackup = elementsToSave.jsons(); // copie profonde des data + style + classes
    // nodes involved 
    let targets = outEdges.map((e) => e.target());

    if (targets.length === 2) {
      done += 1;
      let a = targets[0];
      let b = targets[1];

      a.show();
      b.show();
      // double links to allows bi directional circulation 
      createEdge(a, b);
      createEdge(b, a)

      // remove old node and links
      node.connectedEdges().remove();
      node.remove();

      // internal function: add an edge 
      function createEdge(a, b) {
        let newId = `${a.id()} <<-( ${node.id()} )->${b.id()}`;
        // Add the generated edge

        getCy().add({
          group: "edges",
          data: {
            id: newId,
            label: newId,
            source: a.id(),
            target: b.id(),
            generated: true,
            backup: nodeBackup,
            simplified_association: true,
          },
          classes: NativeCategories.SIMPLIFIED,
        });
      }//createEdge


    }
  });
  if (done == 0) showAlert("nothing to transform (association with two targets).");



}

/*
 remove generated edges and recreates association nodes and its two links
 using data stored in generated link
*/

export function restoreAssociations() {
  const visibleEdges = perimeterForEdgesAction();
  const simplifiedEdges = visibleEdges.filter((edge) =>
    edge.hasClass(NativeCategories.SIMPLIFIED)
  );
  if (simplifiedEdges.length === 0) return;

  simplifiedEdges.forEach((edge) => {
    const backup = edge.data("backup");
    if (backup) {
      getCy().add(backup);
    }
    // remove obsolete generated edge
    edge.remove();
  });

  restoreProportionalSize();
}

/*
 used by long path longPathNto1List
*/

function openPkFkJsonInNewTab(jsonArray, aTitle) {
  function toPkfkTable(arr) {
    let htmlPart = `
    <table id ='table-pk-fk'> 
    <thead>
      <tr>
        <th>target table</th>
        <th> target PK</th>
        <th> matching fk  </th>
        <th> from table</th>
      </tr>
     </thead>
      <tbody>`;
    let lastObjTo;
    let lastObjFrom;

    for (const obj of arr) {
      for (const col of obj.columns) {
        let newRoot = obj.to;
        let newFollower = obj.from;
        let separator = "";

        if (obj.to != lastObjTo || obj.from != lastObjFrom) {
          newRoot = `<b>${newRoot}</b>`;
          newFollower = `<b>${newFollower}</b>`;
          separator = "class = 'group-start'";
        } else {
          newRoot = "";
          newFollower = "";
        }

        htmlPart += `
        <tr ${separator}>
         <td>${newRoot}</td> 
         <td>  ${col.target_column} </td>
         <td> ${col.source_column}</td>
         <td>${newFollower}</td>
        </tr>

        `;
        lastObjTo = obj.to;
        lastObjFrom = obj.from;
      }
    }
    htmlPart += `</table>`;

    return htmlPart;
  }
  const pkfkTable = toPkfkTable(jsonArray);

  const win = window.open("", "PkFkWindow");
  const doc = win.document;

  // HEAD

  doc.title = `PkFk propagation `;
  const meta = doc.createElement("meta");
  meta.setAttribute("charset", "UTF-8");
  doc.head.appendChild(meta);

  // styles
  const base = window.location.origin;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = base + "/css/style.css";
  doc.head.appendChild(link);

  const link2 = doc.createElement("link");
  link2.rel = "stylesheet";
  link2.href = base + "/css/table.css";
  doc.head.appendChild(link2);
  // BODY
  const body = doc.body;
  body.className = "doc-table";
  body.textContent = "";

  // Title + close button
  const h2 = doc.createElement("h2");
  const closeImg = createIconButton(doc, {
    src: "img/closePage.png",
    alt: "Return",
    title: "Close",
    onClick: () => win.close(),
  });
  h2.appendChild(closeImg);
  h2.appendChild(
    doc.createTextNode(` Propagation of ${aTitle} Pk`)
  );
  body.appendChild(h2);

  const header = createHeaderMarkdown(doc);
  body.appendChild(header);

  const elt = doc.createElement("div");
  elt.innerHTML = pkfkTable;
  body.appendChild(elt);
  setEventMarkdown(doc, "table-pk-fk", "pk-fk-chains");

}

/*
 experimental 
 try to link pk parts in successive tables 
*/
export function findPkFkChains() {
  // starts from a root node with no foreign key.
  const roots = getCy()
    .nodes(":visible:selected")
    .filter((n) => n.data("foreignKeys").length === 0);

  if (roots.length === 0 || roots.length != 1) {
    showAlert(
      " must start from a unique node of category leaf (no foreignKey)."
    );
    return;
  }

  pushSnapshot();
  // can have selected several, loop on these nodes one per one
  roots.forEach((root) => {
    const { visited: group, trace } = findFunctionalDescendantsCytoscape(root);
    // fk implied in chain
    const traceFkNames = new Set(trace.map((t) => t.fkName).filter(Boolean));
    // nodes implied in chain
    const groupNodes = getCy()
      .nodes()
      .filter((n) => group.has(n.id()));

    getCy().nodes().unselect();
    //Groups multiple style or visibility changes into one batch operation to prevent multiple re-renderings, improving performance.
    getCy().batch(() => {
      groupNodes.show();
      // 3. filter only edges from trace
      const edgesInTrace = groupNodes
        .connectedEdges()
        .filter((e) => traceFkNames.has(e.data("label")));

      // hide all connected edges
      groupNodes.connectedEdges().hide();

      // show interesting ones
      edgesInTrace.show();

      // select nodes (mainly to apply layout)
      groupNodes.select();
    });

    // show those between the chain

    // nothing to show if no follower
    if (getCy().nodes(":selected:visible").length > 1) {
      //auto display
      hideNotSelectedThenDagre();
      openPkFkJsonInNewTab(trace, `${root.id()}`);
    }
  });
}
/**
 * Build relationship edges from a schema definition
 * @param {object} table - Table JSON (your sample)
 * @returns {Array} relationships
 */
export function ownerShipPerimeter(onlyMandatory = true) {
  let cy = getCy();

  let selectedNodes = cy.nodes(":visible:selected");
  if (selectedNodes.length != 1) {
    //selectedNodes = cy.nodes(":visible");
    showAlert("Need a unique starting node to establish its ownership");
    return;
  }

  showWaitCursor();
  const rootId = selectedNodes[0].id();

  /** Build { tableId -> tableJson } from Cytoscape nodes */

  // All Cytoscape nodes (your full schema)
  const schema = buildSchemaFromNodes(cy.nodes());

  // Build full graph once
  const graph = buildOwnershipGraph(schema, { onlyMandatory: onlyMandatory });

  // Build ownership tree **limited to descendants of rootId**
  const tree = buildOwnershipTree(rootId, graph);

  // Show it
  //printTree(tree);
  selectBasedOnTree(tree);
  setClipReport("ownerShip", JSON.stringify(treeToJSON(tree), 0, 2));
  hideWaitCursor();
}
