"use strict";

import { listNodesToHtml } from "../ui/htmlNodes.js";
import { getCy } from "../graph/cytoscapeCore.js";
import {
  follow,
  followCrossAssociations,
  followTree,
} from "../graph/walker.js";

import {
  showAll,
  hideSelected,
  hideNotSelected,
  selectNone,
  selectAllVisibleNodes,
  swapSelected,
  swapHidden,
  selectNodesFromSelectedEdges,
  selectTargetNodesFromSelectedEdges,
  selectSourceNodesFromSelectedEdges,
} from "../core/nodeOps.js";

import {
  perimeterForNodesSelection,
  restrictToVisible,
} from "../core/perimeter.js";

import { pushSnapshot } from "../util/snapshots.js";

import { modeSelect, AND_SELECTED, deleteNodesSelected } from "./dialog.js";

import { NativeCategories } from "../util/common.js";

/*
  ------------------------------------- Nodes 

*/
export function menuNodes(option, item, whichClic = "left") {
  if (whichClic == "right") return;
  switch (option) {
    //-------- Nodes Select

    case "all":
      selectAllVisibleNodes(); // in cytoscapeCore to be shared with crtl a
      break;

    case "none":
      selectNone();
      break;

    case "swapSelected":
      swapSelected();
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



case "nodeIsRoot": {
  const cy = getCy();
  const nodes = perimeterForNodesSelection();
  if (!nodes || nodes.empty()) return;

  cy.batch(() => {
    nodes
      .filter(n =>
        n.hasClass(NativeCategories.ROOT) &&
        !n.hasClass(NativeCategories.ASSOCIATION) &&
        !n.hasClass(NativeCategories.MULTI_ASSOCIATION)
      )
      .select();
  });
  break;
}


    case "nodeIsLeaf":
      {
        const cy = getCy();
        let nodes = perimeterForNodesSelection();
        if (nodes == null) return;
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${NativeCategories.LEAF}`).select();
        });
      }
      break;

    case "nodeIsAssociation":
      {
        const cy = getCy();
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${NativeCategories.ASSOCIATION}`).select();
        });
      }
      break;

case "nodeIsMultiAssociation": {
  const cy = getCy();
  let nodes = perimeterForNodesSelection();
  if (!nodes?.empty) nodes = cy.collection(nodes);
  if (!nodes || nodes.empty()) return;

  cy.batch(() => {
    nodes
      .filter(n =>
        n.hasClass(NativeCategories.MULTI_ASSOCIATION) ||
        n.hasClass(NativeCategories.ASSOCIATION)
      )
      .select();
  });
  break;
}


    case "nodeHasTriggers":
      const cy = getCy();
      {
        let nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${NativeCategories.HAS_TRIGGERS}`).select();
        });
      }
      break;

    case "looping":
      {
        const cy = getCy();
        let nodes = perimeterForNodesSelection();

        if (nodes == null) return;
        pushSnapshot();
        const nodesWithSelfLoop = nodes.filter((node) => {
          return node.connectedEdges().some((edge) => {
            return edge.source().id() === edge.target().id();
          });
        });
        //console.log(`Found ${nodesWithSelfLoop.length} nodes with self-loops.`);
        cy.batch(() => {
          if (modeSelect() == AND_SELECTED) nodes.unselect();
          nodesWithSelfLoop.select();
        });
      }
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
