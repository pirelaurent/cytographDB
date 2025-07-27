// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

"use strict";
/*
 this module is responsible for differents walks into the graph 
*/


import {
  showAlert,
  showMultiChoiceDialog,

} from "../ui/dialog.js";

import {
  pushSnapshot,
} from "../graph/snapshots.js";

import {
  getCy,
  restrictToVisible,
  restoreProportionalSize,
  perimeterForAction,
  selectEdgesBetweenSelectedNodes,
  setAndRunLayoutOptions
} from '../graph/cytoscapeCore.js';

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

export function followCrossAssociations() {
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

/*
 used by long path 
*/
function openJsonInNewTab(jsonArray, aTitle) {
  // internal helper function
  function toSimplifiedText(jsonArray) {
    return jsonArray.map(obj => {
      let lines = [];
      lines.push(` <b>${obj.to}</b> <--  <b>${obj.from}</b>`);
      for (const col of obj.columns) {
        lines.push(`  ${col.target_column} <-- ${col.source_column}`);
      }
      return lines.join('\n');
    }).join('\n\n');
  }
  // main function

  const simplifiedText = toSimplifiedText(jsonArray);
  const html = `
    <html>
      <head><title>${aTitle}</title></head>
      <body>
       <h1> from ${aTitle}</h1>
       <h2> <button class="close-btn" title="close" onclick="window.close()">X</button> &nbsp;chains of PK matched exactly by FK </h2>
        <pre style="white-space: pre-wrap; word-break: break-word;">${simplifiedText}</pre>
      </body>
    </html>
  `;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

/*
 experimental 
 try to link pk parts in successive tables 
*/
export function findPkFkFollowers() {

  // starts from a root node with no foreign key.
  const roots = getCy().nodes(":visible:selected").filter(n => n.data('foreignKeys').length === 0);

  if (roots.length === 0 || roots.length != 1) {
    showAlert(" must start from a unique node without foreignKey.");
    return;
  }
  // can have selected several, loop on these nodes one per one
  roots.forEach(root => {
    const { visited: group, trace } = findFunctionalDescendantsCytoscape(root);

    //console.log(`Groupe fonctionnel depuis ${root.id()}:`, [...group]);

    const groupNodes = getCy().nodes().filter(n => group.has(n.id()));
    pushSnapshot();
    getCy().nodes().unselect();

    getCy().batch(() => {
      groupNodes.show();
      // show all links of the node to other visible nodes
      groupNodes.connectedEdges().show();
      // but only those in the chain are to select 
      groupNodes.select();
    });
    // show those between the chain
    selectEdgesBetweenSelectedNodes();
    // and remove others 
    getCy().edges(":unselected").hide();

 // cannot reorg if few nodes
    if (getCy().nodes(":selected:visible").length > 3) {
      setAndRunLayoutOptions("dagre");
    }
// nothing to show if no follower
    if ((getCy().nodes(":selected:visible").length > 1)){
      setTimeout(() => {
        showMultiChoiceDialog("Details of PK propagation", "(experimental)", [
          {
            label: "📥 Download JSON",
            onClick: () => downloadJson(trace, `trace_follow_${root.id()}.json`)
          },
          {
            label: "👁️ see PK chain in new tab",
            onClick: () => openJsonInNewTab(trace, `${root.id()}`)
          },
          {
            label: "❌ Nothing",
            onClick: () => { } // rien
          }
        ]);

      }, 100); // 100 ms enough
    }
  });


}

/**
 * Trouve tous les descendants fonctionnels d'un nœud racine dans le graphe Cytoscape.js
 * @param {Cytoscape.NodeSingular} rootNode - nœud racine (sans FK entrante)
 * @returns {Set<string>} - Ensemble des IDs des nœuds descendants fonctionnels (y compris root)
 */

export function findFunctionalDescendantsCytoscape(rootNode) {
  const visited = new Set();
  const trace = [];
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
        // the linked table can have other FK than the one going to the current root
        if (fk.target_table !== nodeId) continue;

        const mappings = fk.column_mappings || [];
        /*
        source is the table that owns the FK
        [
        source_column:"product_id"
        source_not_null: true
        target_column:"id"
        ,]
      */
        const targetCols = mappings.map(m => m.target_column);
        const sourceColsMapped = mappings.map(m => m.source_column);
        // does this FK include all elements of PK ?
        const pkMatches = [...pkToMatch].every(col => targetCols.includes(col));
        // security: following test is useful only if mapping doesn't come directly from a db retroanalysis
        const sourceContainsAllMapped = sourceColsMapped.every(col => sourceCols.has(col));

        if (pkMatches && sourceContainsAllMapped) {
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