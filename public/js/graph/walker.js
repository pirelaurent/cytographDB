// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

"use strict";
/*
 this module is responsible for differents walks into the graph 
*/

import {
  showAlert,
  showInfo,
  showMultiChoiceDialog,
  showWaitCursor,
  hideWaitCursor,
} from "../ui/dialog.js";

import { pushSnapshot } from "../graph/snapshots.js";

import {
  getCy,
  restrictToVisible,
  restoreProportionalSize,
  perimeterForNodesAction,
  hideNotSelectedThenDagre,
  perimeterForEdgesAction,
  revealNeighbor,
} from "../graph/cytoscapeCore.js";

import { setEventMarkdown, bandeauMarkdown } from "../util/markdown.js";
import { enableTableSorting } from "../util/sortTable.js";
import { createIconButton } from "../ui/dialog.js";
import { NativeCategories } from "../util/common.js";

//------------------------

/*
 factorisation . défault outgoing. supports 'incoming' ou 'both'
*/

export function follow(direction = "outgoing") {
  // not perimeterForNodesAction to avoid full nodes.
  let cy = getCy();

  let selectedNodes = cy.nodes(":visible:selected");
  if (selectedNodes.length === 0) {
    //selectedNodes = cy.nodes(":visible");
    showAlert("no starting nodes to follow.");
    return;
  }

  showWaitCursor();

  pushSnapshot();

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  // allow to find nodes everywhere
  const allowedNodes = new Set(
    getCy()
      .nodes()
      .map((n) => n.id())
  );

  selectedNodes.forEach((node) => {
    const nodeId = node.id();

    if (direction === "outgoing" || direction === "both") {
      node
        .outgoers("edge")
        .filter((e) => !e.hasClass(NativeCategories.SIMPLIFIED))
        .forEach((edge) => {
          const target = edge.target();
          if (allowedNodes.has(target.id())) {
            nodesMarked.add(target.id());
            edgesToShow.add(edge.id());
          }
        });
    }

    if (direction === "incoming" || direction === "both") {
      node
        .incomers("edge")
        .filter((e) => !e.hasClass(NativeCategories.SIMPLIFIED))
        .forEach((edge) => {
          const source = edge.source();
          if (allowedNodes.has(source.id())) {
            nodesMarked.add(source.id());
            edgesToShow.add(edge.id());
          }
        });

      // simplified association edge : no functional direction
      node
        .connectedEdges()
        .filter((e) => e.hasClass(NativeCategories.SIMPLIFIED))
        .forEach((edge) => {
          const other =
            edge.source().id() === nodeId ? edge.target() : edge.source();
          if (allowedNodes.has(other.id())) {
            nodesMarked.add(other.id());
            edgesToShow.add(edge.id());
          }
        });
    }
  });

  // propagation of edge selection
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.connectedEdges().forEach((edge) => {
      if (edgesToShow.has(edge.id())) {
        revealNeighbor(edge);
        edge.select();
      }
    });
  });

  // show new nodes and select them
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    // already done by revealNeighbour node.show();
    node.select();
  });

  // Réaffichage des arêtes souhaitées
  cy.edges().unselect();
  edgesToShow.forEach((id) => {
    const edge = cy.getElementById(id);
    edge.show();
    edge.select();
  });

  // Z-index pour bien mettre en avant la sélection
  cy.nodes(":selected").css("z-index", 100);
  cy.nodes(":unselected").css("z-index", 10);

  hideWaitCursor();
}

/*
 when an association node is selected by a side, 
 continue with node linked to the other side 
 So selection 'cross' the association. 
 If simplified, will select through simplified edges 
 */

export function followCrossAssociations() {
  let nodes = restrictToVisible()
    ? getCy().nodes(":visible:selected")
    : getCy().nodes(":selected");
  if (nodes.length === 0) {
    showInfo("no selected nodes to search associations.");
    return;
  }
  pushSnapshot();
  // create two distinct collections in case of simplified associations
  const connectedNodesViaSimplified = nodes
    .connectedEdges(".simplified") // edges reliant les sélectionnés
    .connectedNodes() // tous les nœuds connectés (source + target)
    .difference(nodes);
  connectedNodesViaSimplified.select();
  connectedNodesViaSimplified.show();
  /*
 search who have only outgoers
*/

  nodes.forEach((sourceNode) => {
    const incomingNodes = sourceNode.incomers("node");
    if (incomingNodes.length != 0) return;

    const outgoingEdges = sourceNode.outgoers("edge");

    if (outgoingEdges.length < 2) return;
    outgoingEdges.forEach((anEdge) => {
      anEdge.show();
      anEdge.targets().select().show();
    });
  });
}

