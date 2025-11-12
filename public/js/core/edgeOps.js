
import { getCy } from "../graph/cytoscapeCore.js";
import {perimeterForEdgesAction} from "../core/perimeter.js";
import { ConstantClass } from "../util/common.js";
import { showAlert} from "../ui/dialog.js";

// all about edges  (FKs, hide, selection, labels, police).

export function changeFontSizeEdge(value, increase = true) {
  let selectedEdges = getCy().edges(":visible:selected");

  // S'il n'y a pas d'arêtes sélectionnées visibles, on prend toutes les visibles
  if (selectedEdges.length === 0) {
    selectedEdges = getCy().edges(":visible");
  }

  selectedEdges.forEach((edge) => {
    const currentFontSize = parseFloat(edge.style("font-size")) || 10; // valeur par défaut
    const newSize = increase ? Math.max(6, currentFontSize + value) : value;
    edge.style("font-size", newSize);
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

  internalEdges.show().select();
}

function labelFKShow() {
  // Show visible edges, or selected ones if any are selected
  let edgesToShow = perimeterForEdgesAction();

  for (let edge of edgesToShow) {
    if (edge.hasClass(ConstantClass.FK_DETAILED)) {
      edge.addClass(`${ConstantClass.SHOW_COLUMNS}`);
      //labelToShow = ele.data('columnsLabel').replace('\n', "<BR/>");
    } else {
      // FK_SYNTH
      edge.addClass(`${ConstantClass.SHOW_LABEL}`);
    }
  }
}

export function labelFKAlias() {
  const cy = getCy();
  cy.edges().forEach((e) => {
    const alias = e.data("alias");
    if (alias) e.data("_display", alias);
    else e.data("_display", e.data("label"));
  });
  labelFKShow();
}

export function labelFKId() {
  const cy = getCy();
  cy.edges().forEach((e) => {
    e.data("_display", e.data("label"));
  });
  labelFKShow();
}



export function labelFKHide() {
  let edgesToHide = perimeterForEdgesAction();
  edgesToHide.removeClass(
    `${ConstantClass.SHOW_COLUMNS} ${ConstantClass.SHOW_LABEL}`
  );
}


// in graph with nested nodes, hide edges that rely hidden nodes
export function hideDanglingEdges() {
  cy.edges().forEach(e => {
    const src = e.source();
    const tgt = e.target();
    if (src.hasClass('hidden-child') || tgt.hasClass('hidden-child')) {
      e.addClass('hidden-edge');
    } else {
      e.removeClass('hidden-edge');
    }
  });
}

  export function labelStandardOrientation(){
    let edges=perimeterForEdgesAction();
    edges.removeClass('labelAbove');
  }
  export function labelAutoRotateOrientation(){
    let edges=perimeterForEdgesAction();
    edges.addClass('labelAbove');
  }
  
  export function labelRestoreOrientation(){
    let cy=getCy();
    cy.edges().removeClass('labelAbove');
  }
