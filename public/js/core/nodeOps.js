import { getCy } from "../graph/cytoscapeCore.js";
import { NativeCategories } from "../util/common.js";
import { metrologie } from "../core/metrology.js";
import { pushSnapshot } from "../util/snapshots.js";
import {
  restrictToVisible,
  perimeterForNodesSelection,
  perimeterForNodesAction,
} from "../core/perimeter.js";


import {    
    setAndRunLayoutOptions} from "../core/layout.js";
/*
  full graph visible
*/
export function showAll() {
  getCy().nodes().show();
  getCy().edges().show();
  document.getElementById("cy").style.backgroundColor = "white";

  requestAnimationFrame(() => {
    getCy().fit();
  });

  metrologie();
}

export function hideSelected() {
  const cy = getCy();
  pushSnapshot("hideSelected");
  let nodesToHide = getCy().nodes(":selected");
  nodesToHide.hide();
  // nodesToHide.unselect();
  cy.fit(cy.nodes(":visible"), 30); // padding 30px
  metrologie();
}

export function hideNotSelected() {
  pushSnapshot("hideNotSelected");
  getCy()
    .nodes(":visible")
    .filter(function (node) {
      return !node.selected();
    })
    .hide();
  getCy().fit(); //cy.nodes(":visible"), 50); // padding 30px
  metrologie();
}

export function hideNotSelectedThenDagre() {
  {
    hideNotSelected();
    // cannot reorg if too few nodes
    if (getCy().nodes(":selected:visible").length > 3) {
      setAndRunLayoutOptions("dagre");
    }
  }
  metrologie();
}

export function selectAllVisibleNodes() {
  let cy = getCy();
  if (cy) {
    cy.batch(() => {
      pushSnapshot("selectAllVisibleNodes");
      let nodes = restrictToVisible() ? cy.nodes(":visible") : cy.nodes();
      nodes.select();
    });
  }
  metrologie();
}

/*
 node select catch all edges associated.
 To maintain selected edges, store them then restore 
*/

export function selectNodesFromSelectedEdges() {
  pushSnapshot("selectNodesFromSelectedEdges");
  const cy = getCy();

  const selectedEdges = cy.edges(":selected:visible");
  const connectedNodes = selectedEdges.connectedNodes(":visible");

  connectedNodes.select();

  // Restaure l’état initial des arêtes sélectionnées :
  cy.edges(":selected").unselect();
  selectedEdges.select();

  metrologie();
}

export function selectSourceNodesFromSelectedEdges() {
  pushSnapshot("selectSourceNodesFromSelectedEdges");
  const cy = getCy();
  const srcNodes = cy
    .edges(":selected:visible")
    .sources() // récupère tous les nodes source
    .filter(":visible"); // garde seulement les visibles (comme ton code)

  srcNodes.select();
  metrologie();
}

export function selectTargetNodesFromSelectedEdges() {
  pushSnapshot("selectTargetNodesFromSelectedEdges");
  const cy = getCy();

  const tgtNodes = cy
    .edges(":selected:visible")
    .targets() // récupère tous les nodes cible
    .filter(":visible");

  tgtNodes.select();
  metrologie();
}

export function selectOutputBetween(min, max) {
  const cy = getCy();
  let nodes = perimeterForNodesSelection();
  if (nodes == null) return;
  pushSnapshot("selectOutputBetween");
  cy.batch(() => {
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
        var noLoop = loopEdges.length === 0;
        if (nOutput == 0 || noLoop) node.select();
      } else {
        if (nOutput > min && nOutput < max) {
          node.select();
        }
      }
    });
  });
}
/*
 select nodes with incoming edges between min max
*/

export function selectInputBetween(min, max) {
  const cy = getCy();

  let nodes = perimeterForNodesSelection();
  if (nodes == null) return;
  cy.batch(() => {
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
  }); // batch
}

