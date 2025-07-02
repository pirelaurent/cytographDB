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
// to have init of events

import {
  connectToDb,
  loadInitialGraph,
  loadGraphState,
  showOverlayWithFiles,
  saveGraphState,
  sendNodeListToHtml,
  sendEdgeListToHtml,
  saveGraphToFile,
  okToLoadGraph,
} from "./loadSaveGraph.js";

import {
  cy,
  restrictToVisible,
  metrologie,
  setGraphHasChanged,
  pushSnapshot,
  //popSnapshot,  done by ctrl Z
  resetSnapshot,
  setAndRunLayoutOptions,
  perimeterForAction,
  perimeterForNodesSelection,
  modeSelect,
  AND_SELECTED,
  mergedStyles,
  getLocalDBName,
  mapValue,
} from "./main.js";

import {
  follow,
  followCross,
  findLongOutgoingPaths,
  collapseAssociations,
  restoreAssociations,
  generateTriggers,
  //fillInEdgesCategories,
  selectEdgesByNativeCategories,
} from "./selectors.js";

import { createCustomCategories } from "./customCategories.js";
/*
 connect an html menu object to a treatment function with action selected
*/

setupMenuActions("menu-display", "aspectAction", menuDisplay);
setupMenuActions("menu-nodes", "action", menuNodes);
setupMenuActions("menu-edges", "action", menuEdges);
setupMenuActions("menu-graph", "action", menuGraph);
setupMenuActions("menu-db", "action", menuDb);

setupMenuClickAction();

/*
 prepare click events on menus 
*/

function setupMenuActions(menuId, actionAttribute, callbackFn) {
  const menu = document.querySelector(`[data-menu-id="${menuId}"] .menu`);
  if (!menu) return;

  // Handle submenu items
  menu
    .querySelectorAll(".submenu li:not([data-skip-action])")
    .forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item);
      });
    });

  // Handle first-level items without submenu
  menu.querySelectorAll(".menu > li").forEach((item) => {
    const hasSubmenu = item.querySelector(".submenu") !== null;
    if (!hasSubmenu) {
      item.addEventListener("click", () => {
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item);
      });
    }
  });
}

/*
change color temporarly on click
*/
function setupMenuClickAction() {
  document.querySelectorAll(".submenu li, .menu li").forEach((item) => {
    item.addEventListener("click", () => {
      item.classList.add("clicked");

      // Retirer la classe après 150 ms
      setTimeout(() => {
        item.classList.remove("clicked");
      }, 150);
    });
  });
}

/*
 main menu on display actions 
*/
export function menuDisplay(option) {
  if (!cy) return;
  setGraphHasChanged(true);

  switch (option) {
    case "showall":
      pushSnapshot();
      {
        cy.nodes().forEach((node) => node.show());
        cy.edges().forEach((edge) => edge.show());
      }
      break;

    /*
 layout options 
*/

    case "cose":
    case "cose-bilkent":
    case "grid":
    case "circle":
    case "breadthfirst":
    case "concentric":
    case "dagre":
    case "elk":
      pushSnapshot();
      setAndRunLayoutOptions(option);

      break;

    case "fitScreen":
      cy.fit();
      break;

    case "fitSelected":
      cy.fit(
        cy.nodes(":selected").union(cy.nodes(":selected").connectedEdges()),
        50
      );
      break;

    case "H+":
      horizMore();
      break;

    case "H-":
      horizLess();
      break;

    case "V+":
      vertiMore();
      break;

    case "V-":
      vertiLess();
      break;

    case "B+":
      horizMore();
      vertiMore();
      break;

    case "B-":
      horizLess();
      vertiLess();
      break;

    case "distH":
      pushSnapshot();
      distributeNodesHorizontally();

      break;
    case "distV":
      pushSnapshot();
      distributeNodesVertically();

      break;

    case "alignH":
      pushSnapshot();
      alignNodesHorizontally();

      break;

    case "alignV":
      pushSnapshot();
      alignNodesVertically();

      break;

    case "rotateL":
      rotateGraphByDegrees(-7.5);
      break;

    case "rotateR":
      rotateGraphByDegrees(7.5);
      break;

    case "applyStyle":
      // ele.removeClass('*'); // enlève toutes les classes (comme .highlighted, .faded, etc.)
      cy.elements().forEach((ele) => {
        const classesToKeep = ["hidden"];
        const currentClasses = ele.classes();

        // Filtrer les classes à retirer
        const toRemove = currentClasses.filter(
          (c) => !classesToKeep.includes(c)
        );
        // apply
        ele.removeClass(toRemove.join(" ")); // retire uniquement les classes non protégées
      });

      cy.style(mergedStyles);
      break;

    // not linked to menu.
    case "separateH":
      separateCloseNodesHorizontal();
      break;
    case "separateV":
      separateCloseNodesVertical();
      break;
  }
  // refresh info bar
  metrologie();
}

