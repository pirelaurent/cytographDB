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
// to have init of events

import {
  loadInitialGraph,
  loadGraphState,
  showOverlayWithFiles,
  saveGraphState,
  saveGraphToFile,
} from "../graph/loadSaveGraph.js";

import { connectToDb, generateTriggers } from "../dbFront/tables.js";

import { listNodesToHtml } from "../ui/htmlNodes.js";
import {  sendEdgeListToHtml } from "../ui/htmlEdges.js";

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
  swapHidden,
  setAndRunLayoutOptions,
  selectNodesFromSelectedEdges,
  selectTargetNodesFromSelectedEdges,
  selectSourceNodesFromSelectedEdges,
  perimeterForNodesAction,
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
  selectInputBetween,
  noProportionalSize,
  increaseFontSizeEdge,
  increaseFontSize,
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
  modalSelectByName,
  closeNameFilterModal,
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

  switch (option) {
    case "showall":
      pushSnapshot();
      {
        getCy()
          .nodes()
          .forEach((node) => node.show());
        getCy()
          .edges()
          .forEach((edge) => edge.show());
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
      getCy()
        .elements()
        .forEach((ele) => {
          const classesToKeep = ["hidden"];
          const currentClasses = ele.classes();

          // Filtrer les classes à retirer
          const toRemove = currentClasses.filter(
            (c) => !classesToKeep.includes(c)
          );
          // apply
          ele.removeClass(toRemove.join(" ")); // retire uniquement les classes non protégées
        });

      getCy().style(mergedStyles);
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
        showError("connection failed: " + err.message)
      );
      break;

    case "loadFromDb":
      connectToDb(menuItemElement)
        .then(() => {
          let dbName = getLocalDBName();
          if (dbName != null) loadInitialGraph();
        })
        .catch((err) => showError("loadFromDB: " + err.message));
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
  all menus for nodes 

*/
export function menuNodes(option) {
  // set global before calling action

  switch (option) {
    //-------- Select nodes
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

    case "invert":
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
        if (nodes.length === 0) return;
        nodes.filter(".hasTriggers").select();
      }
      break;

    case "nodeIsAssociation":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(".association").select();
      }
      break;

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
        if (nodes.length === 0) return;
        nodes.filter(".leaf").select();
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

    //---------- hide nodes -

    /*
     hidden nodes are automatically unselected 
    */
    case "hideSelected":
      hideSelected();
      break;

    case "hideNotSelected":
      hideNotSelected();
      break;

    case "hideNone":
      pushSnapshot();
      showAll();
      break;

    case "swapHidden":
      swapHidden();
      break;

    case "selectNodesFromSelectedEdges":
      selectNodesFromSelectedEdges();
      break;

    case "selectSourceNodes":
      selectSourceNodesFromSelectedEdges();
      break;

    case "selectDestNodes":
      selectTargetNodesFromSelectedEdges();
      break;

    //----------- FOLLOW nodes -

    case "followOutgoing":
      pushSnapshot();
      follow("outgoing");
      break;
    case "followIncoming":
      pushSnapshot();
      follow("incoming");
      break;

    case "followBoth":
      pushSnapshot();
      follow("both");
      break;

    case "followCrossAssociations":
      pushSnapshot();
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
    case "increase-font":
      increaseFontSize(3);
      break;
    case "decrease-font":
      increaseFontSize(-1);
      break;

    case "labelNodeFull":
      //------------------
      perimeterForNodesAction().forEach((node) => {
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
      perimeterForNodesAction().forEach((node) => {
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
    case "listNodes":
      listNodesToHtml();
      break;

    //---------------- nodes connected to selected edges
    case "fromEdgesSelected":
      {
        pushSnapshot();
        getCy().edges(":selected").connectedNodes().select();
      }
      break;

    case "deleteNodesSelected":
      deleteNodesSelected();

      break;
  }
}

/*
  menu edges relays 

*/
export function menuEdges(option) {
  // if we enter an option, we flag the graph as 'changed'

  // select edges
  switch (option) {

case "refreshEdges":
  { alert('pouet');
    metrologie();
  } break;

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
      increaseFontSizeEdge(3);
      break;
    case "decrease-font-edge":
      increaseFontSizeEdge(-1);
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
      generateTriggers(getCy().nodes())
      .then (()=>metrologie()); 
      break;

    case "removeTriggers":
      pushSnapshot();
      getCy().edges(".trigger_impact").remove();

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

// Boutons modaux
document
  .getElementById("modalNameFilterOk")
  .addEventListener("click", modalSelectByName);
document
  .getElementById("modalNameFilterCancel")
  .addEventListener("click", closeNameFilterModal);

/*
document.getElementById('modalNameFilterInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); 
    modalSelectByName();
  }
  if (e.key === 'Escape') closeNameFilterModal();
});
*/
// close when a click outside
document
  .getElementById("nameFilterModal")
  .addEventListener("click", function (e) {
    if (e.target === this) closeNameFilterModal();
  });

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
