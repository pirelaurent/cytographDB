"use strict";

import { getCyStyles } from "./cyStyles.js";
import { showAlert } from "../ui/dialog.js";
import { modeSelect, AND_SELECTED } from "../ui/dialog.js";
import { getLocalDBName } from "../dbFront/tables.js";
import {
  createCustomCategories,
  getCustomStyles,
} from "../filters/categories.js";
import { fillInGuiNodesCustomCategories } from "../ui/custom.js";
import { pushSnapshot } from "./snapshots.js";

//-------------------
/*
 cy defined in a module cannot be accessed directly
 use methods from outside
*/
let cy;
let detachBlockers = null;

export function setCy(instance) {
  cy = instance;

  // not enough for windows event interceptor
  //const container = cy.container();

  if (detachBlockers) {
    detachBlockers();
    detachBlockers = null;
  }

  document.addEventListener("contextmenu", (e) => {
    //  console.log("contextmenu global bloqué");
    e.preventDefault();
  });

  // instance but not execute until a new call to setCy
  detachBlockers = () => {
    document.removeEventListener("contextmenu", onContextMenu, true);
    document.removeEventListener("mousedown", onMouseDownRight, true);
  };
}

export function getCy() {
  return cy;
}
//--------------------------
export function initializeGraph(data, fromDisk = false) {
  // cy a été créé avec des data vides , mais si on s'en est servi, faut nettoyer
  if (typeof cy !== "undefined" && cy) {
    cy.elements().remove();
  }
  cy.add(data);

  //console.log(cy.edges()); // on a bien columnsLabel dans data

  let current_db = getLocalDBName();

  // customize nodes**to be moved after reduction
  //createNativeNodesCategories();

  createCustomCategories(current_db);
  let moreStyles = getCustomStyles(current_db);

  let mergedStyles = getCyStyles().concat(moreStyles);
  cy.style(mergedStyles).update();

  fillInGuiNodesCustomCategories();

  cy.once("layoutstop", () => {});

  //avoid layout when come from disk
  if (!fromDisk) {
    setAndRunLayoutOptions();
  }

  metrologie();
}
/*
  full graph visible
*/
export function showAll() {
  getCy().nodes().show();
  getCy().edges().show();
  document.getElementById("cy").style.backgroundColor = "white";
  metrologie();
}

export function hideSelected() {
  pushSnapshot();
  let nodesToHide = getCy().nodes(":selected");
  nodesToHide.hide();
  nodesToHide.unselect();
  cy.fit(cy.nodes(":visible"), 30); // padding 30px
  metrologie();
}

export function hideNotSelected() {
  pushSnapshot();
  getCy()
    .nodes(":visible")
    .filter(function (node) {
      return !node.selected();
    })
    .hide();
  cy.fit(cy.nodes(":visible"), 30); // padding 30px
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
  if (cy) {
    pushSnapshot();
    let nodes = restrictToVisible()
      ? getCy().nodes(":visible")
      : getCy().nodes();
    nodes.select();
  }
  metrologie();
}