/*
  menu for db access and files 
*/
export function menuDb(option, menuItemElement) {
  //console.log("menuDb called with:"+ option+ menuItemElement);
  switch (option) {
    case "connectToDb":
      connectToDb(menuItemElement).catch((err) =>
        alert("Error : " + err.message)
      );
      break;

    case "loadFromDb":
      connectToDb(menuItemElement)
        .then(() => {
          let dbName = getLocalDBName();
          if (dbName != null) loadInitialGraph();
        })
        .catch((err) => alert("Erreur : " + err.message));
      break;
  }
}
/*
  top line menus under access 
*/
export function menuGraph(option) {
  switch (option) {
    case "localUpload":
      {
        if (!okToLoadGraph()) return;
        cy.elements().remove();
        resetSnapshot();
        document.getElementById("graphName").value = "";

        // simulate clic on a standard upload zone but hidden
        document.getElementById("graphUpload").click();
        document.getElementById("graphUpload").value = "";
      }

      break;
    case "localDownload":
      saveGraphToFile();
      break;

    case "pick":
      resetSnapshot();
      showOverlayWithFiles();
      break;

    case "saveToServer":
      saveGraphState();
      break;

    case "loadFromServer":
      resetSnapshot();
      loadGraphState();

      break;
  } //switch
}

