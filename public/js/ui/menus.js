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
  loadInitialGraph,
  loadGraphState,
  showOverlayWithFiles,
  saveGraphState,
  saveGraphToFile,
} from "../graph/loadSaveGraph.js";

import {
  connectToDb,
  removeTriggers,
  generateTriggers,
  setLocalDBName,
} from "../dbFront/tables.js";

import { listNodesToHtml } from "../ui/htmlNodes.js";
import { sendEdgeListToHtml } from "../ui/htmlEdges.js";

import {
  follow,
  followCrossAssociations,
  findLongOutgoingPaths,
  simplifyAssociations,
  restoreAssociations,
  findPkFkChains,
} from "../graph/walker.js";

import {
  getCy,
  showAll,
  restrictToVisible,
  hideSelected,
  hideNotSelected,
  labelNodeShow,
  labelNodeHide,
  swapHidden,
  setAndRunLayoutOptions,
  selectNodesFromSelectedEdges,
  selectTargetNodesFromSelectedEdges,
  selectSourceNodesFromSelectedEdges,
  perimeterForEdgesAction,
  perimeterForNodesSelection,
  metrologie,
  changePosRelative,
  distributeNodesHorizontally,
  distributeNodesVertically,
  alignNodesVertically,
  alignNodesHorizontally,
  bringSelectedToFront,
  bringSelectedToBack,
  rotateGraphByDegrees,
  noProportionalSize,
  changeFontSizeEdge,
  changeFontSizeNode,
  selectEdgesBetweenSelectedNodes,
  proportionalSizeNodeSizeByLinks,
} from "../graph/cytoscapeCore.js";

import {
  enterFkDetailedMode,
  enterFkSynthesisMode,
} from "../graph/detailedEdges.js";

import {
  pushSnapshot,
  //popSnapshot,  //done by ctrl Z
  resetSnapshot,
} from "../graph/snapshots.js";

import {
  modeSelect,
  AND_SELECTED,
  showMultiChoiceDialog,
  showAlert,
  showError,
  deleteNodesSelected,
} from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";

import { createCustomCategories } from "../filters/categories.js";

import { selectEdgesByNativeCategories } from "./custom.js";

/*
 connect an html menu object to a treatment function with action selected
*/
export function initMenus() {
  setupMenuActions("menu-display", "aspectAction", menuDisplay);
  setupMenuActions("menu-nodes", "action", menuNodes);
  setupMenuActions("menu-edges", "action", menuEdges);
  setupMenuActions("menu-graph", "action", menuGraph);
  setupMenuActions("menu-db", "action", menuDb);

  setupMenuClickAction();
}
/*
 prepare click events on menus 
*/

function OLDsetupMenuActions(menuId, actionAttribute, callbackFn) {
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

      item.addEventListener("contextmenu", (e) => {
        const choice = item.getAttribute(actionAttribute);
        console.log(choice)
        e.preventDefault(); // bloque le menu natif (optionnel)
        someCodeRight(e);
      });
    }
  });
}

