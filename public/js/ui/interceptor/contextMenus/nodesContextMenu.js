import { getCy } from "../../../graph/cytoscapeCore.js";
import { menuNodes } from "../../menuNodes.js";
import { menuEdges } from "../../menuEdges.js";

import { openTable, openTriggerPage } from "../../../dbFront/tables.js";
import { follow, followTree } from "../../../graph/walker.js";
import { showAlert } from "../../dialog.js";
import { metrologie } from "../../../core/metrology.js";
import { NativeCategories } from "../../../util/common.js";
import {whereClicInContainer} from "../core.js";
export function setNodeContextMenu() {

  // trace current selection values
  getCy().on("select unselect", "node", function () {
    metrologie();
  });

  // bring to front selected nodes
  getCy().on("select", "node", function (evt) {
    const ele = evt.target;
    ele.style("z-index", Date.now());
  });

  // hide nodeMenu if a click on back
  document.addEventListener("click", () => {
    clicNodeMenu.style.display = "none";
    clicEdgeMenu.style.display = "none";
  });

  /*
      some cleaning action between two actions on Nodes menu
    */

  document.getElementById("NodesId").addEventListener("click", () => {
    // clean input text
    const input = document.getElementById("nameFilter");
    if (input) input.value = "";

    // clean result
    const result = document.getElementById("nameFilterResult");
    if (result) result.textContent = "";
  });

  // global to be reused once clicked on subMenu
  let nodeForInfo;

  getCy().on("cxttap", "node", function (evt) {
    nodeForInfo = evt.target;

    // Position rendue (px) du centre du nœud
    const center = nodeForInfo.renderedPosition();
    const topY = center.y - nodeForInfo.renderedHeight() / 2; // haut du nœud
    const anchor = { x: center.x, y: topY };

    // Convertir vers coords CSS du container (ta fonction existante)
    const { x, y } = whereClicInContainer(anchor);

    // Poser le menu au-dessus et centré sur le nœud
    const offsetY = 8; // petit décalage
    clicNodeMenu.style.left = `${x - (clicNodeMenu.offsetWidth || 0) / 2}px`;
    clicNodeMenu.style.top = `${
      y + 5 - (clicNodeMenu.offsetHeight || 0) - offsetY
    }px`;

    //  affichage conditionnel
    document.getElementById("open-trigger").style.display =
      nodeForInfo.hasClass(NativeCategories.HAS_TRIGGERS)
        ? "list-item"
        : "none";
    clicNodeMenu.classList.remove("hidden");
    clicNodeMenu.style.display = "block";
  });
  document.getElementById("open-table").addEventListener("click", () => {
    openTable(nodeForInfo.id());
    //openTable10rows(nodeForInfo.id())
  });

  document.getElementById("open-trigger").addEventListener("click", () => {
    if (nodeForInfo.data().triggers.length >= 1) {
      openTriggerPage(nodeForInfo);
    } else showAlert("no triggers on this table");
  });

  function commonArrow(direction) {
    // store current selected
    let selectedElements = getCy().elements(":visible:selected");
    selectedElements.unselect();

    // nodeForInfo is shared and set by the event as the target
    nodeForInfo.select();
    follow(direction);
    // restore previoous
    selectedElements.select();
  }
  document.getElementById("arrowLeft").addEventListener("click", () => {
    commonArrow("outgoing");
  });

  document.getElementById("arrowRight").addEventListener("click", () => {
    commonArrow("incoming");
  });

  document.getElementById("arrowMiddle").addEventListener("click", () => {
    commonArrow("both");
  });

  function commonTree(direction) {
    // store current selected nodes
    let selectedElements = getCy().elements(":visible:selected");
    selectedElements.unselect();

    // nodeForInfo is shared and set by the event as the target
    nodeForInfo.select();
    followTree(direction);
    // restore previous
    selectedElements.select();
  }

  document.getElementById("treeLeft").addEventListener("click", () => {
    commonTree("outgoing");
  });

  document.getElementById("treeRight").addEventListener("click", () => {
    commonTree("incoming");
  });

  document.getElementById("treeMiddle").addEventListener("click", () => {
    commonTree("both");
  });

  /*
     menu icons event  
    */

  document.getElementById("icon-selectAll").addEventListener("click", () => {
    menuNodes("all");
  });
  document.getElementById("icon-selectNone").addEventListener("click", () => {
    menuNodes("none");
  });
  document.getElementById("icon-selectSwap").addEventListener("click", () => {
    menuNodes("swapSelected");
  });
  /* hide in menu */
  document.getElementById("icon-hideSelected").addEventListener("click", () => {
    menuNodes("hideSelected");
  });

  document
    .getElementById("icon-hideNotSelected")
    .addEventListener("click", () => {
      menuNodes("hideNotSelected");
    });

  document.getElementById("icon-swapHidden").addEventListener("click", () => {
    menuNodes("swapHidden");
  });

  document.getElementById("icon-showAll").addEventListener("click", () => {
    menuNodes("showAll");
  });

// follow graph event 
   const svg = document.getElementById("follow-graph");

  svg.addEventListener("click", (e) => {
    const zone = e.target.closest(".zone");
    if (!zone || !svg.contains(zone)) return;

    menuNodes(zone.dataset.action, e);

    //triggerAction(zone.dataset.action);
  });
 
  const svgTree = document.getElementById("tree-follow-graph");

  // Clic souris / tactile
  svgTree.addEventListener("click", (e) => {
    const zone = e.target.closest(".zone");
    if (!zone || !svgTree.contains(zone)) return;

    menuNodes(zone.dataset.action, e);
  });

  const svgPassThroug = document.getElementById("pass-through-graph");

  // Clic souris / tactile
  svgPassThroug.addEventListener("click", (e) => {
    const zone = e.target.closest(".zone");
    if (!zone || !svgPassThroug.contains(zone)) return;
    menuNodes(zone.dataset.action, e);
  });

const svgRelations = document.getElementById("follow-relations");

  // Clic souris / tactile
  svgRelations.addEventListener("click", (e) => {
    const zone = e.target.closest(".zone");
    if (!zone || !svgRelations.contains(zone)) return;
    menuEdges(zone.dataset.action, e);
  });

  /*
 same icons in menus 
*/
  document
    .getElementById("quick_icon-selectAll")
    .addEventListener("click", () => {
      menuNodes("all");
    });
  document
    .getElementById("quick_icon-selectNone")
    .addEventListener("click", () => {
      menuNodes("none");
    });
  document
    .getElementById("quick_icon-selectSwap")
    .addEventListener("click", () => {
      menuNodes("swapSelected");
    });

  document
    .getElementById("quick_icon-hideSelected")
    .addEventListener("click", () => {
      menuNodes("hideSelected");
    });

  document
    .getElementById("quick_icon-hideNotSelected")
    .addEventListener("click", () => {
      menuNodes("hideNotSelected");
    });

  document
    .getElementById("quick_icon-swapHidden")
    .addEventListener("click", () => {
      menuNodes("swapHidden");
    });

  document
    .getElementById("quick_icon-showAll")
    .addEventListener("click", () => {
      menuNodes("showAll");
    });

}
