"use strict";

import { removeTriggers, generateTriggers } from "../dbFront/tables.js";

import { sendEdgeListToHtml } from "../ui/htmlEdges.js";

import {
  simplifyAssociations,
  restoreAssociations,
} from "../graph/walkModel.js";

import { getCy } from "../graph/cytoscapeCore.js";

import { metrologie } from "../core/metrology.js";
import { selectEdgesBetweenSelectedNodes } from "../core/edgeOps.js";

import {
  enterFkDetailedMode,
  enterFkSynthesisMode,
} from "../graph/detailedEdges.js";

import { pushSnapshot } from "../util/snapshots.js";

import { showMultiChoiceDialog, showAlert } from "./dialog.js";

import { getLocalDBName } from "../dbFront/tables.js";
import { createCustomCategories } from "../filters/categories.js";
import { selectEdgesByNativeCategories } from "./custom.js";

/*
  //------------------------------------------------------------------menu edges relays 
*/

export function menuEdges(option, item, whichClic = "left") {
  // if we enter an option, we flag the graph as 'changed'
  if (whichClic == "right") return; //later: options
  // select edges
  switch (option) {
    case "allEdges": {
      const cy = getCy();
      const toSelect = cy.edges(":visible:unselected");
      if (toSelect.length === 0) break; // rien à faire → pas de snapshot inutile
      pushSnapshot();
      cy.batch(() => {
        toSelect.select();
      });
      break;
    }

    case "noEdges": {
      pushSnapshot();
      const cy = getCy();
      cy.batch(() => {
        getCy().edges().unselect();
      });
      break;
    }

    case "swapEdges": {
      const cy = getCy();
      const visibleEdges = cy.edges(":visible");
      if (visibleEdges.empty()) return;

      pushSnapshot();

      cy.batch(() => {
        const toSelect = visibleEdges.filter(":unselected");
        const toUnselect = visibleEdges.filter(":selected");
        toSelect.select();
        toUnselect.unselect();
      });
      break;
    }

    case "enterFkSynthesisMode":
      enterFkSynthesisMode(false);
      break;

    case "enterFkDetailedMode":
      enterFkDetailedMode(false);
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

    case "selectOutgoingEdges":
      let nodesOut = getCy().nodes(":selected:visible");
      if (nodesOut.length == 0) {
        showAlert("no selected nodes.");
        return;
      }
      pushSnapshot();
      nodesOut.outgoers("edge").select();
      nodesOut.outgoers("edge").addClass("outgoing");
      break;

    case "selectIncomingEdges":
      let nodesIn = getCy().nodes(":selected:visible");
      if (nodesIn.length == 0) {
        showAlert("no selected nodes.");
        return;
      }
      pushSnapshot();
      nodesIn.incomers("edge:visible").select();
      nodesIn.incomers("edge:visible").addClass("incoming");
      break;

    case "selectBothEdges":
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

    //--- select by data Snapshot done into function

    case "edgeIsTriggerGenerated":
      selectEdgesByNativeCategories("trigger_impact");
      break;

    case "edgeIsNullable":
      const nullableEdges = getCy().edges(".nullable");
      nullableEdges.select();
      break;

    case "edgeIsOnDeleteCascade":
      const cascadeEdges = getCy().edges(".delete_cascade");
      cascadeEdges.select();
      break;

    case "edgeIsOnDeleteRestrict":
      selectEdgesByNativeCategories("delete_restrict");
      // const restrictEdges = getCy().edges(".delete_restrict");
      // restrictEdges.select();
      break;

    case "edgeIsASimplifiedNode":
      const simplifiedEdges = getCy().edges(".simplified");
      simplifiedEdges.select();
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

    case "showAllEdges":
      pushSnapshot();
      getCy().edges().show();
      break;

    case "listEdgesAll":
      sendEdgeListToHtml(false);
      break;
    case "listEdgesSelected":
      sendEdgeListToHtml(true);
      break;

    case "selectAssociations":
      var simpleEdges = getCy().edges(".simplified");
      if (simpleEdges.length == 0) showAlert("no *-*  associations to select.");
      else {
        pushSnapshot();
        simpleEdges.select();
      }
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

    case "simplifyAssociations":
      pushSnapshot();
      simplifyAssociations();
      break;

    case "generateTriggers":
      pushSnapshot();
      generateTriggers(getCy().nodes()).then(() => metrologie());
      break;

    case "removeTriggers":
      pushSnapshot();
      removeTriggers();
      break;

    case "restoreAssociations":
      pushSnapshot();
      restoreAssociations();
      createCustomCategories(getLocalDBName()); // explication needed
      break;

    case "test": {
      break;
    }
  }
  metrologie();
}