/*
  all menus for nodes 

*/
export function menuNodes(option) {
  // set global before calling action

  setGraphHasChanged(true);
  switch (option) {
    //-------- Select nodes
    case "all":
      {
        pushSnapshot();
        let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
        nodes.forEach((node) => {
          node.select();
        });
      }

      break;

    case "none":
      {
        pushSnapshot();
        let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
        nodes.forEach((node) => {
          node.unselect();
        });
      }
      break;

    case "invert":
      {
        pushSnapshot();
        let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
        nodes.forEach((node) => {
          node.selected() ? node.unselect() : node.select();
        });
      }
      break;

    //-------- select by edges
    case "noEdge":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes == null) return;
        pushSnapshot();
        nodes.forEach((node) => {
          if (
            node.outgoers("edge").length === 0 &&
            node.incomers("edge").length === 0
          )
            node.select();
          else {
            if (modeSelect() == AND_SELECTED) node.unselect();
          }
        });
      }
      break;

    case "looping":
      {
        let nodes = perimeterForNodesSelection();

        if (nodes == null) return;
        pushSnapshot();
        const nodesWithSelfLoop = nodes.filter((node) => {
          return node.connectedEdges().some((edge) => {
            return edge.source().id() === edge.target().id();
          });
        });
        //console.log(`Found ${nodesWithSelfLoop.length} nodes with self-loops.`);
        if (modeSelect() == AND_SELECTED) nodes.unselect();
        nodesWithSelfLoop.select();
        //nodesWithSelfLoop.forEach((node)=>console.log(node.id()+node.data("label")));
      }
      break;

    case "outgoing_none":
      selectOutputBetween(0, 0);
      break;
    // ---- see also menuSelectSizeOutgoing
    // old entry to catch directly association of 2 tables
    case "outgoing_two":
      selectOutputBetween(1, 3);
      break;

    case "noIncoming":
      selectInputBetween(0, 0);
      break;




    case "nodeHasTriggers":
      {
        let nodes = perimeterForNodesSelection();
        if( nodes.length===0) return;
        nodes.filter(".hasTriggers").select();
      }
      break;

    case "nodeIsAssociation":
      {
        let nodes = perimeterForNodesSelection();
          if( nodes.length===0) return;
        nodes.filter(".association").select();
      }
      break;

    case "nodeIsOrphan":
      {
        let nodes = perimeterForNodesSelection();
          if( nodes.length===0) return;
        nodes.filter(".orphan").select();
      }
      break;

    case "nodeIsMultiAssociation":
      {
        let nodes = perimeterForNodesSelection();
          if( nodes.length===0) return;
        nodes.filter(".multiAssociation").select();
        nodes.filter(".association").select();
      }

      break;

    //---------- hide nodes -

    /*
     hidden nodes are automatically unselected 
    */
    case "hideSelected":
      pushSnapshot();
      let nodesToHide = cy.nodes(":selected");
      nodesToHide.hide();
      nodesToHide.unselect();
      break;

    case "hideNotSelected":
      {
        pushSnapshot();
        cy.nodes(":visible")
          .filter(function (node) {
            return !node.selected();
          })
          .hide();
      }
      break;

    case "hideNone":
      pushSnapshot();
      showAll();
      break;

    case "swapHidden":
      {
        pushSnapshot();
        const nodesVisibles = cy.nodes(":visible");
        const nodesHidden = cy.nodes(":hidden");
        nodesVisibles.hide();
        nodesHidden.show();
      }
      break;

    //----------- FOLLOW nodes -

    case "followOutgoing":
      pushSnapshot();
      follow();
      break;
    case "followIncoming":
      pushSnapshot();
      follow("incoming");
      break;

    case "followBoth":
      pushSnapshot();
      follow("both");
      break;

    case "followCross":
      pushSnapshot();
      followCross();
      break;

      /*
       uses the default defined in the function 
      */
    case "findLongOutgoingPaths":
      pushSnapshot();
      findLongOutgoingPaths(cy);
      break;

    case "selectNodesFromSelectedEdges":
      pushSnapshot();
      const connectedNodes = cy
        .edges(":selected:visible")
        .connectedNodes(":visible");
      connectedNodes.select();
      break;

    //--------------
    case "proportionalSize":
      proportionalSizeNodeSizeByLinks();
      break;
    case "noProportionalSize":
      noProportionalSize();
      break;
    case "increase-font":
      increaseFontSize(3);
      break;
    case "decrease-font":
      increaseFontSize(-1);
      break;

    case "labelNodeFull":
      //------------------
      perimeterForAction().forEach((node) => {
        const originalSize = node.data("originalSize");

        if (originalSize) {
          node.data("label", node.data("originalLabel"));
          node.style({
            width: originalSize,
            height: originalSize,
          });
          // caution : removeData don't remove the key. The key stays as undefined.
          node.removeData("originalSize");
          node.removeData("originalLabel");
        }
      });

      break;

    /*
     reduce the size of node 
    */
    case "labelNodeShort":
      perimeterForAction().forEach((node) => {
        // detect if already done
        if (node.data("originalLabel") === undefined) {
          const currentSize = node.style("width");
          node.data("originalSize", currentSize);
          node.data("originalLabel", node.data("label"));
          node.data("label", ".");
          node.style({
            width: "6px",
            height: "6px",
          });
        }
      });
      break;

    //------------
    case "listCurrentNodes":
      sendNodeListToHtml();
      break;

    //---------------- nodes connected to selected edges
    case "fromEdgesSelected":
      {
        pushSnapshot();
        cy.edges(":selected").connectedNodes().select();
      }
      break;

    case "deleteNodesSelected":
      pushSnapshot();
      let nodesToKill = cy.nodes(":selected:visible");
      if (nodesToKill.length == 0) {
        alert("no selected nodes to delete");
        return;
      }
      const confirmDelete = confirm(
        `delete permanently (${nodesToKill.length} nodes) ?`
      );
      if (!confirmDelete) return;
      nodesToKill.remove();
      break;
  }
  // refresh status bar
  metrologie();
}

