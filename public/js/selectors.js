// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

"use strict";
import {
  showAlert, 
  showError,
    showMultiChoiceDialog,
} from "./ui/dialog.js";


import {
  getCy,
  restrictToVisible,
  restoreProportionalSize,
    perimeterForAction,
} from './graph/cytoscapeCore.js';




//------------------------

/*
 factorisation . défault outgoing supports 'incoming' ou 'both'
*/

export function follow(direction = "outgoing") {
  // not perimeterForAction to avoid full nodes.
  let selectedNodes = getCy().nodes(":visible:selected");
  if (selectedNodes.length === 0) {
    showAlert("no selected nodes to follow.");
    return;
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  // allow everywhere
  const allowedNodes = new Set(getCy().nodes().map((n) => n.id()));

  selectedNodes.forEach((node) => {
    const nodeId = node.id();

    if (direction === "outgoing" || direction === "both") {
      node
        .outgoers("edge")
        .filter((e) => !e.hasClass("simplified"))
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
        .filter((e) => !e.hasClass("simplified"))
        .forEach((edge) => {
          const source = edge.source();
          if (allowedNodes.has(source.id())) {
            nodesMarked.add(source.id());
            edgesToShow.add(edge.id());
          }
        });

      // simplifiés non-orientés
      node
        .connectedEdges()
        .filter((e) => e.hasClass("simplified"))
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

  // Cacher uniquement les arêtes non souhaitées NE MARCHE PAS en cas de nouvel essai
  nodesMarked.forEach((id) => {
    const node = getCy().getElementById(id);
    node.connectedEdges().forEach((edge) => {
      if (edgesToShow.has(edge.id())) {
        edge.select();
      }
    });
  });

  // Afficher les nœuds suivis et les sélectionner
  nodesMarked.forEach((id) => {
    const node = getCy().getElementById(id);
    node.show();
    node.select();
  });

  // Réaffichage des arêtes souhaitées
  getCy().edges().unselect();
  edgesToShow.forEach((id) => {
    const edge = getCy().getElementById(id);
    edge.show();
    edge.select();
  });

  // Z-index pour bien mettre en avant la sélection
  getCy().nodes(":selected").css("z-index", 100);
  getCy().nodes(":unselected").css("z-index", 10);
}

/*
 when an association node is selected by a side, 
 continue with node linked to the other side 
 So selection 'cross' the association. 
 If collapsed, will select through simplified edges 
 */

export function followCross() {
  let nodes = restrictToVisible()
    ? getCy().nodes(":visible:selected")
    : getCy().nodes(":selected");
  if (nodes.length === 0) {
    showAlert("no selected nodes to search associations.");
    return;
  }

  // create two distinct collections
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

  // limit exploration to visible selected

  let startNodes = getCy().nodes(":visible:selected");
  if (startNodes.length === 0) {
    showAlert("no selected nodes as starting points.");
    return;
  }

  startNodes.forEach((start) => {
    dfs([start], new Set([start.id()]), 1, start.id());
  });
  if (iterationCount >= maxIterations) {
    showAlert(`Limited iterations ${maxIterations} reached. <br/>(Partial results)`);
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
    showAlert(`No long path (>${minLength} )from the starting nodes.`);
    return;
  }

  // Clear all previous selections and fade everything
  getCy().elements().unselect().addClass("faded");

  // Highlight the actual path elements
  elementsToShow.removeClass("faded").select();

  // Make sure only *starting* nodes are specially marked
  getCy().nodes().removeClass("start-node"); // optional visual marker
  getCy().nodes()
    .filter((n) => successfulStarts.has(n.id()))
    .addClass("start-node")
    .select();

  let okMess = `${paths.length} long path(s) `;
  let limit = paths.length;
  if (limit > 1000) {
    limit = 1000;
    okMess += "  (limited to 1000)";
  }

  showMultiChoiceDialog(okMess, '👁️ show the list ?', [
    {
      label: '✅ Yes',
      onClick: () => showLongPathList(limit, paths)
    },
    {
      label: "❌ No",
      onClick: () => { } // rien
    }
  ])
};

function showLongPathList(limit, paths) {
  // Génère le HTML des chemins
  const pathHtml = [];
  for (let idx = 0; idx < limit; idx++) {
    const path = paths[idx];
    pathHtml.push(
      `<div class="path">${idx + 1} : ${path.map((n) => n.id()).join(" → ")}</div>`
    );
  }

  // Template HTML complet
  const html = `
    <html>
      <head>
        <title>Long Paths</title>
        
        <style>
          body { font-family: sans-serif; padding: 1em; }
          h1 { margin-bottom: 1em; }
          .path { margin-bottom: 0.5em; }
        </style>
      </head>
      <body>
        <h1><button class="close-btn" title="Close" onclick="window.close()">✖</button> &nbsp;Long path list</h1>
        <div id="path-container">
          ${pathHtml.join("\n")}
        </div>
      </body>
    </html>
  `;

  // Ouvre la fenêtre
  const win = window.open("", "LongPathListWindow");

  // Attend que la fenêtre soit prête
  const interval = setInterval(() => {
    // Parfois documentElement n'est pas prêt tout de suite selon les navigateurs
    if (win.document && win.document.readyState === "complete") {
      win.document.documentElement.innerHTML = html;
      clearInterval(interval);
    }
  }, 10);
}


/*
 remove association (2) nodes and create new direct links 
*/
export function collapseAssociations() {
  let nodes = perimeterForAction();
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

      let newId = `generated-${a.id()} <-( ${node.id()} )->${b.id()}`;

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
          collapsed_association: true,
        },
        classes: "simplified",
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
  const visibleEdges = getCy().edges(":visible");
  const simplifiedEdges = visibleEdges.filter((edge) =>
    edge.hasClass("simplified")
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
create special links from triggers .
Use recorded triggs into a node
call script analysis to get impacted tables 
*/

export async function generateTriggers() {
  const nodes = perimeterForAction();

  const nodesWithTriggers = nodes.filter((node) => {
    const trigs = node.data("triggers");

    return Array.isArray(trigs) && trigs.length > 0;
  });
  if (nodesWithTriggers.length == 0) {
    showAlert("no table with triggers in selection.");
    return;
  }
  //------------- get

  for (const aNode of nodesWithTriggers) {
    let table = aNode.id();
    let data;
    try {
      const response = await fetch(`/triggers?table=${table}`);
      data = await response.json();

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error(`Error fetching triggers for table ${table}:`, error);
      showError("Database is not accessible. Please check your connection.");
      break; // on peut arrêter la boucle ici si ça ne sert à rien de continuer
    }
    if (!data || data.triggers.length === 0) {
      showAlert(`no trigger for table ${node.id()}.`);
      return;
    }

    data.triggers.forEach((t) => {
      const triggerName = t.name;
      const source = t.sourceTable || table; // à adapter si "table" est ailleurs
      const impactedTables = t.impactedTables || [];

      impactedTables.forEach((target) => {
        const edgeId = triggerName;

        const targetNode = getCy().getElementById(target);
        const sourceNode = getCy().getElementById(source);

        if (targetNode.nonempty() && sourceNode.nonempty()) {
          // Vérifie si l’arête existe déjà (via son ID)
          if (!getCy().getElementById(edgeId).nonempty()) {
            const edge = getCy().add({
              group: "edges",
              data: {
                id: edgeId,
                label: edgeId,
                source: source,
                target: target,
              },
            });

            edge.addClass("trigger_impact");

            edge.show();
            sourceNode.show();
            targetNode.show();
          }
        } else {
          console.warn(
            `Missing node(s) for trigger '${triggerName}' — skipping edge from '${source}' to '${target}'`
          );
        }
      });
    });

    getCy().style().update(); // forcer le style
  }
}


/*
 create a png image by button or ctrl g like graphic
*/
export function captureGraphAsPng() {
  const png = getCy().png({ full: false, scale: 2, bg: "white" });
  getCy().edges().addClass("forPNG");
  const link = document.createElement("a");
  link.href = png;
  link.download = "graph-capture.png";
  link.click();
  getCy().edges().removeClass("forPNG");
}

/**
 * Trouve tous les descendants fonctionnels d'un nœud racine dans le graphe Cytoscape.js
 * @param {Cytoscape.NodeSingular} rootNode - nœud racine (sans FK entrante)
 * @returns {Set<string>} - Ensemble des IDs des nœuds descendants fonctionnels (y compris root)
 */


export function findFunctionalDescendantsCytoscape(rootNode) {
  const visited = new Set();
  const trace = []; // 👈 ici
  const rootPK = new Set(rootNode.data('primaryKey')?.columns || []);

  function dfs(node, pkToMatch) {
    const nodeId = node.id();
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const incoming = node.incomers('edge');
    for (const edge of incoming) {
      const source = edge.source();
      const sourceId = source.id();
      if (visited.has(sourceId)) continue;

      const sourceCols = new Set(source.data('columns') || []);
      const foreignKeys = source.data('foreignKeys') || [];

      let match = false;

      for (const fk of foreignKeys) {
        const mappings = fk.column_mappings || [];

        const targetMatch = fk.target_table === nodeId;
        const targetCols = mappings.map(m => m.target_column);
        const sourceColsMapped = mappings.map(m => m.source_column);

        const pkMatches = [...pkToMatch].every(col => targetCols.includes(col));
        const sourceContainsAllMapped = sourceColsMapped.every(col => sourceCols.has(col));

        if (targetMatch && pkMatches && sourceContainsAllMapped) {
          trace.push({
            from: sourceId,
            to: nodeId,
            fkName: fk.constraint_name || null,
            columns: mappings.map(({ source_column, target_column }) => ({
              source_column,
              target_column
            }))
          });
          match = true;
          break;
        }
      }
      if (match) {
        dfs(source, pkToMatch);
      }
    }
  }

  dfs(rootNode, rootPK);


  return ({ visited, trace });
}

/*
 select and show edges that rely two selected nodes 
*/


export function selectEdgesBetweenNodes() {
  const selectedNodes = getCy().nodes(":selected");
  if (selectedNodes.length === 0) {
    showAlert("no selected nodes to work with.");
    return;
  }

  const selectedIds = new Set(selectedNodes.map(n => n.id()));

  const internalEdges = getCy().edges().filter(edge => {
    const source = edge.source().id();
    const target = edge.target().id();
    return selectedIds.has(source) && selectedIds.has(target);
  });

  internalEdges.forEach(edge => {
    edge.show();     // d'abord visible
    edge.select();   // ensuite sélectionné
  });
}

function toSimplifiedText(jsonArray) {
  return jsonArray.map(obj => {
    let lines = [];
    lines.push(`${obj.to} <-- ${obj.from}`);
    for (const col of obj.columns) {
      lines.push(`  ${col.target_column} <-- ${col.source_column}`);
    }
    return lines.join('\n');
  }).join('\n\n');
}

export function openJsonInNewTab(jsonArray, aTitle) {
  const simplifiedText = toSimplifiedText(jsonArray);
  const html = `
    <html>
      <head><title>${aTitle}</title></head>
      <body>
        <pre style="white-space: pre-wrap; word-break: break-word;">${simplifiedText}</pre>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/*
 partial save for list of chains
*/
export function downloadJson(jsonObject, filename = "trace.json") {
  const jsonStr = JSON.stringify(jsonObject, null, 2); // indentation
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename; // nom du fichier proposé
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click(); // déclenche le téléchargement
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // nettoyage
}
