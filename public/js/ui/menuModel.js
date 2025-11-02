"use strict";

import {
  findLongOutgoingPaths,
  findPkFkChains,
  ownerShipPerimeter,
} from "../graph/walker.js";

import {
  getCy,
  metrologie,
} from "../graph/cytoscapeCore.js";

import { getCustomNodesCategories } from "../filters/categories.js";

import {
  pushSnapshot,
} from "../graph/snapshots.js";

import {
  showAlert,
} from "./dialog.js";

import {
  organizeSelectedByDependencyLevels,
  organizeSelectedByDependencyLevelsWithCategories,
} from "../graph/specialLayout.js";

import { outputMarkdown } from "../util/markdown.js";

/*
 since v2.08 independant menu for specific to DB model 
*/
export function menuModel(option, item, whichClic = "left") {
  if (whichClic == "right") return; //for later parameters
  // select edges
  switch (option) {

    // filter table with column is in modalSelectByName called from popup

    // special layout for schema
    case "dependencies":
      pushSnapshot();
      outputMarkdown(
        {
          download: false,
          copyToClipboard: true,
          title: " dependencies ",
        },
        organizeSelectedByDependencyLevels(), // that return text
        document
      );
      metrologie();
      break;

    case "dependenciesPerCustomCategory":
      if (getCustomNodesCategories().size == 0) {
        showAlert(
          " No custom catagories defined for this DB<br/> see customization options"
        );
        return;
      }
      pushSnapshot();
      outputMarkdown(
        {
          download: false,
          copyToClipboard: true,
          title: "dependencies per category",
        },
        organizeSelectedByDependencyLevelsWithCategories(), // that select and return MD
        document
      );
      metrologie();
      break;

    case "ownerShipPerimeter":
      ownerShipPerimeter(false);
      break;

    case "ownerShipPerimeterMandatory":
      ownerShipPerimeter(true);
      break;

    case "findLongOutgoingPaths":
      pushSnapshot();
      findLongOutgoingPaths(getCy());
      break;

    case "findPkFkChains":
      findPkFkChains();
      break;

      /*      showWaitCursor();
      cy.batch(() => {
        // regroupement + compactage local
      buildCompositeGroups(cy);

      // trace of hierarchy before collapsing
      const hierarchy = buildHierarchyTXT(cy);
      //console.log(hierarchy);
      setClipReport("composition", hierarchy);


        // tous les composites démarrent en mode "collapsed"
        cy.nodes(":parent").forEach((p) => collapseComposite(p));
  
      });
      cy.style().update();
      hideWaitCursor();



      hideWaitCursor();
      cy.fit(); */


  }
}