export function swapHidden() {
  pushSnapshot();
  pushSnapshot();
  const cy = getCy();

  // 1) calcul de l’état final des nœuds
  const nodesToShow = cy.nodes(":hidden");
  const nodesToHide = cy.nodes(":visible");

  // 2) swap des nœuds (en batch pour éviter les recomputes)
  cy.startBatch();
  nodesToHide.hide();
  nodesToShow.show();
  cy.endBatch();

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
/*
 node select catch all edges associated.
 To maintain selected edges, store them then restore 
*/

export function selectNodesFromSelectedEdges() {
  pushSnapshot();
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
  pushSnapshot();
  const cy = getCy();
  const srcNodes = cy
    .edges(":selected:visible")
    .sources() // récupère tous les nodes source
    .filter(":visible"); // garde seulement les visibles (comme ton code)

  srcNodes.select();
  metrologie();
}

export function selectTargetNodesFromSelectedEdges() {
  pushSnapshot();
  const cy = getCy();

  const tgtNodes = cy
    .edges(":selected:visible")
    .targets() // récupère tous les nodes cible
    .filter(":visible");

  tgtNodes.select();
  metrologie();
}

/*
 leaved to true to simplify. Could be set through a gui option. 
*/
export function restrictToVisible() {
  return true;
}

//----------- some layouts parameters

export function setAndRunLayoutOptions(option) {
  let layoutName = option ?? "cose-bilkent";
  // choix du périmètre

  let selectedNodes = perimeterForNodesAction();
  if (selectedNodes.length < 3) {
    showAlert(
      "not enough nodes to calculate layout (>3).<br/> Check your selection"
    );
    return;
  }
  // add edges to selection to see them after reord
  const connectedEdges = selectedNodes
    .connectedEdges()
    .filter(
      (edge) =>
        selectedNodes.contains(edge.source()) &&
        selectedNodes.contains(edge.target())
    );

  const selection = selectedNodes.union(connectedEdges);

  //console.log("setAndRunLayoutOptions:" + layoutName);
  //common
  let layoutOptions = {
    name: layoutName,
    animate: true,
    nodeDimensionsIncludeLabels: true,
    fit: true,
  };

  switch (layoutName) {
    case "dagre":
      Object.assign(layoutOptions, {
        rankDir: "LR", // Left to Right
        nodeSep: 50,
        edgeSep: 10,
        rankSep: 100,
        numIter: 1000,
      });
      break;

    case "cose":
      Object.assign(layoutOptions, {
        nodeRepulsion: 1000000,
        gravity: 10,
        // idealEdgeLength: 100,
        // edgeElasticity: 0.4,
        // numIter: 1000,
      });
      break;

    case "cose-bilkent":
      Object.assign(layoutOptions, {
        name: "cose-bilkent", // redéclaré explicitement si nécessaire
        nodeRepulsion: 1000000,
        idealEdgeLength: 160,
        edgeElasticity: 0.1,
        gravity: 0.25,
        numIter: 1000,
      });
      break;

    case "circle":
      Object.assign(layoutOptions, {
        avoidOverlap: true,
        padding: 30,
        numIter: 1000,
      });
      break;

    case "breadthfirst":
      const roots = selectedNodes.filter(
        (n) => n.incomers("edge").length === 0
      );
      Object.assign(layoutOptions, {
        orientation: "horizontal",
        directed: true,
        spacingFactor: 0.7,
        roots: roots,
      });
      break;

    case "elk":
      Object.assign(layoutOptions, {
        algorithm: "layered",
        direction: "RIGHT",
        spacing: 50,
        nodePlacement: "BRANDES_KOEPF",
      });
      break;
  }

  selection.layout(layoutOptions).run();
  cy.fit();
}

/*
 fix the perimer of actions
 if selection : acts on selection
 otherwise acts on all nodes eventually visible only 
*/
export function perimeterForNodesAction() {
  let nodes;

  if (restrictToVisible()) {
    nodes = cy.nodes(":selected:visible");
    if (nodes.length == 0) nodes = cy.nodes(":visible");
  } else {
    nodes = cy.nodes(":selected");
    if (nodes.length == 0) nodes = cy.nodes();
  }
  return nodes;
}

/*
 acess mode regarding options in menus 
*/

export function perimeterForNodesSelection() {
  // if restrict take visible otherwise take whole graph

  let nodes = cy.nodes(":visible");
  // If AND to come restrict to current selected
  if (modeSelect() == AND_SELECTED) {
    nodes = cy.nodes(":visible:selected");
    if (nodes.length == 0) {
      let msg = "Nothing to filter with an AND operation.";
      msg += "<br/>Needs to have already selected nodes.";
      msg += "<br/> ( or change for OR operation )";
      showAlert(msg);
      return null;
    }
  }

  // return partial nodes but all unselected if AND
  if (modeSelect() == AND_SELECTED) nodes.unselect();
  return nodes;
}
/*
 action on elected if any, all otherwise
*/
export function perimeterForEdgesAction() {
  let edges;

  if (restrictToVisible()) {
    edges = cy.edges(":selected:visible");
    if (edges.length == 0) edges = cy.edges(":visible");
  } else {
    edges = cy.edges(":selected");
    if (edges.length == 0) edges = cy.edges();
  }
  return edges;
}

export function perimeterForEdgesSelection() {
  // if restrict take visible otherwise take whole graph

  let edges = cy.edges(":visible");
  // If AND to come restrict to current selected
  if (modeSelect() == AND_SELECTED) {
    edges = cy.edges(":visible:selected");
    if (edges.length == 0) {
      let msg = "Nothing to filter with an AND operation.";
      msg += "<br/>Needs to have already selected edges.";
      msg += "<br/> ( or change for OR operation )";
      showAlert(msg);
      return null;
    }
  }

  // return partial nodes but all unselected if AND
  if (modeSelect() == AND_SELECTED) edges.unselect();
  return edges;
}

//------------- display counts in menu bar------------
export function metrologie() {
  //display some measures

  const wholeNodesVisible = cy.nodes(":visible").length;
  const selectedCountNodesVisible = cy.nodes(":selected:visible").length;
  const wholeNodesHidden = cy.nodes(":hidden").length;
  const selectedCountNodesHidden = cy.nodes(":selected:hidden").length;
  const labelNodes = document.querySelector("#NodesId");

  const wholeEdgesVisible = cy.edges(":visible").length;

  const selectedCountEdgesVisible = cy.edges(":selected:visible").length;
  const wholeEdgesHidden = cy.edges(":hidden").length;
  const selectedCountEdgesHidden = cy.edges(":selected:hidden").length;
  const labelEdges = document.querySelector("#EdgesId");
  /*
 to obective the perimeter : enhance the number 
 if select = 0 : small font and big font for total  
 else select big , total small 
 */

  let big = '<span class = "bigPerim">';
  let small = '<span class = "smallPerim">';
  let display = "Nodes&nbsp;&nbsp;";

  if (selectedCountNodesVisible > 0) {
    display += `${big}${selectedCountNodesVisible}/</span> ${small}${wholeNodesVisible}</span>`;
  } else {
    display += `${small}${selectedCountNodesVisible}/</span> ${big}${wholeNodesVisible}</span>`;
  }

  // hidden
  let dispHidden = `&nbsp;&nbsp; ${small}(${selectedCountNodesHidden}/</span>${small}${wholeNodesHidden})</span>`;
  if (!restrictToVisible()) {
    if (selectedCountNodesHidden > 0) {
      dispHidden = `&nbsp; ${big}(${selectedCountNodesHidden}/</span>${small}${wholeNodesHidden})</span>`;
    } else {
      dispHidden = `&nbsp; ${small}(${selectedCountNodesHidden}/</span>${big}${wholeNodesHidden})</span>`;
    }
  }
  display += dispHidden;
  labelNodes.innerHTML = display;

  // ------------ edges info

  display = "Edges &nbsp;";
  if (selectedCountEdgesVisible > 0) {
    display += `${big}${selectedCountEdgesVisible}/</span> ${small}${wholeEdgesVisible}</span>`;
  } else {
    display += `${small}${selectedCountEdgesVisible}/</span> ${big}${wholeEdgesVisible}</span>`;
  }
  // hidden
  dispHidden = `&nbsp;&nbsp; ${small}(${selectedCountEdgesHidden}/</span>${small}${wholeEdgesHidden})</span>`;
  if (!restrictToVisible()) {
    if (selectedCountEdgesHidden > 0) {
      dispHidden = `&nbsp; ${big}(${selectedCounEdgesHidden}/</span>${small}${wholeEdgesHidden})</span>`;
    } else {
      dispHidden = `&nbsp; ${small}(${selectedCountEdgesHidden}/</span>${big}${wholeEdgesHidden})</span>`;
    }
  }
  display += dispHidden;
  labelEdges.innerHTML = display;
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

export function changePosRelative(xFactor, yFactor) {
  // si au moins deux sélectionnés, on les écartent

  let nodesToMove = getCy().nodes(":selected:visible");
  if (nodesToMove.length < 2) nodesToMove = getCy().nodes(":visible");
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

export function selectOutputBetween(min, max) {
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
      var noLoop = loopEdges.length === 0;
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

export function selectInputBetween(min, max) {
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

export function increaseFontSize(delta) {
  let selectedNodes = perimeterForNodesAction();

  // getCy().style().selector("node").style("font-size", newSize).update();
  selectedNodes.forEach((node) => {
    const currentFontSize = parseFloat(node.style("font-size"));

    const newSize = Math.max(6, currentFontSize + delta);
    node.style("font-size", newSize);
  });
}

export function increaseFontSizeEdge(delta) {
  let selectedEdges = getCy().edges(":visible:selected");

  // S'il n'y a pas d'arêtes sélectionnées visibles, on prend toutes les visibles
  if (selectedEdges.length === 0) {
    selectedEdges = getCy().edges(":visible");
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
  let selectedNodes = perimeterForNodesAction();

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
*/

export function restoreProportionalSize() {
  //console.log("restore  size");
  cy.nodes().forEach((node) => {
    const degree = node.data("degree");
    if (degree >= 0) {
      const size = mapValue(degree, 1, 40, 20, 100);
      node.style({ width: size, height: size });
    }
  });
}
// Helper pour interpoler une valeur entre deux bornes
function mapValue(value, inMin, inMax, outMin, outMax) {
  const clamped = Math.max(inMin, Math.min(value, inMax));
  const ratio = (clamped - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
}

/*
 create a png image by button or ctrl g like graphic
*/
export function captureGraphAsPng() {
  const png = getCy().png({ full: false, scale: 2, bg: "white" });
  getCy().edges().addClass("forPNG");
  const link = document.createElement("a");
  link.href = png;
  link.download = "graph-capture.png";
  link.click();
  getCy().edges().removeClass("forPNG");
}

export function distributeNodesHorizontally() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
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

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function distributeNodesVertically() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
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

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function alignNodesVertically() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
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

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
}

export function alignNodesHorizontally() {
  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
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

  getCy().nodes(":visible").length === 0 ? getCy().fit() : null;
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

//-----------------------
export function rotateGraphByDegrees(deg) {
  const angle = (deg * Math.PI) / 180;

  let nodes = getCy().nodes(":selected:visible");
  if (nodes.length < 2) nodes = getCy().nodes(":visible");
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

/*
 select and show edges that rely two selected nodes 
*/

export function selectEdgesBetweenSelectedNodes() {
  const selectedNodes = getCy().nodes(":selected");
  if (selectedNodes.length === 0) {
    showAlert("no selected nodes to work with.");
    return;
  }

  const selectedIds = new Set(selectedNodes.map((n) => n.id()));

  const internalEdges = getCy()
    .edges()
    .filter((edge) => {
      const source = edge.source().id();
      const target = edge.target().id();
      return selectedIds.has(source) && selectedIds.has(target);
    });

  internalEdges.forEach((edge) => {
    edge.show(); // d'abord visible
    edge.select(); // ensuite sélectionné
  });
}

/*
 avoid far node wheh unhidden by limiting distance 
*/
export function revealNeighbor(edge, maxDist = 500) {
  const src = edge.source();
  const tgt = edge.target();

  // which one is hidden in the pair 
  const hiddenNode = tgt.hidden() ? tgt : src.hidden() ? src : null;
  const visibleNode = (hiddenNode === tgt) ? src : tgt;

  // none : no matter 
  if (hiddenNode) {
    // base : the previously visible 
    const pos = visibleNode.position();

    // a small move to avoid superposition 
    const angle = Math.random() * 2 * Math.PI;
    const dx = maxDist * Math.cos(angle);
    const dy = maxDist * Math.sin(angle);

    //  show in new position 
    hiddenNode.position({ x: pos.x + dx, y: pos.y + dy });
    hiddenNode.show();
  }
}
