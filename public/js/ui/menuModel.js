"use strict";

import {
  findLongPathsOutgoing,
  findPkFkChains,
  ownerShipPerimeter,
} from "../graph/walkModel.js";

import {
  getCy,
} from "../graph/cytoscapeCore.js";
import {metrologie} from '../core/metrology.js';
import { getCustomNodesCategories } from "../filters/categories.js";

import {
  pushSnapshot,
} from "../util/snapshots.js";

import {
  showAlert,
  showInfo,
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
        organizeSelectedByDependencyLevelsWithCategories('custom'), // that select and return MD
        document
      );
      metrologie();
      break;


      
      
    case "dependenciesPerSchema":
      if (getCy().scratch('schemas').length == 1) {
        showInfo(
          " Only one schema. Same as 'all tables' option");
      }
      pushSnapshot();
      outputMarkdown(
        {
          download: false,
          copyToClipboard: true,
          title: "dependencies per category",
        },
        organizeSelectedByDependencyLevelsWithCategories('schema'), // that select and return MD
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

    case "findLongPathsOutgoing":
      pushSnapshot();
      findLongPathsOutgoing(getCy());
      break;

    case "findPkFkChains":
      findPkFkChains();
      break;
  }
}