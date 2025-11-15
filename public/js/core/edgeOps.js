
import { getCy } from "../graph/cytoscapeCore.js";
import { perimeterForEdgesAction, perimeterForNodesAction } from "../core/perimeter.js";
import { ConstantClass } from "../util/common.js";
import { showAlert, showInfo, showToast } from "../ui/dialog.js";
import { pushSnapshot, popSnapshot } from "../util/snapshots.js";

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

  const selectedNodes = perimeterForNodesAction();

  if (selectedNodes.length < 2) {
    showAlert("not enough selected nodes to work with.");
    return;
  }

  pushSnapshot();
  const selectedIds = new Set(selectedNodes.map((n) => n.id()));

  const internalEdges = getCy()
    .edges()
    .filter((edge) => {
      const source = edge.source().id();
      const target = edge.target().id();
      return selectedIds.has(source) && selectedIds.has(target);
    });


  if (internalEdges.length == 0) {
    popSnapshot();
    showInfo("no edges found between selected nodes.")
  } else {
    internalEdges.select();
  }
}

function oneLabelPerEdge(edge) {
  if (edge.hasClass(ConstantClass.FK_DETAILED)) {
    edge.addClass(`${ConstantClass.SHOW_COLUMNS}`);
    //labelToShow = ele.data('columnsLabel').replace('\n', "<BR/>");
  } else {
    // FK_SYNTH
    edge.addClass(`${ConstantClass.SHOW_LABEL}`);
  }
}

/*
 acts on availables edges in the current perimeter (all visible or selected if any selected)
*/
export function labelFKAlias() {
  const cy = getCy();
  let aliased = 0;
  cy.batch(() => {
    let edgesToShow = perimeterForEdgesAction();

    edgesToShow.forEach((e) => {
      const alias = e.data("alias");
      if (alias) {
        e.data("_display", alias)
      } else {
        e.data("_display", e.data("label"));
      }
      oneLabelPerEdge(e);
      aliased += 1;

    });
  });
  showToast(`${aliased} edges shown with alias.`);
}


export function labelFKId() {
  const cy = getCy();
    let edgesToShow = perimeterForEdgesAction();
  cy.batch(() => {
    edgesToShow.forEach((e) => {
      e.data("_display", e.data("label"));
      oneLabelPerEdge(e);
    });

  });
  showToast(`${edgesToShow.length} edges shown with standard id.`);
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

export function labelStandardOrientation() {
  let edges = perimeterForEdgesAction();
  edges.removeClass('labelAbove');
}
export function labelAutoRotateOrientation() {
  let edges = perimeterForEdgesAction();
  edges.addClass('labelAbove');
}

export function labelRestoreOrientation() {
  let cy = getCy();
  cy.edges().removeClass('labelAbove');
}
