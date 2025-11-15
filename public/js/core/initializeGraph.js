import { getCy } from "../graph/cytoscapeCore.js";
import {
  createCustomCategories,
  getCustomStyles,
} from "../filters/categories.js";
import { fillInGuiNodesCustomCategories } from "../ui/custom.js";
import { fillInGuiNodesSchemasCategories } from "../ui/schemas.js";
import { getLocalDBName } from "../dbFront/tables.js";
import { setAndRunLayoutOptions } from "./layout.js";
import { getCyStyles } from "../graph/defaultStyles.js";
import { metrologie } from "./metrology.js";

//--------------------------
export function initializeGraph(data, fromDisk = false) {
  const cy = getCy();
  // cy a été créé avec des data vides , mais si on s'en est servi, faut nettoyer
  if (typeof cy !== "undefined" && cy) {
    cy.elements().remove();
  }



  cy.add(data);
  // store schemas info in scratch pad 
  cy.scratch('schemas', data.schemas);
  cy.scratch('tableNameSolver', new Map(data.tableNameSolver));


  fillInGuiNodesSchemasCategories()

  //console.log(cy.edges()); // on a bien columnsLabel dans data

  let current_db = getLocalDBName();

  // customize nodes**to be moved after reduction
  //setNativeNodesCategories();

  createCustomCategories(current_db);


  // here ok for alias
  let moreStyles = getCustomStyles(current_db);
  let mergedStyles = getCyStyles().concat(moreStyles);
  cy.style(mergedStyles).update();

  fillInGuiNodesCustomCategories();
  cy.once("layoutstop", () => { });

  //avoid layout when come from disk
  if (!fromDisk) {
    setAndRunLayoutOptions();
  }
  metrologie();
}

