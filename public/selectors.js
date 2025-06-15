"use strict";

import {
  cy,
  perimeterForAction,
  restrictToVisible,
  pushSnapshot,
  addNativeCategories
} from "./main.js";

//------------------------

/*
 some operation works on selected in priority, otherwise on all 
 Against checkbox visibility : 
  work only on visible 
  or work on all nodes, visible or not 
 Against selected nodes exists : 
  act only on selected 
  act on all nodes  
*/

/*
 add nodes that follow an outgoing edge 
*/

export function followOutgoing(selectedNodes) {
  if (selectedNodes == null) {
    // not perimeterForAction to avoid full nodes.
    selectedNodes = restrictToVisible()
      ? cy.nodes(":visible:selected")
      : cy.nodes(":selected");
    if (selectedNodes.length === 0) {
      alert("no selected nodes");
      return;
    }
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  // Marquer les nœuds cibles et les arêtes sortantes valides
  selectedNodes.forEach(function (node) {
    const outgoingEdges = node
      .outgoers("edge")
      .filter((e) => !e.hasClass("simplified"));

    outgoingEdges.forEach((edge) => {
      const target = edge.target();
      nodesMarked.add(target.id());
      edgesToShow.add(edge.id());
    });
  });

  // Cacher toutes les arêtes des nœuds à afficher, pour éviter les arêtes parasites
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.connectedEdges().forEach((edge) => {
      if (!edgesToShow.has(edge.id())) {
        edge.hide();
      }
    });
  });

  // Afficher et sélectionner uniquement les nœuds ciblés
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.show();
    node.select();
  });

  // Réinitialiser la sélection visuelle
  cy.nodes(":selected").css("z-index", 100);
  cy.nodes(":unselected").css("z-index", 10);

  // Afficher uniquement les arêtes choisies
  cy.edges().unselect();
  edgesToShow.forEach((id) => {
    const edge = cy.getElementById(id);
    edge.show();
    edge.select();
  });
}

/*
 incomers pursuit
*/
export function followIncoming(selectedNodes) {
  if (selectedNodes == null) {
    selectedNodes = restrictToVisible()
      ? cy.nodes(":visible:selected")
      : cy.nodes(":selected");
    if (selectedNodes.length === 0) {
      alert("no selected nodes");
      return;
    }
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  selectedNodes.forEach(function (node) {
    // Arêtes entrantes (hors simplifiées)
    const incomingEdges = node
      .incomers("edge")
      .filter((e) => !e.hasClass("simplified"));

    incomingEdges.forEach((edge) => {
      const source = edge.source();
      nodesMarked.add(source.id());
      edgesToShow.add(edge.id());
    });

    // Arêtes "simplifiées" (non orientées) associatives
    const simplifiedEdges = node
      .connectedEdges()
      .filter((e) => e.hasClass("simplified"));

    simplifiedEdges.forEach((edge) => {
      const otherNode =
        edge.source().id() === node.id() ? edge.target() : edge.source();
      nodesMarked.add(otherNode.id());
      edgesToShow.add(edge.id());
    });
  });

  // Cacher toutes les arêtes des nœuds marqués pour éviter le bruit visuel
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.connectedEdges().forEach((edge) => {
      if (!edgesToShow.has(edge.id())) {
        edge.hide();
      }
    });
  });

  // Afficher et sélectionner les nœuds d’origine
  nodesMarked.forEach((id) => {
    const node = cy.getElementById(id);
    node.show();
    node.select();
  });

  cy.nodes(":selected").css("z-index", 100);
  cy.nodes(":unselected").css("z-index", 10);

  cy.edges().unselect();

  edgesToShow.forEach((id) => {
    const edge = cy.getElementById(id);
    edge.show();
    edge.select();
  });
}

/*
 cannot use outgoing then incoming as perimeter of selected had changed
*/

export function followBoth() {
  let selectedNodes = restrictToVisible()
    ? cy.nodes(":visible:selected")
    : cy.nodes(":selected");

  let nbSelectBefore = selectedNodes.length;
  if (nbSelectBefore == 0) {
    alert("no selected nodes");
    return;
  }
  followOutgoing(selectedNodes);
  followIncoming(selectedNodes);
}

/*
 factorisation . défaut ougoing sinon 'incoming' ou 'both'
*/