function setupMenuActions(menuId, actionAttribute, callbackFn) {
  const menu = document.querySelector(`[data-menu-id="${menuId}"] .menu`);
  if (!menu) return;

  // Items finaux dans les sous-menus
  menu.querySelectorAll(".submenu li:not([data-skip-action])").forEach((item) => {
    item.addEventListener("click", (e) => {
      // e.stopPropagation(); // plus nécessaire si tu passes en délégation, mais ok ici
      const choice = item.getAttribute(actionAttribute);
      if (choice) callbackFn(choice, item,"left");
    });

    item.addEventListener("contextmenu", (e) => {
      e.preventDefault();               // bloque le menu natif
      const choice = item.getAttribute(actionAttribute);
      if (choice) callbackFn(choice, item,  "right");
    }, { capture: true }); // capture pour éviter un stopPropagation éventuel
  });

  // Items de premier niveau SANS sous-menu
  // ⬇️ important : utiliser :scope > li (pas ".menu > li")
  menu.querySelectorAll(":scope > li").forEach((item) => {
    const hasSubmenu = item.querySelector(":scope > .submenu") !== null;
    if (!hasSubmenu) {
      item.addEventListener("click", () => {
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item,"left");
      });

      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const choice = item.getAttribute(actionAttribute);
        if (choice) callbackFn(choice, item, "right");
      }, { capture: true });
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
  ----------------------------------menu for db access and files 
*/
export function menuDb(option, menuItemElement, whichClic='left') {
  if (whichClic=="right") return;
  switch (option) {
    case "connectToDb":
      connectToDb(menuItemElement).catch((err) =>
        showError("connection failed: " + err.message)
      );
      break;

    case "loadFromDb":
      // avoid relaoding if already in place
      let savedDBName = getLocalDBName();
      setLocalDBName(null);

      connectToDb(menuItemElement)
        .then(() => {
          // if loaded the api had loaded dbName
          let dbName = getLocalDBName();

          if (dbName != null) {
            loadInitialGraph();
          } else {
            // no choice restore same if any
            setLocalDBName(savedDBName);
          }
        })
        .catch((err) => showError("loadFromDB: " + err.message));
      break;
  }
}

/*
 ----------------------------------  main menu on display actions 
*/
export function menuDisplay(option, item, whichClic='left') {
    if (whichClic=="right") return;
  if (!cy) return;
  switch (option) {
    // -------------------------- fitscreen / selected

    case "fitScreen":
      getCy().fit();
      break;

    case "fitSelected":
      getCy().fit(
        getCy()
          .nodes(":selected")
          .union(getCy().nodes(":selected").connectedEdges()),
        50
      );
      break;

    /*
  -------------------------- layout options 
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
    /*
  -------------------------- move resize 
*/
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
    /*
  -------------------------- move distribute & align
*/
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
  ---------------------------------- Files menu on top line 
*/
export function menuGraph(option, item, whichClic='left') {
    if (whichClic=="right") return;
  switch (option) {
    case "localUpload":
      {
        if (typeof getCy() !== "undefined" && getCy()) {
          getCy().elements().remove();
        }

        resetSnapshot();
        document.getElementById("graphName").value = "";

        // simulate clic on a standard upload zone but hidden
        //document.getElementById("graphUpload").click();
        const input = document.getElementById("graphUpload");
        if (input) {
          input.click();
        } else {
          console.warn(
            "graphUpload input not found when trying to trigger click"
          );
        }

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
  ------------------------------------- Nodes 

*/
export function menuNodes(option, item, whichClic='left') {
    if (whichClic=="right") return;
  switch (option) {
    //-------- Nodes Select

    case "all":
      {
        pushSnapshot();
        let nodes = restrictToVisible()
          ? getCy().nodes(":visible")
          : getCy().nodes();
        nodes.forEach((node) => {
          node.select();
        });
      }
      break;

    case "none":
      {
        pushSnapshot();
        let nodes = restrictToVisible()
          ? getCy().nodes(":visible")
          : getCy().nodes();
        nodes.forEach((node) => {
          node.unselect();
        });
      }
      break;

    case "swapSelected":
      {
        pushSnapshot();
        let nodes = restrictToVisible()
          ? getCy().nodes(":visible")
          : getCy().nodes();
        nodes.forEach((node) => {
          node.selected() ? node.unselect() : node.select();
        });
      }
      break;

    /*
      -------------------------------------Nodes  hide 
    */
    case "hideSelected":
      pushSnapshot();
      hideSelected();
      break;

    case "hideNotSelected":
      pushSnapshot();
      hideNotSelected();
      break;

    case "showAll":
      pushSnapshot();
      showAll();
      break;

    case "swapHidden":
      pushSnapshot();
      swapHidden();
      break;

    //------------------------------------- nodes from selected  edges

    case "selectSourceNodes":
      selectSourceNodesFromSelectedEdges();
      break;
    case "selectNodesFromSelectedEdges":
      selectNodesFromSelectedEdges();
      break;
    case "selectDestNodes":
      selectTargetNodesFromSelectedEdges();
      break;

    // -----------------------------------------Nodes filter by

    // *** by Name *** is under clic event -> openNameFilterModal

    // --------------- native categories

    case "nodeIsOrphan":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".orphan").select();
      }
      break;

    case "nodeIsRoot":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".root").select();
      }
      break;

    case "nodeIsLeaf":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes == null) return;
        if (nodes.length === 0) return;
        nodes.filter(".leaf").select();
      }
      break;

    case "nodeIsAssociation":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".association").select();
      }
      break;

    case "nodeIsMultiAssociation":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".multiAssociation").select();
        nodes.filter(".association").select();
      }
      break;

    case "nodeHasTriggers":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".hasTriggers").select();
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
      }
      break;

      break;

    /*
    ------------------------------------------------ custom list 
    no event . The list had been extended by fillInGuiNodesCustomCategories
    on each custom entry a click event goes to 

    selectNodesByCustomcategories(key); 

*/

    // ------------------------------------------- Nodes select with edges

    /*    
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
 */

    /*
    -----------------------   filter by degrees incoming and outgoing 
      is started by event on the menu item by  byFilterMenu that starts openDegreeFilter()

*/

    //-------------------------------------------------------- Label

    case "labelNodeShow":
      labelNodeShow();
      break;

    case "labelNodeHide":
      labelNodeHide();
      break;

    case "increase-font":
      changeFontSizeNode(3);
      break;
    case "decrease-font":
      changeFontSizeNode(-1);
      break;

    //------------------------------------------------ Nodes List

    case "listNodesAll":
      listNodesToHtml(true);
      break;

    case "listNodesSelected":
      listNodesToHtml(false);
      break;

    //------------------------------------------------ Nodes  Follow

    case "followOutgoing":
      follow("outgoing");
      break;

    case "followIncoming":
      follow("incoming");
      break;

    case "followBoth":
      follow("both");
      break;

    case "followCrossAssociations":
      followCrossAssociations();
      break;

    /*
     uses the default defined in the function 
    */
    case "findLongOutgoingPaths":
      pushSnapshot();
      findLongOutgoingPaths(getCy());
      break;

    case "findPkFkChains":
      findPkFkChains();
      break;

    //--------------
    case "proportionalSize":
      proportionalSizeNodeSizeByLinks();
      break;
    case "noProportionalSize":
      noProportionalSize();
      break;

    //----------------------------------  nodes Delete

    case "deleteNodesSelected":
      deleteNodesSelected();

      break;
  }
}