export function changeFontSizeNode(value, increase = true) {
  let selectedNodes = perimeterForNodesAction();

  // getCy().style().selector("node").style("font-size", newSize).update();
  selectedNodes.forEach((node) => {
    const currentFontSize = parseFloat(node.style("font-size"));

    const newSize = increase ? Math.max(6, currentFontSize + value) : value;
    node.style("font-size", newSize);
  });
}

/*
 increase size of nodes against number of edges 
*/
export function setProportionalNodeSizeByLinks() {
  let selectedNodes = perimeterForNodesAction();

  // 1. Calculer le nombre de liens pour chaque nœud
  selectedNodes.forEach((node) => {
    setProportionalSize(node);
  });
}
/*
 adapt the shape against the number of edges 
*/
function setProportionalSize(node) {
  let degree = node.connectedEdges().length;
  node.data("degree", degree);
  if (degree == 0) degree = 1;

  // min max links, min size maxsize
  const size = mapValue(degree, 1, 40, 40, 100);

  // leave as is in cyStyles
  if (node.hasClass(NativeCategories.LEAF)) {
    node.style({
      width: size,
      height: size * 0.866, // equilateral (Math.sqrt(3) / 2) * L;
    });
    return;
  }

  // muliple check for compatibility with stored json
  if (
    node.hasClass(NativeCategories.ROOT) &&
    !node.hasClass(NativeCategories.ASSOCIATION) &&
    !node.hasClass(NativeCategories.MULTI_ASSOCIATION)
  ) {
    node.style({
      width: 20,
      height: 45,
    });
    return;
  }

  node.style({
    width: size,
    height: size,
  });
  //document.getElementById("cy").style.backgroundColor = "lightgray";
}

export function noProportionalSize() {
  getCy()
    .nodes()
    .forEach((node) => {
      node.removeData("degree");
      node.removeStyle("width");
      node.removeStyle("height");
    });
}

/*
  set size according to number of edges 
  when coming back from a Json
*/

export function restoreProportionalSize() {
  const cy = getCy();
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      setProportionalSize(node);
    });
  });
}

// Helper pour interpoler une valeur entre deux bornes
function mapValue(value, inMin, inMax, outMin, outMax) {
  const clamped = Math.max(inMin, Math.min(value, inMax));
  const ratio = (clamped - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

// alias nodes
export function labelNodeAlias() {
  const cy = getCy();
  cy.batch(() => {
    perimeterForNodesAction().forEach((node) => {
      if (node.data("alias") != null) {
        node.data("label", node.data("alias"));
      }
    });
  });
}

export function labelNodeId() {
  const cy = getCy();
  cy.batch(() => {
    perimeterForNodesAction().forEach((node) => {
      node.data("label", node.id());
    });
  });
}

export function labelNodeHide() {
  const cy = getCy();
  cy.batch(() => {
    perimeterForNodesAction().forEach((node) => {
      node.data("label", ".");
    });
  });
}

//-------------------
export function bringSelectedToFront() {
  getCy().nodes(":selected").css("z-index", 100);
  getCy().nodes(":unselected").css("z-index", 10);
}

export function bringSelectedToBack() {
  getCy().nodes(":selected").css("z-index", 0);
  getCy().nodes(":unselected").css("z-index", 10);
}

export function swapHidden() {
  const cy = getCy();
  pushSnapshot("swapHidden");
  pushSnapshot("swapHidden2");

  // 1) calcul de l’état final des nœuds
  const nodesToShow = cy.nodes(":hidden");
  const nodesToHide = cy.nodes(":visible");

  // 2) swap des nœuds (en batch pour éviter les recomputes)
  cy.batch(() => {
    nodesToHide.hide();
    nodesToShow.show();
  });

  // 3) après le batch, l’état visible() est fiable -> on recalcule les arêtes à montrer
  const edges = cy.edges();
  const edgesToShow = edges.filter(
    (e) => e.source().visible() && e.target().visible()
  );

  // D’abord, tout masquer proprement…
  edges.hide();

  // …puis ne montrer que celles qui doivent l’être
  edgesToShow.show();

  // avoid blnak screen
  getCy().fit();

  metrologie();
}
