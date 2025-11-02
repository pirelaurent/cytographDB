"use strict"

import { listNodesToHtml } from "../ui/htmlNodes.js";

import {
  follow,
  followCrossAssociations,
  followTree,
} from "../graph/walker.js";

import {
  getCy,
  showAll,
  restrictToVisible,
  hideSelected,
  hideNotSelected,
  swapHidden,
  selectNodesFromSelectedEdges,
  selectTargetNodesFromSelectedEdges,
  selectSourceNodesFromSelectedEdges,
  perimeterForNodesSelection,
} from "../graph/cytoscapeCore.js";

import {
  pushSnapshot,
} from "../graph/snapshots.js";

import {
  modeSelect,
  AND_SELECTED,
  deleteNodesSelected,
} from "./dialog.js";

import { NativeCategories } from "../util/common.js";

/*
  ------------------------------------- Nodes 

*/
export function menuNodes(option, item, whichClic = "left") {
  if (whichClic == "right") return;
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
        nodes.filter(`.${NativeCategories.ORPHAN}`).select();
      }
      break;

    case "nodeIsRoot":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        // due to previously save json
        nodes.forEach((n) => {
          if (
            n.hasClass(NativeCategories.ROOT) &&
            !n.hasClass(NativeCategories.ASSOCIATION) &&
            !n.hasClass(NativeCategories.MULTI_ASSOCIATION)
          )
            n.select();
        });
      }
      break;

    case "nodeIsLeaf":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes == null) return;
        if (nodes.length === 0) return;
        nodes.filter(`.${NativeCategories.LEAF}`).select();
      }
      break;

    case "nodeIsAssociation":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(`.${NativeCategories.ASSOCIATION}`).select();
      }
      break;

    case "nodeIsMultiAssociation":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(`.${NativeCategories.MULTI_ASSOCIATION}`).select();
        nodes.filter(`.${NativeCategories.ASSOCIATION}`).select();
      }
      break;

    case "nodeHasTriggers":
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(`.${NativeCategories.HAS_TRIGGERS}`).select();
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

    case "nodeIsComposite":
      getCy().nodes(".composite").select();
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

    //------------------------------------------------ Nodes  Follow tree
    case "followIncomingTree":
      followTree("incoming");
      break;

    case "followOutgoingTree":
      followTree("outgoing");
      break;

    case "followBothTree":
      followTree("both");
      break;

    case "allowPropagation":
      //case "followCrossAssociations":
      followCrossAssociations();
      break;



    //----------------------------------  nodes Delete

    case "deleteNodesSelected":
      deleteNodesSelected();
      break;
  }
}