/*
 helper for long path 
*/
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

/*
 find path . adjust value when calling
*/
export function findLongOutgoingPaths(cy, minLength = 2, maxDepth = 15) {
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
        `Many nodes (${startNodes.length}) as starting points. Think about to reduce perimeter by selection next time `
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
              onClick: () => {}, // rien
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

  // BODY
  const body = doc.body;
  body.className = "alt-body";
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
    let inEdges = node.incomers("edge");

    if (outEdges.length != 2 || inEdges.length != 0) return;

    const elementsToSave = node.closedNeighborhood(); // le nœud + ses edges
    let nodeBackup = elementsToSave.jsons(); // copie profonde des data + style + classes

    let targets = outEdges.map((e) => e.target());

    if (targets.length === 2) {
      done += 1;
      let a = targets[0];
      let b = targets[1];

      a.show();
      b.show();

      let newId = `${a.id()} <-( ${node.id()} )->${b.id()}`;

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

      // remove old node and links
      node.connectedEdges().remove();
      node.remove();
    }
  });
  if (done == 0) showAlert("nothing found. Check selected.");
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
 partial save for list of chains

export function downloadJson(jsonObject, filename = "trace.json") {
  const jsonStr = JSON.stringify(jsonObject, null, 2); // indentation
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // nom du fichier proposé
  a.style.display = "none";
  document.body.appendChild(a);
  a.click(); // déclenche le téléchargement
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // nettoyage
}
*/

/*
 used by long path longPathNto1List
*/

