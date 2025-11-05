// Copyright (C) 2025 pep-inno.com
// This file is part of CytographDB (https://github.com/pirelaurent/cytographdb)

"use strict";
/*
 this module is responsible for differents walks into the graph 
*/

import {
  showAlert,
  showInfo,
  showWaitCursor,
  hideWaitCursor,
} from "../ui/dialog.js";

import { pushSnapshot } from "../util/snapshots.js";

import { getCy } from "../graph/cytoscapeCore.js";

import { revealNeighbor } from "../core/layout.js";

import { restrictToVisible } from "../core/perimeter.js";

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

export function followTree(direction = "outgoing") {
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

  if (direction === "incoming")
    straightLineBidirectional(cy, selectedNodes, {
      includeIn: true,
      includeOut: false,
    });

  if (direction === "outgoing")
    straightLineBidirectional(cy, selectedNodes, {
      includeIn: false,
      includeOut: true,
    });

  if (direction === "both")
    straightLineBidirectional(cy, selectedNodes, {
      includeIn: true,
      includeOut: true,
    });

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
 treedir
Starts from a node,
Follows edges either via .outgoers("edge") or .incomers("edge"),
Keeps track of visited nodes to avoid infinite loops,
Stops at maxDepth,
Returns { nodes, edges } for that subgraph.
 */

 function treeDir(cy, start, dir, maxDepth = Infinity) {
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
  /*   cy.elements().addClass("faded"); // or .hide();
  keepNodes.select().show().removeClass("faded");
  keepEdges.select().show().removeClass("faded"); */

  return { nodes: keepNodes, edges: keepEdges };
}

/*
 Bidirectionnal straight 
calls treeDir() once for outgoing,
calls it again for incoming,
merges the results,
and then fades out everything else (.not(keep).addClass("faded")). 

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
    cy.elements().not(keep).addClass("faded"); // or .hide();
    keep.show();
    keep.select();
  });

  return keep;
}

/**
 * Pretty print tree (for verification)
 */
export function printTree(node, prefix = "") {
  console.log(prefix + node.table + (node.cycle ? " (cycle)" : ""));
  for (const child of node.children || []) {
    const tag = child.via?.mandatory ? "mandatory" : "optional";
    const fk = child.via?.constraint || "?";
    const txt = child.via?.comment ? ` // ${child.via.comment}` : "";
    console.log(`${prefix}  ↳ ${child.table} [${tag}] via ${fk}${txt}`);
    printTree(child, prefix + "    ");
  }
}