/*
  //------------------------------------------------------------------menu edges relays 
*/

export function menuEdges(option, item, whichClic='left') {
  // if we enter an option, we flag the graph as 'changed'
  if (whichClic=="right") return;
  // select edges
  switch (option) {
    case "allEdges":
      pushSnapshot();
      getCy().edges().select();
      break;

    case "noEdges":
      pushSnapshot();
      getCy().edges().unselect();
      break;

    case "swapEdges":
      const visibleEdges = getCy().edges(":visible");
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
      pushSnapshot();
      selectEdgesBetweenSelectedNodes();
      break;

    /*
     follow edges from selected nodes only and select them 
    */

    case "outgoingEdges":
      let nodesOut = getCy().nodes(":selected:visible");
      if (nodesOut.length == 0) {
        showAlert("no selected nodes.");
        return;
      }
      pushSnapshot();
      nodesOut.outgoers("edge").select();
      nodesOut.outgoers("edge").addClass("outgoing");
      break;

    case "incomingEdges":
      let nodesIn = getCy().nodes(":selected:visible");
      if (nodesIn.length == 0) {
        showAlert("no selected nodes.");
        return;
      }
      pushSnapshot();
      nodesIn.incomers("edge:visible").select();
      nodesIn.incomers("edge:visible").addClass("incoming");
      break;

    case "bothEdges":
      let nodes = getCy().nodes(":selected:visible");
      if (nodes.length == 0) {
        showAlert("no selected nodes.");
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

    case "enterFkSynthesisMode":
      enterFkSynthesisMode(false);
      break;

    case "enterFkDetailedMode":
      enterFkDetailedMode(false);
      break;

    //--- select by data Snapshot done into function

    case "selectEdgesByCategory":
      //fillInEdgesCategories();
      break;

    case "edgeIsTriggerGenerated":
      selectEdgesByNativeCategories("trigger_impact");
      break;

    case "edgeIsNullable":
      getCy().edges();
      const nullableEdges = getCy().edges(".nullable");
      nullableEdges.select();
      break;

    case "edgeIsOnDeleteCascade":
      getCy().edges();
      const cascadeEdges = getCy().edges(".delete_cascade");
      cascadeEdges.select();
      break;

    case "edgeIsASimplifiedNode":
      const simplifiedEdges = getCy().edges(".simplified");
      simplifiedEdges.select();
      break;

    case "labelShow":
      // Show visible edges, or selected ones if any are selected
      let edgesToShow = perimeterForEdgesAction();

      for (let edge of edgesToShow) {
        if (edge.hasClass("fk_detailed")) {
          edge.addClass("showColumns");
          //labelToShow = ele.data('columnsLabel').replace('\n', "<BR/>");
        } else edge.addClass("showLabel");
      }
      break;

    case "labelHide":
      let edgesToHide = perimeterForEdgesAction();
      edgesToHide.removeClass("showLabel showColumns");
      break;

    case "increase-font-edge":
      changeFontSizeEdge(3);
      break;
    case "decrease-font-edge":
      changeFontSizeEdge(-1);
      break;

    case "hideEdgeSelected":
      pushSnapshot();
      getCy().edges(":selected").hide();
      break;

    case "hideEdgeNotSelected":
      pushSnapshot();
      getCy()
        .edges(":visible")
        .filter(function (node) {
          return !node.selected();
        })
        .hide();
      break;

    case "swapEdgeHidden":
      pushSnapshot();
      const edgesVisible = getCy().edges(":visible");
      const edgesHidden = getCy().edges(":hidden");
      edgesVisible.hide();
      edgesHidden.show();
      break;

    case "NoneEdgeSelected":
      pushSnapshot();
      getCy().edges().show();
      break;

    case "listEdges":
      sendEdgeListToHtml();
      break;

    case "simplifyAssociations":
      pushSnapshot();
      simplifyAssociations();
      break;

    case "restoreAssociations":
      pushSnapshot();
      restoreAssociations();
      createCustomCategories(getLocalDBName()); // explication needed
      break;

    case "selectAssociations":
      var simpleEdges = getCy().edges(".simplified");
      if (simpleEdges.length == 0) showAlert("no *-*  associations to select.");
      else {
        pushSnapshot();
        simpleEdges.select();
      }
      break;

    case "generateTriggers":
      pushSnapshot();
      generateTriggers(getCy().nodes()).then(() => metrologie());
      break;

    case "removeTriggers":
      pushSnapshot();
      removeTriggers();
      break;

    case "deleteEdgesSelected":
      const edgesToKill = getCy().edges(":selected:visible");
      if (edgesToKill.length == 0) {
        showAlert("no selected edges.");
        return;
      }

      if (edgesToKill.length > 1) {
        // confirm title, messagge
        showMultiChoiceDialog(
          `⚠️ delete ${edgesToKill.length} edges`,
          `Confirm ?`,
          [
            {
              label: "✅ Yes",
              onClick: () => {
                pushSnapshot();
                edgesToKill.remove();
                metrologie();
              },
            },

            {
              label: "❌ No",
              onClick: () => {}, // rien
            },
          ]
        );

        break;
      } else {
        pushSnapshot();
        edgesToKill.remove();
        metrologie;
      }

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
  if (!getCy()) return;
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
 used to resize node layout in any way horizontal or vertical or both 
*/

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