/*
  menu edges relays 

*/
export function menuEdges(option) {
  // if we enter an option, we flag the graph as 'changed'
  setGraphHasChanged(true);

  // select edges
  switch (option) {
    case "allEdges":
      pushSnapshot();
      cy.edges().select();
      break;

    case "noEdges":
      pushSnapshot();
      cy.edges().unselect();
      break;

    case "swapEdges":
      const visibleEdges = cy.edges(":visible");
      pushSnapshot();
      visibleEdges.forEach((edge) => {
        if (edge.selected()) {
          edge.unselect();
        } else {
          edge.select();
        }
      });

      break;
    /*
    select edges that rely selected nodes 
*/
    case "betweenNodes":
      const selectedNodes = cy.nodes(":selected");
      if (selectedNodes.length == 0) {
        alert("no selected nodes to work with");
        return;
      }
      pushSnapshot();
      // Créer un set des IDs sélectionnés pour recherche rapide
      const selectedIds = new Set(selectedNodes.map((n) => n.id()));

      // Trouver les arêtes entre deux nœuds sélectionnés
      const internalEdges = cy.edges().filter((edge) => {
        const source = edge.source().id();
        const target = edge.target().id();
        return selectedIds.has(source) && selectedIds.has(target);
      });

      // sélectionner les arêtes trouvées
      internalEdges.select();
      break;

    /*
     follow edges from selected nodes only and select them 
    */

    case "outgoingEdges":
      let nodesOut = cy.nodes(":selected:visible");
      if (nodesOut.length == 0) {
        alert(" no selected nodes");
        return;
      }
      pushSnapshot();
      nodesOut.outgoers("edge").select();
      nodesOut.outgoers("edge").addClass("outgoing");
      break;

    case "incomingEdges":
      let nodesIn = cy.nodes(":selected:visible");
      if (nodesIn.length == 0) {
        alert(" no selected nodes");
        return;
      }
      pushSnapshot();
      nodesIn.incomers("edge:visible").select();
      nodesIn.incomers("edge:visible").addClass("incoming");
      break;

    case "bothEdges":
      let nodes = cy.nodes(":selected:visible");
      if (nodes.length == 0) {
        alert(" no selected nodes");
        return;
      }
      //nodes.connectedEdges().select();
      pushSnapshot();
      let edges = nodes.connectedEdges();
      edges.forEach((edge) => {
        if (edge.source().selected() && edge.target().selected()) {
          edge.addClass("internal");
          edge.removeClass("outgoing incoming");
        } else if (edge.source().selected()) {
          edge.addClass("outgoing");
        } else if (edge.target().selected()) {
          edge.addClass("incoming");
        }
      });

      nodes.connectedEdges().select();
      break;

    //--- select by data Snapshot done into function

    case "selectEdgesByCategory":
      //fillInEdgesCategories();
      break;

    case "edgeIsTriggerGenerated":
      selectEdgesByNativeCategories("trigger_impact");
      break;

    case "edgeIsOnDeleteCascade":
      cy.edges();
      const cascadeEdges = cy.edges(".delete_cascade");
      cascadeEdges.select();
      break;

    case "labelShow":
      // Show visible edges, or selected ones if any are selected
      let subEdges = cy.edges(":visible");

      if (subEdges.filter(":selected").length !== 0) {
        subEdges = subEdges.filter(":selected");
      }
      subEdges.addClass("showLabel");
      break;

    case "labelHide":
      cy.edges().removeClass("showLabel");
      break;

    case "increase-font-edge":
      increaseFontSizeEdge(3);
      break;
    case "decrease-font-edge":
      increaseFontSizeEdge(-1);
      break;

    case "hideEdgeSelected":
      pushSnapshot();
      cy.edges(":selected").hide();
      break;

    case "hideEdgeNotSelected":
      pushSnapshot();
      cy.edges(":visible")
        .filter(function (node) {
          return !node.selected();
        })
        .hide();
      break;

    case "swapEdgeHidden":
      pushSnapshot();
      const edgesVisible = cy.edges(":visible");
      const edgesHidden = cy.edges(":hidden");
      edgesVisible.hide();
      edgesHidden.show();
      break;

    case "NoneEdgeSelected":
      pushSnapshot();
      cy.edges().show();
      break;

    case "listEdges":
      sendEdgeListToHtml();
      break;

    case "collapseAssociations":
      pushSnapshot();
      collapseAssociations();
      break;

    case "restoreAssociations":
      pushSnapshot();
      restoreAssociations();
      createCustomCategories(getLocalDBName());
      break;

    case "selectAssociations":
      var simpleEdges = cy.edges(".simplified");
      if (simpleEdges.length == 0) alert("no *-*  associations to select");
      else {
        pushSnapshot();
        simpleEdges.select();
      }
      break;

    case "generateTriggers":
      pushSnapshot();
      generateTriggers();
      break;

    case "deleteEdgesSelected":
      pushSnapshot();

      const edgesToKill = cy.edges(":selected:visible");
      if (edgesToKill.length == 0) {
        alert("no selected edges to delete");
        return;
      }

      if (edgesToKill.length > 1) {
        const confirmDelete = confirm(
          `delete permanently (${edgesToKill.length} edges) ?`
        );
        if (!confirmDelete) return;
      }
      edgesToKill.remove();
      break;

    case "test": {
      break;
    }
  }
  metrologie();
}

