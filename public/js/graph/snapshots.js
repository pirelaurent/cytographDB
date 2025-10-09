"use strict";
/*
 snapshot(s) connected to undo and ctrl Z
 redo : ctrl y 
*/

import { restoreProportionalSize } from "./cytoscapeCore.js";

import { getCy } from "./cytoscapeCore.js";

export let positionStackUndo = [];
const maxUndo = 25;
let cursorStack = -1;
let lastStackOperation;

/*
  save current graph in stack 
*/
export function pushSnapshot(trace = "") {
  const cy = getCy();
  if (!cy) return;

  const snapshot = {
    json: cy.json(),
    selectedIds: cy.elements(":selected").map((ele) => ele.id()),
    hiddenIds: cy.elements(":hidden").map((ele) => ele.id()),
    labelStyles: cy.nodes().map((n) => ({
      id: n.id(),
      fontSize: n.style("font-size"),
      fontFamily: n.style("font-family"),
      fontWeight: n.style("font-weight"),
      color: n.style("color"),
      textOutlineWidth: n.style("text-outline-width"),
      textOutlineColor: n.style("text-outline-color"),
    })),
  };

  // coupe le "futur" si on avait fait des undo
  if (cursorStack < positionStackUndo.length - 1) {
    positionStackUndo.length = cursorStack + 1; // tronque en place
  }
  // add on top
  positionStackUndo.push(snapshot);

  // limite de taille
  if (positionStackUndo.length > maxUndo) {
    positionStackUndo.shift();
    cursorStack -= 1; // IMPORTANT : réaligner le curseur
  }

  cursorStack = positionStackUndo.length - 1; // pointeur sur le dernier
  lastStackOperation = "pushSnapshot";

  //console.log(trace+" "+cursorStack);//PLA
}

/*
 clean cache in case of change model 
*/
export function resetSnapshot() {
  positionStackUndo = [];
  cursorStack = -1;
}

/*
 restore saved point 
 To be able to restore current state with undo (ctrl y)
 - add a new snapshot on top 
 - if we have begun to pop, don't do otherwise will loose upper states
  The lastStackOperation remember the action   
*/

export function popSnapshot(trace = "") {
  // undo
  if (cursorStack >= 0) {
    // allow redo on current screen if regret
    if (lastStackOperation === "pushSnapShot") {
      pushSnapshot("[auto-before-undo]");
    }
    lastStackOperation = "popSnapshot";

    //console.log(trace+" "+cursorStack);//PLA
    setCurrentState();
    cursorStack -= 1;
  }
}

export function reDoSnapshot() {
  // redo
  if (cursorStack < positionStackUndo.length - 1) {
    //console.log(`redo : ${cursorStack}  length : ${positionStackUndo.length} `); //PLA
    cursorStack += 1;
    setCurrentState();
  }
}

/*
 restore a json including select and hide
*/
function setCurrentState() {
  const cy = getCy();

  const snapshot = positionStackUndo[cursorStack];

  if (!cy || !snapshot) return;

  cy.elements().remove(); // optionnel : cy.json(snapshot.json) réécrit déjà
  cy.json(snapshot.json);

  cy.elements().unselect();
  snapshot.selectedIds?.forEach((id) => {
    const el = cy.getElementById(id);
    if (el && el.length) el.select();
  });

  cy.elements().removeClass("faded");
  cy.elements().show();
  snapshot.hiddenIds?.forEach((id) => {
    const el = cy.getElementById(id);
    if (el && el.length) el.hide();
  });

  restoreProportionalSize();
  snapshot.labelStyles.forEach(({ id, ...style }) => {
    const ele = cy.getElementById(id);
    if (ele.nonempty()) {
      Object.entries(style).forEach(([k, v]) => ele.style(k, v));
    }
  });
}