function openJsonInNewTab(jsonArray, aTitle) {
  function toPkfkTable(arr) {
    let htmlPart = `
    <table id ='table-pk-fk'> 
    <thead>
      <tr>
        <th>target node</th>
        <th> target PK</th>
        <th> matching fk  </th>
        <th> from node</th>
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
    htmlPart += `</tbody> </table>`;

    return htmlPart;
  }
  const pkfkTable = toPkfkTable(jsonArray);

  // chemin absolu (important si la nouvelle page est "vierge")
  const imgSrc = `${location.origin}/img/closePage.png`;

  const html = `
    <!doctype html>
    <html>
      <head>
  <meta charset="utf-8">
  <title>${aTitle}</title>
  <link rel="stylesheet" href="${location.origin}/css/style.css">

 </head>
      <body class ="alt-body">
        <h1>
        <button class="close-btn" title="close" onclick="window.close()">
            <img src="${imgSrc}" alt="close">
          </button>
        
        from ${aTitle}</h1>
        <h2> 
          chains of PK matched exactly by FK
        </h2>

        <div id="md-actions-anchor"> </div> <!-- to inject later markdown output -->

        ${pkfkTable}
      </body>
  </html>
  `;

  const win = window.open("", "longPath");

  win.document.documentElement.innerHTML = html;
  const toolbar = bandeauMarkdown(win.document);
  const anchor = win.document.getElementById("md-actions-anchor");
  if (anchor) {
    anchor.appendChild(toolbar);
  }
  setEventMarkdown(win.document, "table-pk-fk", "pk-fk-chains");
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
      openJsonInNewTab(trace, `${root.id()}`);
    }
  });
}

/**
 * Trouve tous les descendants fonctionnels d'un nœud racine dans le graphe Cytoscape.js
 * @param {Cytoscape.NodeSingular} rootNode - nœud racine (sans FK entrante)
 * @returns {Set<string>} - Ensemble des IDs des nœuds descendants fonctionnels (y compris root)
 */

//this version follows links FK->PK with columns of each step

export function findFunctionalDescendantsCytoscape(rootNode) {
  const visited = new Set();
  const trace = [];

  // --- Fonction récursive ---

  function dfs(node, pkToMatch) {
    const nodeId = node.id();

    // already seen
    if (visited.has(nodeId)) return;
    // note we visit it
    visited.add(nodeId);
    // what are incomers to node in exam
    const incoming = node.incomers("edge");
    // can have several
    for (const edge of incoming) {
      // identify the node at other side
      const source = edge.source();
      const sourceId = source.id();
      // same thing if already seem (can have several way to reach a node)
      if (visited.has(sourceId)) continue;
      // check all columns of this node
      const sourceCols = new Set(source.data("columns") || []);
      // Build a Set of source column NAMES either direct either in a 'column' entry
      const sourceColNames = new Set(
        Array.from(sourceCols, (v) => (typeof v === "string" ? v : v.column))
      );

      // check all its FK
      const foreignKeys = source.data("foreignKeys") || [];

      //verify we are on the right FK between all possible
      for (const fk of foreignKeys) {
        if (fk.target_table !== nodeId) continue;
        // now chek mapping
        const mappings = fk.column_mappings || [];
        const sourceColsMapped = mappings.map((m) => m.source_column);
        const targetCols = mappings.map((m) => m.target_column);

        // Vérifie si la FK couvre toute la PK du noeud cible
        const pkMatches = [...pkToMatch].every((col) =>
          targetCols.includes(col)
        );

        const sourceContainsAllMapped = sourceColsMapped.every((col) => {
          //console.log("search:"+col);
          //console.log("sourceColNames:", [...sourceColNames]);
          return sourceColNames.has(col);
        });

        if (pkMatches && sourceContainsAllMapped) {
          trace.push({
            from: sourceId,
            to: nodeId,
            fkName: fk.constraint_name || null,
            columns: mappings.map(({ source_column, target_column }) => ({
              source_column,
              target_column,
            })),
          });

          // --- 🔹 NOUVEAU : on propage la PK propre à la table source ---
          const newPkToMatch = new Set(
            source.data("primaryKey")?.columns || []
          );

          // Si pas de PK définie (cas rare), on retombe sur les colonnes de la FK
          dfs(
            source,
            newPkToMatch.size > 0 ? newPkToMatch : new Set(sourceColsMapped)
          );
        } else {
          console.log("FK not based on a PK :", fk.constraint_name); // Debug
        }
      }
    }
  }

  // Lancement avec la PK du nœud racine
  const rootPK = new Set(rootNode.data("primaryKey")?.columns || []);
  dfs(rootNode, rootPK);
  return { visited, trace };
}


/*
 forward not used
*/

/*
 treedir
*/

// Arbre "en ligne droite" dans un sens donné (outgoers ou incomers)
export function treeDir(cy, start, dir, maxDepth = Infinity) {
  const seen = new Set([start.id()]);
  let keepNodes = cy.collection(start);
  let keepEdges = cy.collection();
  const q = [{ n: start, d: 0 }];

  while (q.length) {
    const { n, d } = q.shift();
    if (d >= maxDepth) continue;

    const edges = n[dir]("edge"); // 'outgoers' ou 'incomers'
    edges.forEach((e) => {
      const next = dir === "outgoers" ? e.target() : e.source();
      if (!seen.has(next.id())) {
        seen.add(next.id());
        keepNodes = keepNodes.add(next);
        keepEdges = keepEdges.add(e);
        q.push({ n: next, d: d + 1 });
      }
    });
  }
  cy.elements().addClass('faded'); // or .hide();
  keepNodes.select().show().removeClass("faded");

  keepEdges.select().show().removeClass("faded");


  return { nodes: keepNodes, edges: keepEdges };
}

/*
 Bidirectionnel "en ligne droite" à partir d'une racine

*/

export function straightLineBidirectional(
  cy,
  rootSel,
  { includeOut = true, includeIn = true, depth = Infinity } = {}
) {
  const root = cy.$(rootSel);
  let keep = cy.collection(root);

  cy.batch(() => {
    if (includeOut) {
      const tOut = treeDir(cy, root, "outgoers", depth);
      keep = keep.union(tOut.nodes).union(tOut.edges);
    }
    if (includeIn) {
      const tIn = treeDir(cy, root, "incomers", depth);
      keep = keep.union(tIn.nodes).union(tIn.edges);
    }
    cy.elements().not(keep).addClass('faded'); // or .hide();
    keep.show(); 
    keep.select();
  
  
  });

  return keep;
}
