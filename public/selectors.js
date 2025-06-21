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

import { customCategories } from "./customCategories.js";
import {
  cy,
  perimeterForAction,
  restrictToVisible,
  addNativeCategories,
} from "./main.js";

//------------------------


/*
 factorisation . défault outgoing supports 'incoming' ou 'both'
*/

export function follow(direction = "outgoing") {
  // not perimeterForAction to avoid full nodes.
  let selectedNodes =  cy.nodes(":visible:selected")
  if (selectedNodes.length === 0) {
    alert("no selected nodes to follow");
    return;
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  //const restrict = restrictToVisible();
  // allow everywhere 
  const allowedNodes = new Set(
     cy.nodes().map((n) => n.id())
  );


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
    alert("no selected nodes");
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
 search in incomers those who have only outgoers
*/

  nodes.forEach((targetNode) => {
    // Trouver les nœuds qui pointent vers ce nœud
    const incomingNodes = targetNode.incomers("node");

    incomingNodes.forEach((sourceNode) => {
      const allEdges = sourceNode.connectedEdges();
      const outgoingEdges = sourceNode.outgoers("edge");

      // Vérifier si toutes les arêtes sont sortantes
      const hasOnlyOutgoing = allEdges.every(
        (e) => e.source().id() === sourceNode.id()
      );

      if (hasOnlyOutgoing) {
        // Sélectionner les cibles et les arêtes sortantes depuis ce noeud
        const targets = outgoingEdges.targets();
        const edges = outgoingEdges;
        if (outgoingEdges.length == 2) {
          sourceNode.select();
          sourceNode.show();
          targets.select();
          targets.show();
          edges.select();
          edges.show();
        }
      }
    });
  });
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
          originalHasTriggers: node.data("hasTriggers"),
          originalTriggers: node.data("triggers"),
          originalNativeCategories: node.data("nativeCategories"),
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
        nativeCategories: edge.data("originalNativeCategories"),
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

    const allImpacted = new Set();
    data.triggers.forEach((t) => {
      //must calculate impacted table
      (t.impactedTables || []).forEach((tbl) => allImpacted.add(tbl));
    });

    const impacted = Array.from(allImpacted);

    impacted.forEach((target) => {
      let edgeId = `trigger-${table}->${target}`;

      const targetNode = cy.getElementById(target);

      if (targetNode.nonempty()) {
        if (!cy.getElementById(edgeId).nonempty()) {
          const edge = cy.add({
            group: "edges",
            data: {
              id: edgeId,
              label: "generated",
              source: table,
              target: target,
            },
          });
          edge.addClass("trigger_impact");
          addNativeCategories(edge, ["trigger_impact"]);
          edge.native;
          edge.show();
          targetNode.show(); // facultatif si déjà visible
        }
      } else {
        console.warn(
          `Target table '${target}' not found in graph — skipping edge '${edgeId}'`
        );
      }
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

  // Ajoute les nouveaux
  for (let key in customCategories) {
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
*/

function selectNodesByCustomcategories(aCategory) {
  const nodes = perimeterForAction();
  nodes.forEach((node) => {
    const categories = node.data("customCategories");
    if (Array.isArray(categories) && categories.includes(aCategory)) {
      node.select();
    }
  });
}

/*
  discrete native categories are set in index.html with dedicated actions 
*/

export function selectNodesByNativeCategories(aCategory) {
  const nodes = perimeterForAction();

  nodes.forEach((node) => {
    const categories = node.data("nativeCategories");
    if (Array.isArray(categories) && categories.includes(aCategory)) {
      node.select();
    }
  });
}

export function selectEdgesByNativeCategories(aCategory) {
  const edges = cy.edges();

  edges.forEach((edge) => {
    const categories = edge.data("nativeCategories");
    if (Array.isArray(categories) && categories.includes(aCategory)) {
      edge.select();
    }
  });
}
