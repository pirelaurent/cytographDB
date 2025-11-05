"use strict";

import { getCy, captureGraphAsPng } from "../../graph/cytoscapeCore.js";

import { popSnapshot } from "../../util/snapshots.js";

import {
  menuSelectSizeOutgoing,
  menuSelectSizeIncoming,
  helpRegex,
} from "../dialog.js";

import { setModalInterceptors } from "../modal.js";
import { showClipReport } from "../../util/clipReport.js";
import { setHoverInterceptors } from "./hover.js";
import { setNodeContextMenu } from "./contextMenus/nodesContextMenu.js";
import { setEdgeContextMenu } from "./contextMenus/edgesContextMenu.js";
import { setQuickAccessMenu } from "./contextMenus/quickAccessMenu.js";
import { setKeyboardInterceptors } from "./keyboard.js";
/*
 all the events set in gui are defined here 
*/

export function setInterceptors() {
  //--------- set events'trap for cy

  setModalInterceptors(); // isolated in main module modal.js
  setHoverInterceptors();
  setNodeContextMenu();
  setEdgeContextMenu();
  setQuickAccessMenu();
  setKeyboardInterceptors();
  setMainBarInterceptors();


/*
 isolation of main bar events 
*/
  function setMainBarInterceptors(){

  // action for button undo
  document.getElementById("undo-btn").addEventListener("click", () => {
    popSnapshot("undo button");
  });

  // action for clipReprot
  document.getElementById("clip-btn").addEventListener("click", () => {
    showClipReport();
  });

  // show red when AND selection

  const select = document.getElementById("modeSelect");
  select.addEventListener("change", function () {
    if (select.value === "AND") {
      select.classList.add("AND-select");
    } else {
      select.classList.remove("AND-select");
    }
  });

  // Facultatif : appliquer au chargement si nécessaire
  if (select.value === "AND") {
    select.classList.add("AND-select");
  } 
  }


  // clic hors éléments
  getCy().on("tap", function (event) {
    if (event.target === getCy()) {
      getCy().elements().unselect();
      getCy().elements().removeClass("faded start-node");

      getCy().edges(":selected").removeClass("internal outgoing incoming");
    } else if (event.target.isNode && event.target.isNode()) {
      // pushSnapshot('tapNode');
    } else if (event.target.isEdge && event.target.isEdge()) {
      // pushSnapshot('tapEdge');
    }
  });

// Pour un EVENT Cytoscape (evt) ou DOM (MouseEvent/PointerEvent/KeyboardEvent)
function isCtrl(evt) {
  // Sur les events Cytoscape, l'event natif est dans evt.originalEvent
  const e = evt && evt.originalEvent ? evt.originalEvent : evt;

  // 1) Flags standards
  if (e && (e.ctrlKey || e.metaKey)) return true;

  // 2) Fallback robuste (certains browsers/événements tactiles)
  if (e && typeof e.getModifierState === 'function') {
    return e.getModifierState('Control') || e.getModifierState('Meta');
  }

  // 3) Par défaut
  return false;
}

 let ctrlPressed =false;
  let previousSelection = null; //shared between start and end 
  getCy().on("boxstart", (e) => {
    //pushSnapshot('boxStart');
    ctrlPressed = isCtrl(e);
    if (ctrlPressed) {
      previousSelection = getCy().elements(":selected"); // snapshot AVANT
      //console.log('boxstart '+previousSelection.length)
    previousSelection.unselect().addClass('doubleSelect');
      //console.log("Marqués doubleSelect:", previousSelection.length);
    }
  });

  /*
 several attempt to catch edge inside the select box. no good answers. 
*/
  getCy().on("boxend", () => {
    if (ctrlPressed) {
      setTimeout(() => {
        const currentSelection = getCy().elements(":selected");
        // add selection of
        const newlySelected = previousSelection.difference(currentSelection);
        currentSelection.unselect();
        newlySelected.select();
        previousSelection.removeClass('doubleSelect');
        //previousSelection.forEach((elt) => elt.removeClass("doubleSelect"));
        previousSelection = null;
      }, 0); // ⚡ 0 millisecondes suffit pour passer au cycle suivant
    }
  });

  /*
  set back color at startup
  */

  document.getElementById("cy").style.backgroundColor = "white";
  /*
   add capture png
  */
  document.getElementById("btn-export").addEventListener("click", () => {
    captureGraphAsPng();
  });

  const btn = document.getElementById("btnSizeOutgoing");
  if (btn) {
    btn.addEventListener("click", menuSelectSizeOutgoing);
  }
  const btnIn = document.getElementById("btnSizeIncoming");
  if (btnIn) {
    btnIn.addEventListener("click", menuSelectSizeIncoming);
  }

  const tipsBtn = document.getElementById("tipsBtn");
  tipsBtn.addEventListener("click", () => {
    helpRegex();
  });
} // setInterceptor


    
      /*
    useful to position contextual menu in current container
     */

  export function whereClicInContainer(renderedPos) {
    const containerRect = getCy().container().getBoundingClientRect();
    // real pos in window
    const x = containerRect.left + renderedPos.x;
    const y = containerRect.top + renderedPos.y;
    return { x, y };
  }
    