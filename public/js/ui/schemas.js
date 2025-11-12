
import { getCy } from "../graph/cytoscapeCore.js";
import {perimeterForNodesSelection} from "../core/perimeter.js"
/*
 create a list of schemas found in DB
*/
export function fillInGuiNodesSchemasCategories() {
  // find position in menus
  const container = document.getElementById("schemaList");

  // create or get submenu
  let submenu = container.querySelector(".submenu");
  if (!submenu) {
    submenu = document.createElement("ul");
    submenu.classList.add("submenu");
    container.appendChild(submenu);
  }

  // Supprime les anciens éléments
  submenu.querySelectorAll("li.dynamic-data-key").forEach((el) => el.remove());

  // Add new schemas
  const cy = getCy();
  const schemasSet = cy.scratch("schemas");
  for (let key of schemasSet) {
    const li = document.createElement("li");
    li.classList.add("dynamic-data-key");
    li.setAttribute("data-key", key);
    li.textContent = key;
    li.addEventListener("click", () => {
      selectNodesBySchemas(key);
    });
    submenu.appendChild(li);
  }
}

/*
  following eventlistener set in dynamic list 
  filter nodes by schema name
*/

function selectNodesBySchemas(aSchema) {
 const nodes = perimeterForNodesSelection();
   nodes.filter(n => n.id().startsWith(`${aSchema}.`)).select() ;
}
