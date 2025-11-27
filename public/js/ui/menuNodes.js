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
} from "../core/perimeter.js";

import { pushSnapshot } from "../util/snapshots.js";

import { modeSelect, AND_SELECTED, deleteNodesSelected } from "./dialog.js";

import {
  ORPHAN,
  ROOT,
  LEAF,
  ASSOCIATION,
  MULTIASSOCIATION,
  HAS_TRIGGERS,
} from "../util/constants.js";

/*
  ------------------------------------- Nodes 

*/
export function menuNodes(option, item, whichClic = "left") {
  if (whichClic == "right") return;

    // shared var for this menu options
    const cy = getCy();
    let nodes;

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



    // -----------------------------------------Nodes filter by

    // *** by Name *** is under clic event -> openNameFilterModal

    // --------------- native categories




    case "nodeIsOrphan":

        nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        nodes.filter(`.${ORPHAN}`).select();
        nodes.filter(':selected').removeClass('faded');
        nodes.filter(':unselected').addClass('faded');

      break;

    case "nodeIsRoot":
     
      nodes = perimeterForNodesSelection();
      if (!nodes || nodes.empty()) return;

      cy.batch(() => {
        nodes
          .filter(n =>
            n.hasClass(ROOT)
          )
          .select();

        nodes.filter(':selected').removeClass('faded');
        nodes.filter(':unselected').addClass('faded');
      });
      break;
    


    case "nodeIsLeaf":
  
         nodes = perimeterForNodesSelection();
        if (nodes == null) return;
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${LEAF}`).select();
          nodes.filter(':selected').removeClass('faded');
          nodes.filter(':unselected').addClass('faded');
        });
      
      break;

    case "nodeIsAssociation":
  
         nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${ASSOCIATION}`).select();
            nodes.filter(':selected').removeClass('faded');
        nodes.filter(':unselected').addClass('faded');
        });
  
      break;

    case "nodeIsMultiAssociation": 
      nodes = perimeterForNodesSelection();
      if (!nodes?.empty) nodes = cy.collection(nodes);
      if (!nodes || nodes.empty()) return;

      cy.batch(() => {
       // same as  nodes.filter(`.${MULTIASSOCIATION}`).select();
        nodes
          .filter(n =>
            n.hasClass(MULTIASSOCIATION)
          )
          .select();
      nodes.filter(':selected').removeClass('faded');
      nodes.filter(':unselected').addClass('faded');
      });

      break;


    case "nodeHasTriggers":

   
         nodes = perimeterForNodesSelection();
        if (nodes.length === 0) return;
        cy.batch(() => {
          nodes.filter(`.${HAS_TRIGGERS}`).select();
          nodes.filter(':unselected').addClass('faded');
        });

      break;

    case "looping":
  
       nodes = perimeterForNodesSelection();

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
          nodes.filter(':selected').removeClass('faded');
          nodes.filter(':unselected').addClass('faded');
        });
      
 
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