/*
 this is not yet in any menus
*/
export function visibility(option) {
  if (!cy) return;
  switch (option) {
    case "front":
      bringSelectedToFront();
      break;
    case "back":
      bringSelectedToBack();
      break;
  }
}
/*
 map used to apply a comparison against the symbol in gui 
*/
const opMap = {
  ">": (a, b) => a > b,
  ">=": (a, b) => a >= b,
  "<": (a, b) => a < b,
  "<=": (a, b) => a <= b,
  "=": (a, b) => a === b,
};
/*
 after a choice of values in menu, apply operations 
*/

export function menuSelectSizeOutgoing() {
  const op = document.getElementById("filter-op").value;
  const val = parseInt(document.getElementById("filter-value").value);
  const test = opMap[op];
  let nodes = perimeterForNodesSelection();
  if (nodes.length ===0) return;

  pushSnapshot();
  nodes.forEach((n) => {
    const visibleEdges = n.outgoers("edge:visible");
    const count = visibleEdges.length;
    const keep = test(count, val);
    if (modeSelect() == AND_SELECTED) n.unselect();
    if (keep) n.select();
  });
}
// button go to apply selection
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnSizeOutgoing");
  if (btn) {
    btn.addEventListener("click", menuSelectSizeOutgoing);
  }
});

/*
 select by edges incoming 
*/

export function menuSelectSizeIncoming() {
  const op = document.getElementById("filter-op-in").value;
  const val = parseInt(document.getElementById("filter-value-in").value);
  const test = opMap[op];

  let nodes = perimeterForNodesSelection();
  if( nodes.length === 0) return;

  pushSnapshot();
  nodes.forEach((n) => {
    const visibleEdges = n.incomers("edge:visible");
    const count = visibleEdges.length;
    const keep = test(count, val);
    if (modeSelect() == AND_SELECTED) n.unselect();
    if (keep) n.select();
  });
}

/*
connect method to gui 
*/
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnSizeIncoming");
  if (btn) {
    btn.addEventListener("click", menuSelectSizeIncoming);
  }
});

/*
 used to resize node layout in any way horizontal or vertical or both 
*/

function changePosRelative(xFactor, yFactor) {
  // si au moins deux sélectionnés, on les écartent

  let nodesToMove = cy.nodes(":selected:visible");
  if (nodesToMove.length < 2) nodesToMove = cy.nodes(":visible");
  if (nodesToMove.length === 0) return;
  // 1. Calculer le centre des nœuds
  let sumX = 0,
    sumY = 0;
  nodesToMove.forEach((node) => {
    const pos = node.position();
    sumX += pos.x;
    sumY += pos.y;
  });

  const centerX = sumX / nodesToMove.length;
  const centerY = sumY / nodesToMove.length;

  nodesToMove.positions((node) => {
    const pos = node.position(); // position actuelle
    return {
      x: centerX + (pos.x - centerX) * xFactor,
      y: centerY + (pos.y - centerY) * yFactor,
    };
  });
}

function horizMore() {
  changePosRelative(1.3, 1);
}
function horizLess() {
  changePosRelative(1 / 1.3, 1);
}
function vertiMore() {
  changePosRelative(1, 1.3);
}
function vertiLess() {
  changePosRelative(1, 1 / 1.3);
}

