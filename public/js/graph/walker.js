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

import {
  getCy,
} from "../graph/cytoscapeCore.js";

import { revealNeighbor } from "../core/layout.js";

import {
  restoreProportionalSize,
  hideNotSelectedThenDagre,
} from "../core/nodeOps.js"


import { restrictToVisible } from "../core/perimeter.js";


import { setEventMarkdown,  createHeaderMarkdown } from "../util/markdown.js";

import { createIconButton } from "../ui/dialog.js";
import { NativeCategories } from "../util/common.js";
import { setClipReport } from "../util/clipReport.js";

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
    straightLineBidirectional(
      cy,
      selectedNodes,
      {
        includeIn: true,
        includeOut: false
      }
    );

  if (direction === "outgoing")
    straightLineBidirectional(
      cy,
      selectedNodes,
      {
        includeIn: false,
        includeOut: true
      }
    );

  if (direction === "both")
    straightLineBidirectional(
      cy,
      selectedNodes,
      {
        includeIn: true,
        includeOut: true
      }
    );

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
 treedir
Starts from a node,
Follows edges either via .outgoers("edge") or .incomers("edge"),
Keeps track of visited nodes to avoid infinite loops,
Stops at maxDepth,
Returns { nodes, edges } for that subgraph.
 */

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


function selectBasedOnTree(node) {
  const cy = getCy();
  //cy.nodes().show(); // to avoid all links when brought back
  //cy.edges().hide();
  cy.batch(() => {
    cy.elements().addClass("faded");
    treeLoop(node);
    cy.elements(":selected").removeClass("faded");
    return;
  });

  // embedded recursive

  function treeLoop(node) {
    for (const child of node.children || []) {
      const fk = child.via?.constraint || "?";
/*    const tag = child.via?.mandatory ? "mandatory" : "optional";
      const txt = child.via?.comment ? ` // ${child.via.comment}` : "";
      //console.log(` ↳ ${child.table} [${tag}] via ${fk}${txt}`); //tag : mandatory 
*/
      cy.$id(child.table).show().select();
      // console.log(`edge[name = "${fk}"]`)
      cy.$(`edge[label = "${fk}"]`).show().select();
      treeLoop(child.table);
    }
  }
}

/**
 * Build { tableId -> tableJson } from Cytoscape nodes
 */
function buildSchemaFromNodes(nodes) {
  const schema = {};
  nodes.forEach((n) => {
    const d = n.data();
    const id = d.id || n.id();
    schema[id] = d;
  });
  return schema;
}

/**
 * Build a global ownership graph (parent → children)
 */
function buildOwnershipGraph(schema, { onlyMandatory = false } = {}) {
  const graph = new Map();
  const ensure = (k) => {
    if (!graph.has(k)) graph.set(k, []);
    return graph.get(k);
  };

  for (const table of Object.values(schema)) {
    for (const fk of table.foreignKeys || []) {
      const parent = fk.target_table;
      const child = fk.source_table;
      const mandatory = !!fk.all_source_not_null;
      if (onlyMandatory && !mandatory) continue;

      // skip FKs pointing outside schema
      if (!schema[parent] || !schema[child]) continue;

      ensure(parent).push({
        parent,
        child,
        constraint: fk.constraint_name,
        mandatory,
        comment: fk.comment || null,
        reflexive: parent === child,
      });
    }
  }
  return graph;
}

/**
 * Recursively explore only descendants of rootId
 */
function buildOwnershipTree(rootId, graph, visited = new Set()) {
  if (visited.has(rootId)) return { table: rootId, cycle: true, children: [] };
  visited.add(rootId);

  const edges = graph.get(rootId) || []; // only children of this root
  const children = edges.map((edge) => {
    const sub = buildOwnershipTree(edge.child, graph, new Set(visited));
    return { ...sub, via: edge };
  });

  return { table: rootId, children };
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

function treeToJSON(node) {
  const seen = new WeakSet();

  function build(n) {
    // Si on a déjà visité ce nœud → marquer comme cycle
    if (seen.has(n)) {
      return { table: n.table, cycle: true, children: [] };
    }

    seen.add(n);

    return {
      table: n.table,
      cycle: !!n.cycle,
      children: (n.children || []).map(child => ({
        via: {
          tag: child.via?.mandatory ? "mandatory" : "optional",
          constraint: child.via?.constraint ?? "?",
          comment: child.via?.comment ?? null,
        },
        child: build(child),
      })),
    };
  }

  return build(node);
}

// Exemple d'usage :
// const json = treeToJSON(root);
// console.log(JSON.stringify(json, null, 2));
