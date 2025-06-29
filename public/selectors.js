// Copyright (C) 2025 Laurent P.
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

import { customNodesCategories, perimeterForEdgesSelection, perimeterForNodesSelection } from "./main.js";
import {
  cy,
  perimeterForAction,
  restrictToVisible,
  modeSelect,
  AND_SELECTED,
} from "./main.js";

//------------------------

/*
 factorisation . défault outgoing supports 'incoming' ou 'both'
*/

export function follow(direction = "outgoing") {
  // not perimeterForAction to avoid full nodes.
  let selectedNodes = cy.nodes(":visible:selected");
  if (selectedNodes.length === 0) {
    alert("no selected nodes to follow");
    return;
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  //const restrict = restrictToVisible();
  // allow everywhere
  const allowedNodes = new Set(cy.nodes().map((n) => n.id()));

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
    const node = cy.getElementById(id);
    node.connectedEdges().forEach((edge) => {
      if (edgesToShow.has(edge.id())) {
        edge.select();
      }
    });
  });

  // Afficher les nœuds suivis et les sélectionner
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.show();
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
}

/*
 when an association node is selected by a side, 
 continue with node linked to the other side 
 So selection 'cross' the association. 
 If collapsed, will select through simplified edges 
 */

export function followCross() {
  let nodes = restrictToVisible()
    ? cy.nodes(":visible:selected")
    : cy.nodes(":selected");
  if (nodes.length === 0) {
    alert("no selected nodes to search associations");
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
 find path > 2 following outgoing edges 3 
*/
export function findLongOutgoingPaths(cy, minLength = 3, maxDepth = 5) {
  const paths = [];
  const successfulStarts = new Set();  // to remember which nodes are true starters

  function dfs(path, visited, depth, startId) {
    if (depth > maxDepth) return;

    const last = path[path.length - 1];
    const nextNodes = last.outgoers('edge').targets();

    nextNodes.forEach((next) => {
      const nextId = next.id();
      if (!visited.has(nextId)) {
        path.push(next);
        visited.add(nextId);

        if (path.length > minLength) {
          paths.push([...path]);
          successfulStarts.add(startId); // register this start node
        }

        dfs(path, visited, depth + 1, startId);

        // backtrack
        visited.delete(nextId);
        path.pop();
      }
    });
  }

  let startNodes = cy.nodes(':visible:selected');
  if (startNodes.length === 0) {
    startNodes = cy.nodes(':visible');
  }

  startNodes.forEach((start) => {
    dfs([start], new Set([start.id()]), 1, start.id());
  });

  const elementsToShow = cy.collection();

  paths.forEach((path) => {
    for (let i = 0; i < path.length - 1; i++) {
      const source = path[i];
      const target = path[i + 1];
      const edge = source.edgesTo(target);
      elementsToShow.merge(source).merge(target).merge(edge);
    }
  });

  if (elementsToShow.length === 0) {
    alert('No long path from the starting nodes');
    return;
  }

  // Clear all previous selections and fade everything
  cy.elements().unselect().addClass('faded');

  // Highlight the actual path elements
  elementsToShow.removeClass('faded').select();

  // Make sure only *starting* nodes are specially marked
  cy.nodes().removeClass('start-node'); // optional visual marker
  cy.nodes().filter(n => successfulStarts.has(n.id())).addClass('start-node').select();
let result =`Found ${paths.length} long path(s):`;
paths.forEach((path, idx) => {
  const ids = path.map(n => n.id()).join(" → ");
  result+=`\nPath ${idx + 1}: ${ids}`;
});

console.log(result);






}





/*
 remove association (2) nodes and create new direct links 
*/
export function collapseAssociations() {
  let nodes = perimeterForAction();
  if (nodes.length == 0) {
    alert("no nodes to check");
    return;
  }
  
  let done = 0;
  nodes.forEach(function (node) {
    let outEdges = node.outgoers("edge");
    let inEdges = node.incomers("edge");

    if (outEdges.length != 2 || inEdges.length != 0) return;

    let shouldSelect = outEdges.some((e) => e.selected());

    let targets = outEdges.map((e) => e.target());

    if (targets.length === 2) {
      done += 1;
      let a = targets[0];
      let b = targets[1];

      a.show();
      b.show();

      if (shouldSelect) {
        a.select();
        b.select();
      }

      let newId = `generated-${a.id()} <-( ${node.id()} )->${b.id()}`;

      const width = node.style("width");
      const height = node.style("height");

      // Add the generated edge

      cy.add({
        group: "edges",
        data: {
          id: newId,
          label: newId,
          source: a.id(),
          target: b.id(),
          generated: true,
          originalNode: node.id(),
          originalLabel: node.data("label") || node.id(),
          originalStyle: JSON.stringify(node.style()),
          originalPosition: JSON.stringify(node.position()),
          originalClasses: node.classes().join(" "),
          originalWidth: width,
          originalHeight: height,
          //originalHasTriggers: node.data("hasTriggers"),
          originalTriggers: node.data("triggers"),
          collapsed_association: true,
        },
        classes: "simplified",
        selected: shouldSelect,
      });

      // remove old node and links
      node.connectedEdges().remove();
      node.remove();
    }
  });
  if (done == 0) alert("nothing found. Check selected");
}

/*
 remove generated edges and recreates association nodes and its two links
 using data stored in generated link
*/

export function restoreAssociations() {
  const visibleEdges = cy.edges(":visible");
  const simplifiedEdges = visibleEdges.filter((edge) =>
    edge.hasClass("simplified")
  );

  simplifiedEdges.forEach((edge) => {
    // debugconsole.log(edge.id(), edge.classes());

    let a = edge.source();
    let b = edge.target();

    let originalId = edge.data("originalNode");
    let originalLabel = edge.data("originalLabel");
    //let originalStyle = JSON.parse(edge.data("originalStyle") || "{}");
    //let originalPosition = JSON.parse(edge.data("originalPosition") || "{}");
    let originalClasses = (edge.data("originalClasses") || "").split(" ");

    // Restaurer le noeud
    //@todo si source = dest, il ne faut pas repositionner au milieu

    let sameNode = a.id() === b.id();

    let offset = 60; // Distance de décalage si les deux sont identiques

    let position = sameNode
      ? {
          x: a.position("x") + offset,
          y: a.position("y") - offset,
        }
      : {
          x: (a.position("x") + b.position("x")) / 2,
          y: (a.position("y") + b.position("y")) / 2,
        };

    let newNode = cy.add({
      group: "nodes",
      data: {
        id: originalId,
        label: originalLabel,
        association: "true",
        hasTriggers: edge.data("originalHasTriggers"),
        triggers: edge.data("originalTriggers"),
      },
      position: position,
    });

    newNode.removeStyle();
    const width = edge.data("originalWidth");
    const height = edge.data("originalHeight");

    newNode.style({
      width: width,
      height: height,
    });

    // Restore stored classes
    newNode.addClass(originalClasses);

    // restore edges even when a loop edge
    let edgeData = [];

    // first link
    edgeData.push({
      group: "edges",
      data: {
        id: `${a.id()}-${originalId}-1`,
        source: originalId,
        target: a.id(),
      },
    });

    // second link
    if (a.id() !== b.id()) {
      // Cas normal : deux tables différentes
      edgeData.push({
        group: "edges",
        data: {
          id: `${b.id()}-${originalId}-2`,
          source: originalId,
          target: b.id(),
        },
      });
    } else {
      // Special when loop edge
      edgeData.push({
        group: "edges",
        data: {
          id: `${b.id()}-${originalId}-loop`,
          source: originalId,
          target: b.id(),
        },
        classes: "self-link", // to some visu effect
      });
    }

    cy.add(edgeData);

    // remove obsolete generated edge
    edge.remove();
  });
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
    alert("no table with triggers in selection");
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
      alert("🚫 Database is not accessible. Please check your connection.");
      break; // on peut arrêter la boucle ici si ça ne sert à rien de continuer
    }
    if (!data || data.triggers.length === 0) {
      alert(`no trigger for table ${node.id()}`);
      return;
    }



    data.triggers.forEach((t) => {
      const triggerName = t.name;
      const source = t.sourceTable || table; // à adapter si "table" est ailleurs
      const impactedTables = t.impactedTables || [];

      impactedTables.forEach((target) => {
        const edgeId = triggerName;

        const targetNode = cy.getElementById(target);
        const sourceNode = cy.getElementById(source);

        if (targetNode.nonempty() && sourceNode.nonempty()) {
          // Vérifie si l’arête existe déjà (via son ID)
          if (!cy.getElementById(edgeId).nonempty()) {
            const edge = cy.add({
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

    cy.style().update(); // forcer le style
  }
}

/*
 find all data types in nodes that we leave to user choice 

 PLAPLA to be changed with customCategories in customCategory.js 
*/

export function fillInGuiNodesCustomCategories() {
  // find position in menus
  const container = document.getElementById("customList");
  // create or get submenu
  let submenu = container.querySelector(".submenu");
  if (!submenu) {
    submenu = document.createElement("ul");
    submenu.classList.add("submenu");
    container.appendChild(submenu);
  }

  // Supprime les anciens éléments
  submenu.querySelectorAll("li.dynamic-data-key").forEach((el) => el.remove());

  // Add new custom 
  for (let key of customNodesCategories) {
    const li = document.createElement("li");
    li.classList.add("dynamic-data-key");
    li.setAttribute("data-key", key);
    li.textContent = key;
    li.addEventListener("click", () => {
      selectNodesByCustomcategories(key);
    });
    submenu.appendChild(li);
  }
}

/*
  following eventlistener set in dynamic list 
  filter nodes 
  take care of OR/AND 
*/

function selectNodesByCustomcategories(aCategory) {
  const nodes = perimeterForNodesSelection();
  nodes.forEach((node) => {
    if (node.hasClass(aCategory)) {
      node.select();
    }
  });
}

/*
  discrete native categories are set in index.html with dedicated actions 
*/



export function selectEdgesByNativeCategories(aCategory) {

  const edges = perimeterForEdgesSelection();
  if (edges.length === 0) return;

  edges.forEach((edge) => {
    if (edge.hasClass(aCategory)) {
      edge.select();
    }
  });
}

/*
 create a png image by button or ctrl g like graphic
*/
export function captureGraphAsPng() {
  const png = cy.png({ full: false, scale: 2, bg: 'white' });
  cy.edges().addClass("forPNG");
  const link = document.createElement("a");
  link.href = png;
  link.download = "graph-capture.png";
  link.click();
  cy.edges().removeClass("forPNG");
}