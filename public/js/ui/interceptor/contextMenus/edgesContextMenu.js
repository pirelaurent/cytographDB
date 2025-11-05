import { getCy } from "../../../graph/cytoscapeCore.js";
import { metrologie } from "../../../core/metrology.js";
import { NativeCategories, ConstantClass } from "../../../util/common.js";

import {
  enterFkDetailedModeForEdges,
  enterFkSynthesisModeForEdges,
} from "../../../graph/detailedEdges.js";
import {whereClicInContainer} from "../core.js";

/*
   all about context menu for edges
*/


export function setEdgeContextMenu() {
  getCy().on("select unselect", "edge", function () {
    metrologie();
  });

  /*
       contextual menu for edge 
      */

  let edgeForInfo;
  const clicEdgeMenu = document.getElementById("clicEdgeMenu");

  getCy().on("cxttap", "edge", function (evt) {
    edgeForInfo = evt.target;
    const option = document.getElementById("toggleEdgeDetails");
    option.classList.remove("hidden");
    if (edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT)) {
      option.classList.add("hidden");
    }

    const { x, y } = whereClicInContainer(evt.renderedPosition);
    clicEdgeMenu.style.left = `${x - 10}px`;
    clicEdgeMenu.style.top = `${y - 20}px`;
    clicEdgeMenu.classList.remove("hidden");
    clicEdgeMenu.style.display = "block";
  });

  /*
       back to synth from edge contextual menu
      */

  document.getElementById("toggleEdgeDetails").addEventListener("click", () => {
    const cy = getCy();

    if (!edgeForInfo || edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT))
      return;

    let synthEdges = cy.collection([edgeForInfo]);

    const isSynth = edgeForInfo.hasClass(ConstantClass.FK_SYNTH);
    const label = edgeForInfo.data("label");

    cy.batch(() => {
      if (isSynth) {
        // Go to detailed mode for this one
        enterFkDetailedModeForEdges(cy.collection(edgeForInfo));
      } else {
        // Switch back to synth mode for all visible edges sharing the same label
        const edges = cy.$(`edge:visible[label = "${label}"]`);

        // Set _display for those missing it
        edges.filter("[!_display]").data("_display", label);

        enterFkSynthesisModeForEdges(edges);
      }
    });
  });

  // change label or columns on edge contextual menu

  document.getElementById("toggleEdgeLabel").addEventListener("click", () => {
    if (
      edgeForInfo.hasClass(NativeCategories.TRIGGER_IMPACT) ||
      edgeForInfo.hasClass(ConstantClass.FK_SYNTH) ||
      edgeForInfo.hasClass(NativeCategories.SIMPLIFIED)
    ) {
      edgeForInfo.toggleClass(`${ConstantClass.SHOW_LABEL}`);
    } else if (edgeForInfo.hasClass(ConstantClass.FK_DETAILED)) {
      edgeForInfo.toggleClass(ConstantClass.SHOW_COLUMNS);
    }

    if (!edgeForInfo.data("_display")) {
      edgeForInfo.data("_display", edgeForInfo.data("label"));
    }
  });
}