//-----------------------
function rotateGraphByDegrees(deg) {
  const angle = (deg * Math.PI) / 180;

  let nodes = cy.nodes(":selected:visible");
  if (nodes.length < 2) nodes = cy.nodes(":visible");
  if (nodes.length === 0) return;

  // Get center of graph (optional: you can also use a fixed point)
  const bb = nodes.boundingBox();
  const cx = (bb.x1 + bb.x2) / 2;
  const cy_ = (bb.y1 + bb.y2) / 2;

  nodes.forEach((node) => {
    const pos = node.position();
    const x = pos.x - cx;
    const y = pos.y - cy_;

    const xNew = Math.cos(angle) * x - Math.sin(angle) * y + cx;
    const yNew = Math.sin(angle) * x + Math.cos(angle) * y + cy_;

    node.position({ x: xNew, y: yNew });
  });
}

// Fonction utilitaire pour calculer le centre d’un groupe de nœuds
export function getCenter(nodes) {
  const sum = nodes.reduce(
    (acc, n) => {
      const p = n.position();
      acc.x += p.x;
      acc.y += p.y;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
  };
}

function increaseFontSize(delta) {
  let selectedNodes = perimeterForAction();

  // cy.style().selector("node").style("font-size", newSize).update();
  selectedNodes.forEach((node) => {
    const currentFontSize = parseFloat(node.style("font-size"));

    const newSize = Math.max(6, currentFontSize + delta);
    node.style("font-size", newSize);
  });
}

function increaseFontSizeEdge(delta) {
  let selectedEdges = cy.edges(":visible:selected");

  // S'il n'y a pas d'arêtes sélectionnées visibles, on prend toutes les visibles
  if (selectedEdges.length === 0) {
    selectedEdges = cy.edges(":visible");
  }

  selectedEdges.forEach((edge) => {
    const currentFontSize = parseFloat(edge.style("font-size")) || 10; // valeur par défaut
    const newSize = Math.max(6, currentFontSize + delta);
    edge.style("font-size", newSize);
  });
}

/*
 increase size of nodes against number of edges 
*/
export function proportionalSizeNodeSizeByLinks() {
  let selectedNodes = perimeterForAction();

  // 1. Calculer le nombre de liens pour chaque nœud
  selectedNodes.forEach((node) => {
    const degree = node.connectedEdges().length;
    node.data("degree", degree);
  });

  // 2.apply style
  selectedNodes.forEach((node) => {
    let degree = node.data("degree");
    if (degree == 0) degree = 1;

    // bornes : min 1 → max 10 liens → taille entre
    const size = mapValue(degree, 1, 40, 20, 80);

    node.style({
      width: size,
      height: size,
    });
    //document.getElementById("cy").style.backgroundColor = "lightgray";
  });
}

function noProportionalSize() {
  cy.nodes().forEach((node) => {
    node.removeData("degree");
    node.removeStyle("width");
    node.removeStyle("height");
  });
}

function distributeNodesHorizontally() {
  let nodes = cy.nodes(":selected:visible");
  if (nodes.length < 2) nodes = cy.nodes(":visible");
  if (nodes.length < 2) return;

  const sorted = nodes.sort((a, b) => a.position().x - b.position().x);

  const minX = sorted[0].position().x;
  const maxX = sorted[sorted.length - 1].position().x;
  const step = (maxX - minX) / (nodes.length - 1);

  sorted.forEach((node, index) => {
    node.position({
      x: minX + step * index,
      y: node.position().y,
    });
  });

  cy.nodes(":visible").length === 0 ? cy.fit() : null;
}

function distributeNodesVertically() {
  let nodes = cy.nodes(":selected:visible");
  if (nodes.length < 2) nodes = cy.nodes(":visible");
  if (nodes.length < 2) return;

  const sorted = nodes.sort((a, b) => a.position().y - b.position().y);

  const minY = sorted[0].position().y;
  const maxY = sorted[sorted.length - 1].position().y;
  const step = (maxY - minY) / (nodes.length - 1);

  sorted.forEach((node, index) => {
    node.position({
      x: node.position().x,
      y: minY + step * index,
    });
  });

  cy.nodes(":visible").length === 0 ? cy.fit() : null;
}

function alignNodesVertically() {
  let nodes = cy.nodes(":selected:visible");
  if (nodes.length < 2) nodes = cy.nodes(":visible");
  if (nodes.length < 2) return;

  // middleX comme moyenne des x
  let middleX = 0;
  nodes.forEach((node) => {
    middleX += node.position().x;
  });
  middleX = middleX / nodes.length;

  const sorted = nodes.sort((a, b) => a.position().x - b.position().x);
  /* middleX comme le milieu des plus éloignés 
  const minX = sorted[0].position().x;
  const maxX = sorted[sorted.length - 1].position().x;
  const middleX = (maxX - minX) / 2;
*/
  sorted.forEach((node) => {
    node.position({
      x: middleX,
      y: node.position().y,
    });
  });

  cy.nodes(":visible").length === 0 ? cy.fit() : null;
}

export function alignNodesHorizontally() {
  let nodes = cy.nodes(":selected:visible");
  if (nodes.length < 2) nodes = cy.nodes(":visible");
  if (nodes.length < 2) return;

  let middleY = 0;
  nodes.forEach((node) => {
    middleY += node.position().y;
  });
  middleY = middleY / nodes.length;

  nodes.forEach((node) => {
    node.position({
      x: node.position().x,
      y: middleY,
    });
  });

  cy.nodes(":visible").length === 0 ? cy.fit() : null;
}

//-------------------
function bringSelectedToFront() {
  cy.nodes(":selected").css("z-index", 100);
  cy.nodes(":unselected").css("z-index", 10);
}

function bringSelectedToBack() {
  cy.nodes(":selected").css("z-index", 0);
  cy.nodes(":unselected").css("z-index", 10);
}

/*
 select nodes with outgoing edges between min max
*/

function selectOutputBetween(min, max) {

  let nodes = perimeterForNodesSelection();
  if (nodes == null) return;
  pushSnapshot();
  nodes.forEach((node) => {
    // Tous les outgoers sortants
    let outgoingEdges = node.outgoers("edge:visible");

    // if AND_SELECTED Nodes is the collection of previously selected
      outgoingEdges = outgoingEdges.filter((edge) => edge.target().visible());
    const nOutput = outgoingEdges.length;

    // avoid loop in NO output
    if ((min == 0) & (max == 0)) {
      var loopEdges = outgoingEdges.filter(function (edge) {
        return edge.source().id() !== edge.target().id();
      });
      var noLoop = (loopEdges.length === 0);
      if (nOutput == 0 || noLoop) node.select();
    } else {
      if (nOutput > min && nOutput < max) {
        node.select();
      }
    }
  });
}
/*
 select nodes with incoming edges between min max
*/

function selectInputBetween(min, max) {
  let nodes = perimeterForNodesSelection();
  if (nodes == null) return;

  nodes.forEach((node) => {
    let incomingEdges = node.incomers("edge:visible");
      incomingEdges = incomingEdges.filter((edge) => edge.source().visible());


    const nInput = incomingEdges.length;

    if ((min == 0) & (max == 0)) {
      // no incoming : avoid loops
      var loopEdges = incomingEdges.filter(function (edge) {
        return edge.source().id() !== edge.target().id();
      });
      var noLoop = loopEdges.length == 0;

      if (nInput == 0 || noLoop) node.select();
    } else {
      if (nInput > min && nInput < max) {
        node.select();
      }
    }
  });
}

/*
this function is triggered by GUI event
*/
export function selectByName() {
  let pattern = document.getElementById("nameFilter").value;
  let regex;
  try {
    regex = new RegExp(pattern);
  } catch (e) {
    alert("Wrong regular expression :"+ e.message);
    return;
  }
  // unselect les cachés
  cy.nodes(":selected:hidden").unselect();

  // périmètre
  let nodes = perimeterForNodesSelection();
  if (nodes == null) return;

  nodes.forEach((node) => {
    if (regex.test(node.id())) {
      node.select(); //add
    } else {
      if (modeSelect() == AND_SELECTED) node.unselect();
    }
  });

  document.getElementById("nameFilterResult").textContent = `${nodes.filter(':selected').length}`;
}

// to can see function globally => To be changed by an event listener
window.selectByName = selectByName;

/*
  full graph visible
*/
function showAll() {
  cy.nodes().show();
  cy.edges().show();
  document.getElementById("cy").style.backgroundColor = "white";
}