export function follow(direction = "outgoing") {
  // not perimeterForAction to avoid full nodes.
  let selectedNodes = restrictToVisible()
    ? cy.nodes(":visible:selected")
    : cy.nodes(":selected");
  if (selectedNodes.length === 0) {
    alert("no selected nodes");
    return;
  }

  let nodesMarked = new Set();
  let edgesToShow = new Set();

  const restrict = restrictToVisible();
  const allowedNodes = new Set(
    (restrict ? cy.nodes(":visible") : cy.nodes()).map((n) => n.id())
  );

  selectedNodes.forEach((node) => {
    const nodeId = node.id();

    if (direction === "outgoing" || direction === "both") {
      node
        .outgoers(restrict ? "edge:visible" : "edge")
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
        .incomers(restrict ? "edge:visible" : "edge")
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
        .connectedEdges(restrict ? ":visible" : "")
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
 So selection 'cross' the ssociation. 
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
    if (!node.hasClass("association")) return;

    let outEdges = node.outgoers("edge");
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
    const response = await fetch(`/triggers?table=${table}`);
    const data = await response.json();

    if (!response.ok) {
      alert(`${data.error}`);
      return;
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
              label: "trigger generated",
              source: table,
              target: target,
            },
          });
          edge.addClass("trigger_generated");
          addNativeCategories(edge,["trigger_generated"]);
          edge.native
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
*/

export function fillInNodesCategories() {
  const excludedKeys = [
    "id",
    "label",
    "columns",
    "foreignKeys",
    "orphan",
    "association",
    "degree",
    "historic",
    "multiAssociation",
    "category",
    //'originalSize', // appears when a node was set label  none
    //'originalLabel',

    "hidden", // set to true when saving a graph
  ];

  const nodes = cy.nodes();

  // Rassembler toutes les clés présentes dans leurs data()
  const allKeys = new Set();

  nodes.forEach((node) => {
    const data = node.data();

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        allKeys.add(key);
      }
    });
    node;
  });

  // show results

  const filteredKeys = [...allKeys].filter(
    (key) => !excludedKeys.includes(key)
  );

  if (filteredKeys.length == 0) {
    alert(" no categories within current nodes");
    return;
  }

  // find position in menus
  const container = document.getElementById("dataSelector");
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
  filteredKeys.forEach((key) => {
    const li = document.createElement("li");
    li.classList.add("dynamic-data-key");
    li.setAttribute("data-key", key);
    li.textContent = key;
    submenu.appendChild(li);
  });
}

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
    console.log(edge.data("nativeCategories"));
    const categories = edge.data("nativeCategories");
    if (Array.isArray(categories) && categories.includes(aCategory)) {
      edge.select();
    }
  });
}


/*
 selection of edges by categories 
*/
export function fillInEdgesCategories() {
  const excludedKeys = [
    "id",
    "label",
    "source",
    "target",
    "category",
    "hidden",
    "generated",
  ];

  const edges = cy.edges();

  const allKeys = new Set();

  edges.forEach((edge) => {
    const data = edge.data();

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        if (!key.startsWith("original")) allKeys.add(key);
      }
    });
  });

  const filteredKeys = [...allKeys].filter(
    (key) => !excludedKeys.includes(key)
  );

  if (filteredKeys.length == 0) {
    alert(" no categories within current edges");
    return;
  }

  const container = document.getElementById("dataSelectorEdges"); // nouveau container
  let submenu = container.querySelector(".submenu");
  if (!submenu) {
    submenu = document.createElement("ul");
    submenu.classList.add("submenu");
    container.appendChild(submenu);
  }

  submenu.querySelectorAll("li.dynamic-data-key").forEach((el) => el.remove());

  filteredKeys.forEach((key) => {
    const li = document.createElement("li");
    li.classList.add("dynamic-data-key");
    li.setAttribute("data-key", key);
    li.textContent = key;
    submenu.appendChild(li);
  });
}
/*
 when a category is clicked, select 
*/
document.getElementById("dataSelectorEdges").addEventListener("click", (e) => {
  const target = e.target;

  if (target.matches("li.dynamic-data-key")) {
    const key = target.getAttribute("data-key");

    const matchingEdges = cy.edges().filter((e) => {
      const data = e.data();
      return data.hasOwnProperty(key) && data[key] != null;
    });

    pushSnapshot();
    cy.edges().unselect();
    matchingEdges.select();
    cy.fit(matchingEdges, 50);
  }
});
